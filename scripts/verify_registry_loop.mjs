/**
 * verify_registry_loop.mjs — 证明"注册表驱动"闭环
 *
 * 步骤：
 *  1. 记录当前 gallery 卡片数
 *  2. 跑 build-registry（模拟"放新条目 → 重新构建"）
 *  3. 重载页面，确认卡片数 +1 且新条目可见、可进详情、可预览
 *  4. 输出新条目 id 与预览按钮数
 *
 * 用法：node scripts/verify_registry_loop.mjs <newItemId>
 */
import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = "http://localhost:5178";
const NEW_ID = process.argv[2];
if (!NEW_ID) {
  console.error("用法: node scripts/verify_registry_loop.mjs <newItemId>");
  process.exit(2);
}
const OUT = join(ROOT, "logs");
mkdirSync(OUT, { recursive: true });

const itemDir = join(ROOT, "registry-items", NEW_ID);
if (!existsSync(itemDir)) {
  console.error("条目目录不存在:", itemDir);
  process.exit(2);
}

// 1) build-registry
console.log("[loop] build:registry…");
const buildOut = execSync("node scripts/build-registry.mjs", { cwd: ROOT, encoding: "utf8" });
console.log(buildOut.trim());

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
const consoleErrors = [];
const pageErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => pageErrors.push(String(e)));

// 2) reload gallery (reload 强制 Vite 重新求值 registry/index.json)
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="gallery-grid"]');
await page.waitForTimeout(600);
const cards = await page.locator('[data-testid="gallery-card"]').count();
const newVisible = (await page.locator(`[data-item-id="${NEW_ID}"]`).count()) > 0;
console.log("[loop] gallery cards:", cards, "| new item visible:", newVisible);

// 3) detail of new item
const r = await page.goto(`${BASE}/detail/${NEW_ID}`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-testid="detail-page"]');
await page.waitForSelector('[data-testid="detail-preview"]');
await page.waitForTimeout(800);
const previewButtons = await page.locator('[data-testid="detail-preview"] button').count();
const title = await page.locator('[data-testid="detail-title"]').innerText();
const sourceHighlighted = (await page.locator(".shiki-block pre").count()) > 0;
await page.screenshot({ path: join(OUT, `m1_registry_loop_${NEW_ID}.png`), fullPage: true });

const report = {
  newItemId: NEW_ID,
  galleryCards: cards,
  newItemVisibleInGallery: newVisible,
  detailHttpStatus: r?.status(),
  detailTitle: title,
  previewButtons,
  sourceHighlighted,
  consoleErrors,
  pageErrors,
  ok: newVisible && (r?.status() === 200) && previewButtons >= 0 && consoleErrors.length === 0 && pageErrors.length === 0,
};
console.log("\n===== REGISTRY LOOP VERIFY =====");
console.log(JSON.stringify(report, null, 2));

await browser.close();
process.exit(report.ok ? 0 : 1);
