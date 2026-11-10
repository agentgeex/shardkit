/**
 * verify_datetime_form_20260929.mjs
 * 验收表单页「日期时间」区按 vue-admin-tpl 分类重构 + 8 项新能力
 * 分类：a) 日期选择器 b) 日期时间选择器 c) 日期时间范围 d) 时间选择器 e) 时间选择
 * 用法：node scripts/verify_datetime_form_20260929.mjs
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
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await ctx.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => pageErrors.push(String(e)));
await page.route((u) => u.hostname === "telemetry.refine.dev", (r) =>
  r.fulfill({ status: 200, contentType: "application/json", body: "{}" })
);

await page.goto(`${BASE}/form`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// ── 5 个分组标题存在 ──
const body = await page.locator("body").innerText();
for (const [key, t] of [["a", "日期选择器"], ["b", "日期时间选择器"], ["c", "日期时间范围"], ["d", "时间选择器"], ["e", "时间选择"]]) {
  check(`分组 ${key}) ${t} 存在`, body.includes(t));
}

// ── a) 日期选择器系列 ──
check("默认日期选择器存在", (await page.getByTestId("f-date").count()) === 1);
check("快捷选项日期选择器存在", (await page.getByTestId("f-date-shortcuts").count()) === 1);
check("周选择器存在", (await page.getByTestId("f-week").count()) === 1);
check("年选择器存在", (await page.getByTestId("f-year").count()) === 1);
check("月选择器存在", (await page.getByTestId("f-month").count()) === 1);
check("日期范围选择器存在", (await page.getByTestId("f-daterange").count()) === 1);
check("月份范围选择器存在", (await page.getByTestId("f-monthrange").count()) === 1);
check("年份范围选择器存在", (await page.getByTestId("f-yearrange").count()) === 1);

// ★ 范围选择器：触发框为单个框（显示 开始 ~ 结束）
for (const [tid, s] of [
  ["f-daterange", "开始日期"],
  ["f-monthrange", "开始月份"],
  ["f-yearrange", "开始年份"],
  ["f-datetimerange", "开始日期时间"],
]) {
  const t = await page.getByTestId(tid).innerText();
  check(`范围 ${tid} 为单框含 ~ 与占位`, t.includes("~") && t.includes(s), t.replace(/\n/g, " "));
}

// 年选择器：打开 → 点某年（当前 12 年页内的年）→ 回填
await page.getByTestId("f-year").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.getByTestId("f-year").click();
await page.waitForTimeout(400);
check("年选择器弹层有年网格", (await page.getByTestId("cal-year-grid").count()) === 1);
const yearBtns = page.locator("button[data-testid^='cal-year-']");
const yearTarget = await yearBtns.first().getAttribute("data-testid");
const yearNum = yearTarget.replace("cal-year-", "");
await page.getByTestId(yearTarget).click();
await page.waitForTimeout(400);
check(`选年回填 ${yearNum}`, (await page.getByTestId("f-year").innerText()).includes(yearNum), await page.getByTestId("f-year").innerText());

// 月选择器：打开 → 点 3月 → 回填
await page.getByTestId("f-month").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.getByTestId("f-month").click();
await page.waitForTimeout(400);
check("月选择器弹层有月网格", (await page.getByTestId("cal-month-grid").count()) === 1);
await page.getByTestId("cal-month-3").click();
await page.waitForTimeout(400);
check("选月回填 -03", (await page.getByTestId("f-month").innerText()).includes("-03"), await page.getByTestId("f-month").innerText());

// 日期范围：点框开弹层 → 验证双面板 → 左面板选10(起点自动) → 右面板选20(终点)
await page.getByTestId("f-daterange").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.getByTestId("f-daterange").click();
await page.waitForTimeout(400);
check("范围弹层为双面板", (await page.getByTestId("range-panel").count()) === 1);
check("双面板含两个日历", (await page.locator("[data-radix-popper-content-wrapper] [data-testid='cal-title'], [data-radix-popper-content-wrapper] .grid-cols-7").count()) >= 2);
check("双面板顶部有 ‹« »› 导航", (await page.getByTestId("range-prev").count()) === 1 && (await page.getByTestId("range-prev-big").count()) === 1 && (await page.getByTestId("range-next").count()) === 1 && (await page.getByTestId("range-next-big").count()) === 1);
check("双面板头部箭头已隐藏（无 cal-prev-month）", (await page.locator("[data-radix-popper-content-wrapper] [data-testid='cal-prev-month']").count()) === 0);
await page.locator("[data-radix-popper-content-wrapper] button:not([disabled])").filter({ hasText: /^10$/ }).first().click();
await page.waitForTimeout(250);
await page.locator("[data-radix-popper-content-wrapper] button:not([disabled])").filter({ hasText: /^20$/ }).first().click();
await page.waitForTimeout(400);
const dr = await page.getByTestId("f-daterange").innerText();
const dmatches = dr.match(/\d{4}-\d{2}-\d{2}/g) || [];
check("日期范围回填起止两段", dr.includes("~") && dmatches.length >= 2, dr.replace(/\n/g, " "));
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

// 快捷选项：打开 → 点「今天」→ 回填
await page.getByTestId("f-date-shortcuts").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.getByTestId("f-date-shortcuts").click();
await page.waitForTimeout(400);
check("快捷选项面板存在", (await page.getByTestId("date-shortcuts").count()) === 1);
await page.getByTestId("date-shortcuts").getByText("今天").click();
await page.waitForTimeout(400);
check("快捷「今天」回填非空", (await page.getByTestId("f-date-shortcuts").innerText()).match(/\d{4}-\d{2}-\d{2}/) !== null, await page.getByTestId("f-date-shortcuts").innerText());
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

// ── b) 日期时间选择器 ──
check("日期时间选择器存在", (await page.getByTestId("f-datetime").count()) === 1);
check("日期时间快捷选项存在", (await page.getByTestId("f-datetime-shortcuts").count()) === 1);
await page.getByTestId("f-datetime-shortcuts").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.getByTestId("f-datetime-shortcuts").click();
await page.waitForTimeout(400);
check("日期时间快捷面板存在", (await page.getByTestId("datetime-shortcuts").count()) === 1);
await page.getByTestId("datetime-shortcuts").getByText("昨天").click();
await page.waitForTimeout(400);
check("快捷「昨天」回填含时分", /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(await page.getByTestId("f-datetime-shortcuts").innerText()), await page.getByTestId("f-datetime-shortcuts").innerText());
await page.keyboard.press("Escape");
await page.waitForTimeout(200);

// ── c) 日期时间范围 ──
check("日期时间范围选择器存在", (await page.getByTestId("f-datetimerange").count()) === 1);
// 打开时间范围弹层：验证两个独立时间输入框 + 顶部分置导航
await page.getByTestId("f-datetimerange").scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await page.getByTestId("f-datetimerange").click();
await page.waitForTimeout(400);
check("时间范围弹层有两个独立时间框", (await page.getByTestId("dtr-start-time").count()) === 1 && (await page.getByTestId("dtr-end-time").count()) === 1);
check("时间范围弹层为双面板", (await page.getByTestId("range-panel").count()) === 1);
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// ── d) 时间选择器 ──
check("时间选择器存在", (await page.getByTestId("f-time").count()) === 1);
check("含秒时间选择器存在", (await page.getByTestId("f-time-sec").count()) === 1);

// ── e) 时间选择 ──
check("时间选择（TimeSelect）存在", (await page.getByTestId("f-time-select").count()) === 1);

// 无原生 date/time input（除日期时间范围面板内的时间输入，需先打开才存在）
const nativeClosed = await page.locator("input[type='date']:visible, input[type='time']:visible").count();
check("页面无可见的原生 date/time input", nativeClosed === 0, `native=${nativeClosed}`);

await page.screenshot({ path: `${OUT}/form_datetime.png`, fullPage: true });

check("无 console error", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
check("无 page error", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

await browser.close();
const summary = { total: results.length, failed, consoleErrors: consoleErrors.length, pageErrors: pageErrors.length, results };
writeFileSync(`${OUT}/verify_datetime_form_20260929.json`, JSON.stringify(summary, null, 2));
console.log(`\n${failed === 0 ? "✅ ALL PASS" : "❌ FAIL: " + failed}`);
console.log(`console errors: ${consoleErrors.length}, page errors: ${pageErrors.length}`);
process.exit(failed === 0 ? 0 : 1);
