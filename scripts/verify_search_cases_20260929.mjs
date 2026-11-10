/**
 * verify_search_cases_20260929.mjs — 验收「查询」页两个案例
 *   /search        查询面板·全部示例（对齐 vue-admin-tpl「组件→查询」）
 *   /search/orders 产品化·订单查询
 * 用法：node scripts/verify_search_cases_20260929.mjs
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
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await ctx.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => pageErrors.push(String(e)));
await page.route((u) => u.hostname === "telemetry.refine.dev", (r) =>
  r.fulfill({ status: 200, contentType: "application/json", body: "{}" })
);

/* ── A. 查询·全部示例 ── */
await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("页面渲染 /search", (await page.getByTestId("search-demo-page").count()) === 1);
check("查询面板存在", (await page.getByTestId("search-panel").count()) === 1);
check("操作区按钮「栅格」存在", (await page.getByTestId("op-grid").count()) === 1);

// 初始 inline：可见字段数（field1..field15，但分界 field6 收起→仅前 5 个 + 按钮）
const inlineFields = await page.locator("[data-testid^='field-']").count();
check("inline 布局有字段渲染", inlineFields >= 1, `fields=${inlineFields}`);

// 栅格切换
await page.getByTestId("op-grid").click();
await page.waitForTimeout(300);
check("切换栅格后仍正常", (await page.getByTestId("search-panel").count()) === 1);

// 底部按钮位置
await page.getByTestId("op-layout").click();
await page.waitForTimeout(300);
check("切换底部布局后仍正常", (await page.getByTestId("search-panel").count()) === 1);

// 动态选项
await page.getByTestId("op-dict").click();
await page.waitForTimeout(600);
check("动态拉取下拉选项后仍正常", (await page.getByTestId("search-panel").count()) === 1);

// 删除字段 -> field3 消失
await page.getByTestId("op-del").click();
await page.waitForTimeout(300);
check("删除字段 field3 生效", (await page.getByTestId("field-field3").count()) === 0);
await page.locator("button:has-text('还原字段')").click();
await page.waitForTimeout(300);
check("还原字段 field3 生效", (await page.getByTestId("field-field3").count()) >= 1);

// 赋值 -> field1 = Joy
await page.getByTestId("op-setvalue").click();
await page.waitForTimeout(300);
check("赋值 field1=Joy 生效", (await page.getByTestId("field-field1").inputValue()) === "Joy");

// 查询（提交过滤空值）-> field1 有值，其余为空被剔除
await page.getByTestId("search-btn").click();
await page.waitForTimeout(500);
const submitted = await page.getByTestId("submitted-json").innerText();
check("查询提交数据含 field1", submitted.includes("field1"), submitted.replace(/\s+/g, " ").slice(0, 80));
check("提交数据已过滤空值（不含 field9 等空字段）", !submitted.includes("field9"), submitted.replace(/\s+/g, " ").slice(0, 80));

// 重置
await page.getByTestId("reset-btn").click();
await page.waitForTimeout(400);
check("重置后提交区清空", (await page.getByTestId("submitted-json").count()) === 0);

// 展开/收起：初始收起（field6 起隐藏），点「展开」显示全部
const collapsedFields = await page.locator("[data-testid^='field-']").count();
await page.getByTestId("expand-toggle").click();
await page.waitForTimeout(400);
const expandedFields = await page.locator("[data-testid^='field-']").count();
check("展开后可显示更多字段", expandedFields > collapsedFields, `${collapsedFields} → ${expandedFields}`);

// 日期/时间字段：已改为自研组件（无 input[type=date/time]，无中间图标）
const nativeDate = await page.locator("[data-testid='search-panel'] input[type='date'], [data-testid='search-panel'] input[type='time']").count();
check("日期/时间不再用原生 input（去掉中间图标）", nativeDate === 0, `native=${nativeDate}`);
// 日期字段是按钮触发器，点击弹出日历（必须真实可见、定位在触发器下方）
await page.getByTestId("field-field4").click();
await page.waitForTimeout(400);
const popBox = await page.locator("[data-radix-popper-content-wrapper]").first().boundingBox();
const trigBox = await page.getByTestId("field-field4").boundingBox();
check("点击日期框弹出日历弹层（真实可见、位于框下方）",
  !!popBox && popBox.y > 0 && popBox.y >= trigBox.y + trigBox.height - 2,
  `pop.y=${popBox ? Math.round(popBox.y) : "null"} trig.bottom=${trigBox ? Math.round(trigBox.y + trigBox.height) : "null"}`);
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

