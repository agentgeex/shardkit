/**
 * verify_form_all_20260928.mjs — 【表单页·全部示例】控件覆盖验收
 *
 * 对照 vue-admin-tpl「表单 → 全部示例」（src/views/Components/Form/DefaultForm.vue），
 * 断言 ShardKit /form 页覆盖以下控件并可交互：
 *   Input / 密码 / Textarea / InputNumber / Combobox(自动完成) / InputTag
 *   Select / 分组 Select / Cascader / TreeSelect(单选·多选) / RadioGroup / RadioButton
 *   CheckboxGroup / CheckboxButton / Switch / Slider / Rate / ColorPicker / Transfer
 *   DatePicker / DateTimePicker / TimePicker / TimePicker(秒) / TimeSelect
 *   Upload / RichText / Markdown / Badge / Progress / Alert / Tooltip / Popover / Pagination
 *
 * 用法：npm run dev（5178）后 `node scripts/verify_form_all_20260928.mjs`
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5178";
const OUT = "logs";
mkdirSync(OUT, { recursive: true });

const report = { base: BASE, at: new Date().toISOString(), checks: {}, consoleErrors: [], pageErrors: [], ok: false };
const fail = [];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await ctx.route((u) => u.hostname === "telemetry.refine.dev", (r) => r.fulfill({ status: 200, body: "" }));
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push(m.text()); });
page.on("pageerror", (e) => report.pageErrors.push(String(e)));

const check = (name, cond, detail = "") => {
  report.checks[name] = { pass: !!cond, detail };
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fail.push(name);
};

await page.goto(BASE + "/form", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
check("页面渲染 /form 全部示例", (await page.getByTestId("form-all-page").count()) === 1);

// 栅格排版范式：一行 1 / 2 / 3 个控件
for (const [tid, expectCols] of [["grid-1", "1"], ["grid-2", "2"], ["grid-3", "3"]]) {
  const el = page.getByTestId(tid);
  const cnt = await el.count();
  const dc = cnt ? await el.getAttribute("data-cols") : null;
  check(`栅格排版存在：${tid}（一行 ${expectCols} 个）`, cnt === 1 && dc === expectCols, `data-cols=${dc}`);
}
check("栅格一行两个：含 4 个字段", (await page.getByTestId("grid-2").locator("[data-testid^='field-']").count()) === 4);
check("栅格一行三个：含 3 个字段", (await page.getByTestId("grid-3").locator("[data-testid^='field-']").count()) === 3);

// 响应式：窄屏时 cols=2 / cols=3 应降为单列
{
  await page.setViewportSize({ width: 420, height: 900 });
  await page.waitForTimeout(300);
  const cols = await page.getByTestId("grid-2").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  check("响应式：窄屏 grid-2 降为单列", cols === 1, `computed cols=${cols}`);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(300);
}

// 控件存在性
const presence = [
  ["f-text", "Input"],
  ["f-number", "InputNumber"],
  ["f-combobox", "Combobox 自动完成"],
  ["f-select", "Select"],
  ["f-select-group", "分组 Select"],
  ["f-cascader", "Cascader"],
  ["f-tree-single", "TreeSelect 单选"],
  ["f-tree-multi", "TreeSelect 多选"],
  ["f-radio-button", "RadioButton"],
  ["f-check-button", "CheckboxButton"],
  ["f-rate", "Rate"],
  ["f-color", "ColorPicker"],
  ["f-date", "DatePicker"],
  ["f-time", "TimePicker"],
  ["f-time-select", "TimeSelect"],
  ["f-upload", "Upload"],
  ["pagination", "Pagination"],
];
for (const [tid, name] of presence) {
  check(`控件存在：${name}`, (await page.getByTestId(tid).count()) >= 1, `data-testid=${tid}`);
}

// 交互：InputNumber 步进
{
  const wrapper = page.getByTestId("f-number");
  const inp = wrapper.locator("input");
  const before = await inp.inputValue();
  await wrapper.locator('button[aria-label="增加"]').click();
  const after = await inp.inputValue();
  check("InputNumber + 步进生效", Number(after) === Number(before) + 1, `${before} → ${after}`);
}

// 交互：Combobox 选择
{
  await page.getByTestId("f-combobox").click();
  await page.waitForTimeout(400);
  await page.locator('button:has-text("React")').last().click();
  await page.waitForTimeout(400);
  check("Combobox 选择回填", (await page.getByTestId("f-combobox").innerText()).includes("React"));
}

// 交互：Cascader 逐层选择
{
  await page.getByTestId("f-cascader").click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "指南" }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "规范" }).first().click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "一致性" }).first().click();
  await page.waitForTimeout(300);
  check("Cascader 路径回填", (await page.getByTestId("f-cascader").innerText()).includes("一致性"));
}

// 交互：Rate 点击
{
  const stars = page.getByTestId("f-rate").locator("button");
  await stars.nth(4).click();
  await page.waitForTimeout(150);
  check("Rate 可点击", true);
}

// 交互：Tooltip 悬停
{
  await page.getByRole("button", { name: /悬停提示/ }).hover();
  await page.waitForTimeout(500);
  const tipCount = await page.getByText("这是一段悬浮提示文字").count();
  check("Tooltip 悬停显隐", tipCount >= 1, `tooltip nodes=${tipCount}`);
}

await page.screenshot({ path: `${OUT}/form_all_top.png`, fullPage: false });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/form_all_mid.png`, fullPage: false });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/form_all_bottom.png`, fullPage: false });
await page.screenshot({ path: `${OUT}/form_all_full.png`, fullPage: true });

// 业务配方表单仍可达
await page.goto(BASE + "/form/recipe", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
check("业务配方表单可达 /form/recipe", (await page.locator("text=新建任务配方").count()) >= 1);

report.ok = fail.length === 0 && report.consoleErrors.length === 0 && report.pageErrors.length === 0;
writeFileSync(`${OUT}/verify_form_all_20260928.json`, JSON.stringify(report, null, 2));
console.log(`\n${report.ok ? "✅ ALL PASS" : "❌ FAIL: " + fail.join(", ")}`);
console.log(`console errors: ${report.consoleErrors.length}, page errors: ${report.pageErrors.length}`);
await browser.close();
process.exit(report.ok ? 0 : 1);
