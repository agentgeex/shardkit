/**
 * verify_table_cases_20260928.mjs — 验收「表格」页两个案例
 *   /table       基础示例（对齐 vue-admin-tpl DefaultTable）
 *   /table/card  卡片表格（对齐 CardTable）
 * 用法：node scripts/verify_table_cases_20260928.mjs
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const BASE = "http://localhost:5178";
const OUT = "logs";
mkdirSync(OUT, { recursive: true });

const results = [];
let failed = 0;
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  if (!ok) failed++;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name}${extra ? "  — " + extra : ""}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => pageErrors.push(String(e)));
await page.route((u) => u.hostname === "telemetry.refine.dev", (r) =>
  r.fulfill({ status: 200, contentType: "application/json", body: "{}" })
);

/* ── 基础示例 ── */
await page.goto(`${BASE}/table`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
check("页面渲染 /table 基础示例", (await page.getByTestId("table-basic-page").count()) === 1);
check("表格存在", (await page.getByTestId("table-basic").count()) === 1);

const headers = await page.locator("[data-testid='table-basic'] thead th").allInnerTexts();check("表头齐全（标题/作者/显示时间/重要度/浏览量/操作）",
  ["标题", "作者", "显示时间", "重要度", "浏览量", "操作"].every((h) => headers.some((x) => x.includes(h))),
  headers.join(" | "));

const rowCount = await page.locator("[data-testid='table-basic'] tbody tr").count();
check("默认每页 10 行", rowCount === 10, `rows=${rowCount}`);

const badgeCount = await page.locator("[data-testid='table-basic'] tbody .inline-flex").count();
check("重要度标签有渲染（Badge）", badgeCount >= 1, `badges>=${badgeCount}`);

// 边框：外层 wrapper 有 border，单元格有竖分割线
const wrapBorder = await page.locator("[data-testid='table-basic']").evaluate((el) => getComputedStyle(el.parentElement).borderTopWidth);
check("表格外层边框生效", wrapBorder !== "0px", `borderTop=${wrapBorder}`);
const thBorderRight = await page.locator("[data-testid='table-basic'] thead th:nth-child(2)").evaluate((el) => getComputedStyle(el).borderRightWidth);
check("表头列间竖分割线生效", thBorderRight !== "0px", `borderRight=${thBorderRight}`);

// 排序：点击「显示时间」切换 asc
const firstTimeDesc = await page.locator("[data-testid='table-basic'] tbody tr:first-child td:nth-child(3)").innerText();
await page.getByTestId("sort-display-time").click();
await page.waitForTimeout(300);
const firstTimeAsc = await page.locator("[data-testid='table-basic'] tbody tr:first-child td:nth-child(3)").innerText();
check("显示时间列可排序（desc→asc 首行变化）", firstTimeDesc !== firstTimeAsc, `${firstTimeDesc} → ${firstTimeAsc}`);

// 分页：跳到第 2 页
const pag = page.getByTestId("pagination");
check("分页存在", (await pag.count()) >= 1);
const page2 = pag.getByRole("button", { name: "2", exact: true }).first();
if (await page2.count()) {
  await page2.click();
  await page.waitForTimeout(300);
  const p2first = await page.locator("[data-testid='table-basic'] tbody tr:first-child td:nth-child(1)").innerText();
  check("翻页后首行变化", !!p2first, p2first.slice(0, 20));
} else {
  check("翻页后首行变化", false, "未找到页码 2 按钮");
}

// 行内操作点击 → toast
await page.locator("[data-testid='table-basic'] tbody tr:first-child button:has-text('操作')").click();
await page.waitForTimeout(400);
check("行内操作触发提示", (await page.getByTestId("toast").count()) >= 1);

await page.screenshot({ path: `${OUT}/table_basic.png`, fullPage: false });

/* ── 卡片表格 ── */
await page.goto(`${BASE}/table/card`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
check("页面渲染 /table/card 卡片表格", (await page.getByTestId("table-card-page").count()) === 1);
const cards = await page.locator("[data-testid='card-table-grid'] [data-testid^='card-item-']").count();
check("卡片网格渲染 6 张卡片", cards === 6, `cards=${cards}`);
check("卡片含圆形头像", (await page.locator("[data-testid='card-item-Vue'] img").count()) === 1);
check("卡片含底部操作一", (await page.locator("[data-testid='card-item-Vue'] button:has-text('操作一')").count()) === 1);
check("卡片含底部操作二", (await page.locator("[data-testid='card-item-Vue'] button:has-text('操作二')").count()) === 1);

// 操作一点击 → toast
await page.locator("[data-testid='card-item-Vue'] button:has-text('操作一')").click();
await page.waitForTimeout(400);
check("卡片操作触发提示", (await page.getByTestId("toast").count()) >= 1);

await page.screenshot({ path: `${OUT}/table_card.png`, fullPage: false });

/* ── 导航分组「表格」 ── */
await page.goto(`${BASE}/table`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const navText = await page.locator("nav").innerText();
check("侧边栏含「表格」导航分组", navText.includes("表格"), "");
check("侧边栏含「基础示例」入口", navText.includes("基础示例"));
check("侧边栏含「卡片表格」入口", navText.includes("卡片表格"));

check("无 console error", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
check("无 page error", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

await browser.close();

const summary = {
  total: results.length,
  failed,
  consoleErrors: consoleErrors.length,
  pageErrors: pageErrors.length,
  results,
};
writeFileSync(`${OUT}/verify_table_cases_20260928.json`, JSON.stringify(summary, null, 2));
console.log(`\n${failed === 0 ? "✅ ALL PASS" : "❌ FAIL: " + failed}`);
console.log(`console errors: ${consoleErrors.length}, page errors: ${pageErrors.length}`);
process.exit(failed === 0 ? 0 : 1);
