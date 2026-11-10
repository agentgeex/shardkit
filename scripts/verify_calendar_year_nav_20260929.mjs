/**
 * verify_calendar_year_nav_20260929.mjs
 * 探索性研究验证：日历顶部新增「年份跳转」按钮（« 上一年 / » 下一年）
 * 在 /search 页打开日期弹层，验证四个按钮各自行为。
 * 用法：node scripts/verify_calendar_year_nav_20260929.mjs
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

await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);

// 展开全部字段以便访问 field4（日期）
const toggle = page.getByTestId("expand-toggle");
if (await toggle.count()) { await toggle.click(); await page.waitForTimeout(300); }

// 打开日期弹层
await page.getByTestId("field-field4").click();
await page.waitForTimeout(400);

const title = page.getByTestId("cal-title");
check("日历弹层打开（有标题）", (await title.count()) === 1);
const t0 = (await title.innerText()).trim();
check("标题格式 = YYYY 年 M 月", /^\d{4} 年 \d{1,2} 月$/.test(t0), t0);

const [y0, m0] = t0.match(/\d+/g).map(Number);

// 四个按钮都存在
for (const id of ["cal-prev-year", "cal-prev-month", "cal-next-month", "cal-next-year"]) {
  check(`按钮存在：${id}`, (await page.getByTestId(id).count()) === 1);
}

// 下个月：月份 +1（跨年则年份 +1）
await page.getByTestId("cal-next-month").click();
await page.waitForTimeout(200);
let t = (await title.innerText()).trim();
let [y, m] = t.match(/\d+/g).map(Number);
const expM = m0 === 12 ? 1 : m0 + 1;
const expY = m0 === 12 ? y0 + 1 : y0;
check("点「下个月」月份 +1", m === expM && y === expY, `${t0} → ${t}`);

// 上一年：年份 -1（月份不变）
await page.getByTestId("cal-prev-year").click();
await page.waitForTimeout(200);
t = (await title.innerText()).trim();
let [y2, m2] = t.match(/\d+/g).map(Number);
check("点「上一年」年份 -1 且月份不变", y2 === expY - 1 && m2 === expM, t);

// 下一年：年份 +1
await page.getByTestId("cal-next-year").click();
await page.waitForTimeout(200);
t = (await title.innerText()).trim();
let [y3, m3] = t.match(/\d+/g).map(Number);
check("点「下一年」年份 +1 且月份不变", y3 === expY && m3 === expM, t);

// 上个月：月份 -1（跨年回退）
await page.getByTestId("cal-prev-month").click();
await page.waitForTimeout(200);
t = (await title.innerText()).trim();
let [y4, m4] = t.match(/\d+/g).map(Number);
check("点「上个月」月份 -1 回到初始", y4 === y0 && m4 === m0, `${t} (初始 ${t0})`);

// 连点「下一年」3 次 → 年份 +3
for (let i = 0; i < 3; i++) { await page.getByTestId("cal-next-year").click(); await page.waitForTimeout(150); }
t = (await title.innerText()).trim();
let [y5] = t.match(/\d+/g).map(Number);
check("连点「下一年」3 次年份 +3", y5 === y0 + 3, `${t0} → ${t}`);

await page.screenshot({ path: `${OUT}/calendar_year_nav.png`, fullPage: false });

check("无 console error", consoleErrors.length === 0, consoleErrors.slice(0, 2).join(" | "));
check("无 page error", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

await browser.close();
const summary = { total: results.length, failed, consoleErrors: consoleErrors.length, pageErrors: pageErrors.length, results };
writeFileSync(`${OUT}/verify_calendar_year_nav_20260929.json`, JSON.stringify(summary, null, 2));
console.log(`\n${failed === 0 ? "✅ ALL PASS" : "❌ FAIL: " + failed}`);
process.exit(failed === 0 ? 0 : 1);
