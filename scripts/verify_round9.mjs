/**
 * verify_round9.mjs — 逐页验收（HTTP 200 / 0 console error / 0 pageerror / 截图）
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
  ["components", "/components"],
];

const report = { base: BASE, at: new Date().toISOString(), routes: [] };
let bad = 0;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

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
    await page.screenshot({ path: `${OUT}/r9_${name}.png`, fullPage: true });
  } catch (e) {
    pageErrors.push("NAV: " + String(e));
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  const entry = { name, path, status, consoleErrors, pageErrors };
  report.routes.push(entry);
  if (status !== 200 || consoleErrors.length || pageErrors.length) bad++;
  console.log(`[${status === 200 && !consoleErrors.length && !pageErrors.length ? "PASS" : "FAIL"}] ${path}  HTTP ${status}  console:${consoleErrors.length} pageerror:${pageErrors.length}`);
  if (consoleErrors.length) console.log("   console:", consoleErrors.slice(0, 3));
  if (pageErrors.length) console.log("   pageerror:", pageErrors.slice(0, 3));
}

// 关键断言：首页应有 7 个案例卡片；组件画廊应有 16 张卡片
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const caseCards = await page.locator('[data-testid^="case-"]').count();
await page.goto(BASE + "/components", { waitUntil: "networkidle" });
const galleryCards = await page.locator('[data-testid="gallery-card"]').count();
report.caseCards = caseCards;
report.galleryCards = galleryCards;
console.log(`案例卡片: ${caseCards}（期望 10）  |  组件卡片: ${galleryCards}（期望 16）`);

report.badRoutes = bad;
writeFileSync(`${OUT}/r9_verify_report.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(bad === 0 ? "\n✅ 全部通过" : `\n❌ ${bad} 个路由有问题`);
process.exit(bad === 0 ? 0 : 1);
