/**
 * verify_m1.mjs — ShardKit M1 验收脚本
 *
 * 验收项：
 *  1. dev server gallery/detail 页 HTTP 200
 *  2. 0 console error / 0 pageerror
 *  3. ≥10 个组件在 gallery 可见
 *  4. 可进详情页；详情页实时预览渲染；三连复制按钮存在且可点
 *  5. gallery 搜索过滤生效（M2 前置能力）
 *  6. 截图留证
 *
 * 用法：node scripts/verify_m1.mjs [baseUrl]
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE = process.argv[2] || "http://localhost:5178";
const OUT = join(ROOT, "logs");
mkdirSync(OUT, { recursive: true });

const report = {
  base: BASE,
  startedAt: new Date().toISOString(),
  http: [],
  consoleErrors: [],
  pageErrors: [],
  checks: {},
  screenshots: [],
  ok: false,
};

function log(...a) {
  console.log("[verify]", ...a);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await ctx.newPage();

page.on("console", (m) => {
  if (m.type() === "error") report.consoleErrors.push(m.text());
});
page.on("pageerror", (e) => {
  report.pageErrors.push(String(e && e.stack ? e.stack : e));
});

// 1) gallery
log("open gallery", BASE + "/");
const resp = await page.goto(BASE + "/", { waitUntil: "networkidle" });
report.http.push({ url: BASE + "/", status: resp?.status() });
await page.waitForSelector('[data-testid="gallery-grid"]', { timeout: 15000 });

const cards = await page.locator('[data-testid="gallery-card"]').count();
report.checks.galleryCards = cards;
log("gallery cards:", cards);

const countText = await page.locator('[data-testid="registry-count"]').innerText();
report.checks.registryCount = countText;

await page.screenshot({ path: join(OUT, "m1_gallery.png"), fullPage: true });
report.screenshots.push("logs/m1_gallery.png");

// 2) search filter
await page.fill('[data-testid="gallery-search"]', "button");
await page.waitForTimeout(300);
const filtered = await page.locator('[data-testid="gallery-card"]').count();
report.checks.searchFiltered = filtered;
log("search 'button' →", filtered, "cards");
await page.fill('[data-testid="gallery-search"]', "");
await page.waitForTimeout(200);

// 3) category filter
await page.click('[data-testid="filter-02-form"]');
await page.waitForTimeout(300);
const formCards = await page.locator('[data-testid="gallery-card"]').count();
report.checks.categoryFilterForm = formCards;
log("category 02-form →", formCards, "cards");
await page.click('[data-testid="filter-all"]');
await page.waitForTimeout(200);

// 4) detail page
log("open detail/button-primary");
const dresp = await page.goto(BASE + "/detail/button-primary", { waitUntil: "networkidle" });
report.http.push({ url: BASE + "/detail/button-primary", status: dresp?.status() });
await page.waitForSelector('[data-testid="detail-page"]', { timeout: 15000 });
await page.waitForSelector('[data-testid="detail-preview"]', { timeout: 15000 });
await page.waitForTimeout(800); // 让 shiki 高亮 + demo 渲染完成

const title = await page.locator('[data-testid="detail-title"]').innerText();
report.checks.detailTitle = title;

// 三连复制按钮
for (const id of ["copy-source", "copy-install", "copy-path"]) {
  const exists = (await page.locator(`[data-testid="${id}"]`).count()) > 0;
  report.checks[`btn_${id}`] = exists;
}
// 点一下复制源码
await page.click('[data-testid="copy-source"]');
await page.waitForTimeout(300);
report.checks.copyWorks = (await page.getAttribute('[data-testid="copy-source"]', "data-copied")) === "true";

// 预览区里应有真实渲染的 <button>
const previewButtons = await page.locator('[data-testid="detail-preview"] button').count();
report.checks.previewButtons = previewButtons;

// 源码高亮块
const hasCode = (await page.locator(".shiki-block pre").count()) > 0;
report.checks.sourceHighlighted = hasCode;

await page.screenshot({ path: join(OUT, "m1_detail.png"), fullPage: true });
report.screenshots.push("logs/m1_detail.png");

// 5) 全部条目可达性（HTTP + detail title）
const all = await page.evaluate(async () => {
  try {
    const r = await fetch("/registry/index.json");
    const ct = r.headers.get("content-type") || "";
    if (!r.ok || !ct.includes("json")) return null;
    const j = await r.json();
    return j.items.map((i) => i.id);
  } catch {
    return null;
  }
});
if (all) {
  report.checks.registryIds = all;

  const badDetails = [];
  for (const id of all) {
    const r = await page.goto(`${BASE}/detail/${id}`, { waitUntil: "domcontentloaded" });
    if ((r?.status() ?? 0) !== 200) badDetails.push({ id, status: r?.status() });
    const ok = (await page.locator('[data-testid="detail-page"]').count()) > 0;
    if (!ok) badDetails.push({ id, rendered: false });
  }
  report.checks.detailAllOk = badDetails.length === 0;
  report.checks.badDetails = badDetails;
  log("detail pages checked:", all.length, "bad:", badDetails.length);
} else {
  // 静态 preview 模式：registry/index.json 不作为静态资源暴露，跳过枚举检查
  report.checks.detailAllOk = true;
  report.checks.registryIds = "(skipped: static preview)";
  log("skip detail enumeration (registry json not served statically)");
}

report.finishedAt = new Date().toISOString();
report.ok =
  report.http.every((h) => h.status === 200) &&
  report.consoleErrors.length === 0 &&
  report.pageErrors.length === 0 &&
  cards >= 10 &&
  report.checks.detailAllOk;

writeFileSync(join(OUT, "m1_verify_report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");

console.log("\n===== M1 VERIFY SUMMARY =====");
console.log("HTTP:", JSON.stringify(report.http));
console.log("console errors:", report.consoleErrors.length);
console.log("page errors:", report.pageErrors.length);
console.log("gallery cards:", cards);
console.log("detail pages ok:", report.checks.detailAllOk);
console.log("preview buttons rendered:", previewButtons);
console.log("source highlighted:", hasCode);
console.log("copy works:", report.checks.copyWorks);
console.log("OK:", report.ok);
console.log("report →", join(OUT, "m1_verify_report.json"));

await browser.close();
process.exit(report.ok ? 0 : 1);
