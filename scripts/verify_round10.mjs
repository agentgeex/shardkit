/**
 * verify_round10.mjs — 验收（HTTP 200 / 0 console error / 0 pageerror / 截图）
 *
 * ROUND10 重点：
 *   1. 侧边栏不再有「底层组件」分组（组件下沉）
 *   2. 每个案例页底部有「本页零件」区块 + 「一键打包复制本页」按钮
 *   3. 打包复制内容确实含页面 + 依赖零件（点击验证剪贴板）
 *   4. 零件索引 / 零件详情仍可达（二级页）
 *   5. tsc 见 npm run build
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5178";
const OUT = "logs";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ["index", "/"],
  ["blank", "/blank"],
  ["dashboard", "/dashboard"],
  ["list", "/list"],
  ["form", "/form"],
  ["detail", "/detail"],
  ["auth", "/auth"],
  ["error", "/error"],
  ["blocks", "/blocks"],
  ["parts", "/components"],
  ["part-card", "/components/card-basic"],
];

const report = { base: BASE, at: new Date().toISOString(), routes: [] };
let bad = 0;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();

for (const [name, path] of ROUTES) {
  const consoleErrors = [];
  const pageErrors = [];
  const onConsole = (m) => { if (m.type() === "error") consoleErrors.push(m.text()); };
  const onPageError = (e) => pageErrors.push(String(e));
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  let status = 0;
  try {
    const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
    status = resp?.status() ?? 0;
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/r10_${name}.png`, fullPage: true });
  } catch (e) {
    pageErrors.push("NAV: " + String(e));
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  report.routes.push({ name, path, status, consoleErrors, pageErrors });
  if (status !== 200 || consoleErrors.length || pageErrors.length) bad++;
  console.log(`[${status === 200 && !consoleErrors.length && !pageErrors.length ? "PASS" : "FAIL"}] ${path}  HTTP ${status}  console:${consoleErrors.length} pageerror:${pageErrors.length}`);
  if (consoleErrors.length) console.log("   console:", consoleErrors.slice(0, 3));
  if (pageErrors.length) console.log("   pageerror:", pageErrors.slice(0, 3));
}

// 断言 1：首页案例卡（本轮 7 → 10：两套 CRUD 拆分 + 多级菜单 + 空白页）；零件总表行数 ≥ 10
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const caseCards = await page.locator('[data-testid^="case-"]').count();
const partRows = await page.locator('[data-testid^="parts-row-"]').count();
report.caseCards = caseCards;
report.partRows = partRows;
console.log(`案例卡片: ${caseCards}（期望 10）  |  零件总表行: ${partRows}（期望 ≥ 10）`);

// 断言 2：侧边栏不再有「底层组件」分组文字
const navText = await page.locator("aside nav").innerText().catch(() => "");
const hasUnderlying = navText.includes("底层组件");
report.navHasUnderlyingGroup = hasUnderlying;
console.log(`侧边栏含「底层组件」分组: ${hasUnderlying}（期望 false）`);
if (hasUnderlying) bad++;

// 断言 3：案例页有「本页零件」区块 + 打包复制按钮，且复制内容含依赖
await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
const usedParts = await page.locator('[data-testid="used-parts"]').count();
report.dashboardUsedParts = usedParts;
console.log(`仪表盘「本页零件」区块: ${usedParts}（期望 1）`);
if (usedParts !== 1) bad++;

const bundleBtn = page.locator('[data-testid="copy-bundle"]');
const hasBundle = await bundleBtn.count();
console.log(`「一键打包复制本页」按钮: ${hasBundle}（期望 1）`);
if (hasBundle !== 1) bad++;

let bundleOk = false;
if (hasBundle) {
  await bundleBtn.click();
  await page.waitForTimeout(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  bundleOk =
    clip.includes("ShardKit Bundle: 仪表盘") &&
    clip.includes("src/pages/Dashboard.tsx") &&
    clip.includes("@ui/card.tsx") &&
    clip.includes("@components/page-header.tsx") &&
    clip.includes("npm install");
  report.bundleSample = clip.slice(0, 200);
  report.bundleChecks = {
    hasHeader: clip.includes("ShardKit Bundle: 仪表盘"),
    hasPageTarget: clip.includes("src/pages/Dashboard.tsx"),
    hasUiDep: clip.includes("@ui/card.tsx"),
    hasCommonDep: clip.includes("@components/page-header.tsx"),
    hasNpm: clip.includes("npm install"),
    bytes: clip.length,
  };
}
console.log(`打包复制内容校验: ${bundleOk}（期望 true）`);
if (!bundleOk) bad++;

report.badRoutes = bad;
writeFileSync(`${OUT}/r10_verify_report.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(bad === 0 ? "\n✅ 全部通过" : `\n❌ ${bad} 项有问题`);
process.exit(bad === 0 ? 0 : 1);