await page.screenshot({ path: `${OUT}/search_demo.png`, fullPage: false });

/* ── B. 订单查询 ── */
await page.goto(`${BASE}/search/orders`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("页面渲染 /search/orders", (await page.getByTestId("order-search-page").count()) === 1);
check("查询面板存在", (await page.getByTestId("order-search-panel").count()) === 1);
check("结果表格存在", (await page.getByTestId("order-table").count()) === 1);

const headers = await page.locator("[data-testid='order-table'] thead th").allInnerTexts();
check("表头齐全（订单号/客户/渠道/下单日期/金额/状态/操作）",
  ["订单号", "客户", "渠道", "下单日期", "金额", "状态", "操作"].every((h) => headers.some((x) => x.includes(h))),
  headers.join(" | "));

const rowCount = await page.locator("[data-testid='order-table'] tbody tr").count();
check("默认每页 8 行", rowCount === 8, `rows=${rowCount}`);

// 状态筛选 → pending 只剩「待付款」
await page.getByTestId("f-status").click();
await page.waitForTimeout(300);
await page.locator("[role='option']:has-text('待付款')").click();
await page.waitForTimeout(300);
await page.getByTestId("order-search-btn").click();
await page.waitForTimeout(500);
const statuses = await page.locator("[data-testid='order-table'] tbody tr td:nth-child(6)").allInnerTexts();
check("按状态筛选（全部=待付款）", statuses.length > 0 && statuses.every((s) => s.includes("待付款")), statuses.slice(0, 5).join(","));

// 重置后恢复
await page.getByTestId("order-reset-btn").click();
await page.waitForTimeout(500);
const after = await page.locator("[data-testid='order-table'] tbody tr td:nth-child(6)").allInnerTexts();
check("重置后状态恢复多样", new Set(after).size > 1, [...new Set(after)].join(","));

// 客户模糊查询
await page.getByTestId("f-customer").fill("星海");
await page.waitForTimeout(200);
await page.getByTestId("order-search-btn").click();
await page.waitForTimeout(500);
const customers = await page.locator("[data-testid='order-table'] tbody tr td:nth-child(2)").allInnerTexts();
check("按客户模糊查询（全部含星海）", customers.length > 0 && customers.every((c) => c.includes("星海")), customers.slice(0, 4).join(","));

// 排序
await page.getByTestId("order-reset-btn").click();
await page.waitForTimeout(400);
const d1 = await page.locator("[data-testid='order-table'] tbody tr:first-child td:nth-child(4)").innerText();
await page.getByTestId("order-sort-date").click();
await page.waitForTimeout(300);
const d2 = await page.locator("[data-testid='order-table'] tbody tr:first-child td:nth-child(4)").innerText();
check("下单日期可排序（desc→asc 首行变化）", d1 !== d2, `${d1} → ${d2}`);

// 展开高级筛选
await page.getByTestId("order-expand").click();
await page.waitForTimeout(300);
check("展开高级筛选显示日期字段", (await page.getByTestId("advanced-fields").count()) === 1);

// 空结果态
await page.getByTestId("f-no").fill("NOT-EXIST-999");
await page.getByTestId("order-search-btn").click();
await page.waitForTimeout(500);
check("无结果时显示空态文案", (await page.locator("text=没有符合条件的记录").count()) >= 1);

await page.screenshot({ path: `${OUT}/search_orders.png`, fullPage: false });

/* ── 导航分组「查询」 ── */
await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const navText = await page.locator("nav").innerText();
check("侧边栏含「查询」导航分组", navText.includes("查询"));
check("侧边栏含「全部示例」入口", navText.includes("全部示例"));
check("侧边栏含「订单查询」入口", navText.includes("订单查询"));

// 案例索引卡片
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const bodyText = await page.locator("body").innerText();
check("案例索引含「查询 · 全部示例」", bodyText.includes("查询 · 全部示例"));
check("案例索引含「查询 · 订单查询」", bodyText.includes("查询 · 订单查询"));

check("无 console error", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
check("无 page error", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

await browser.close();

const summary = { total: results.length, failed, consoleErrors: consoleErrors.length, pageErrors: pageErrors.length, results };
writeFileSync(`${OUT}/verify_search_cases_20260929.json`, JSON.stringify(summary, null, 2));
console.log(`\n${failed === 0 ? "✅ ALL PASS" : "❌ FAIL: " + failed}`);
console.log(`console errors: ${consoleErrors.length}, page errors: ${pageErrors.length}`);
process.exit(failed === 0 ? 0 : 1);
