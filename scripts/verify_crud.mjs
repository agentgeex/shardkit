/**
 * verify_crud.mjs — 【任务二-a：Dialog 式完整 CRUD】端到端验收
 *
 * 覆盖：新建 → 出现在列表 → 编辑 → 生效 → 详情 → 返回 → 删除 → 消失
 *      + 表单校验拦截 + 批量删除 + 0 console error / 0 pageerror + 截图
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5178";
const OUT = "logs";
mkdirSync(OUT, { recursive: true });

const report = { base: BASE, at: new Date().toISOString(), checks: {}, consoleErrors: [], pageErrors: [], ok: false };
const fail = [];

const browser = await chromium.launch();
// 屏蔽 refine 遥测（外网不可达会制造假 console error）
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.route((u) => u.hostname === "telemetry.refine.dev", (r) => r.fulfill({ status: 200, body: "" }));
const page = await context.newPage();

page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push(m.text()); });
page.on("pageerror", (e) => report.pageErrors.push(String(e)));

const check = (name, cond, detail = "") => {
  report.checks[name] = { pass: !!cond, detail };
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fail.push(name);
};

const setSearch = async (v) => {
  await page.getByTestId("list-search").fill(v);
  await page.waitForTimeout(500);
};
const totalOf = async () => {
  const t = await page.getByTestId("list-total").innerText();
  return Number((t.match(/(\d+)/) || [])[1] ?? NaN);
};
const totalUnfiltered = async () => {
  await setSearch("");
  return totalOf();
};
const waitToast = async (titlePart) => {
  await page.locator('[data-testid="toast"]', { hasText: titlePart }).first()
    .waitFor({ state: "visible", timeout: 4000 });
};

await page.goto(BASE + "/list", { waitUntil: "networkidle" });
await page.waitForTimeout(400);

const t0 = await totalUnfiltered();
check("列表加载且有条目", t0 > 0, `共 ${t0} 条`);
await page.screenshot({ path: `${OUT}/crud_01_list.png`, fullPage: true });

/* ── 1) 新建 ─────────────────────────────────────────────── */
await page.getByTestId("create-product").click();
await page.getByTestId("product-dialog").waitFor({ state: "visible" });
const dlg = page.getByTestId("product-dialog");
check("新建：Dialog 打开", true);

// 1a) 空表单提交 → 校验拦截
await page.getByTestId("product-dialog-submit").click();
await page.waitForTimeout(300);
const errText = await page.getByTestId("product-dialog").innerText();
check("新建：空表单被校验拦截（Dialog 未关闭）", await page.getByTestId("product-dialog").isVisible());
check(
  "新建：显示必填错误提示",
  errText.includes("请填写产品名称") && errText.includes("请填写 HS6 编码") && errText.includes("请填写类目"),
  errText.replace(/\n/g, " | ").slice(0, 180)
);

// 1b) HS6 格式校验
await dlg.getByLabel(/产品名称/).fill("X1");
await dlg.getByLabel(/HS6/).fill("123");
await dlg.getByLabel(/类目/).fill("临时类目");
await page.getByTestId("product-dialog-submit").click();
await page.waitForTimeout(250);
check(
  "新建：HS6 格式校验生效",
  (await page.getByTestId("product-dialog").innerText()).includes("格式应为"),
  "HS6=123"
);
await page.screenshot({ path: `${OUT}/crud_02_create_validation.png`, fullPage: true });

const NEW_NAME = "自动化验证产品 E2E";
await dlg.getByLabel(/产品名称/).fill(NEW_NAME);
await dlg.getByLabel(/HS6/).fill("8517.62");
await dlg.getByLabel(/类目/).fill("自动化测试类目");
await dlg.getByRole("combobox").nth(0).click();
await page.getByRole("option", { name: "Amazon" }).click();
await dlg.getByLabel(/价格/).fill("199.5");
await page.screenshot({ path: `${OUT}/crud_03_create_filled.png`, fullPage: true });
await page.getByTestId("product-dialog-submit").click();

await waitToast("已创建");
await page.waitForTimeout(400);
check("新建：提交后 Dialog 关闭", !(await page.getByTestId("product-dialog").isVisible().catch(() => false)));
const t1 = await totalUnfiltered();
check("新建：列表总数 +1", t1 === t0 + 1, `${t0} → ${t1}`);

// 定位新建的记录（搜索并保持筛选）
await setSearch(NEW_NAME);
const newRow = page.locator('[data-testid^="row-"]', { hasText: NEW_NAME }).first();
const newId = (await newRow.getAttribute("data-testid")).replace("row-", "");
check("新建：记录出现在列表", (await newRow.count()) === 1, `id=${newId}`);

/* ── 2) 详情（只读） → 编辑 ─────────────────────────────── */
await page.getByTestId(`detail-${newId}`).click();
await page.getByTestId("detail-dialog").waitFor({ state: "visible" });
const detailText = await page.getByTestId("detail-body").innerText();
check(
  "详情：只读弹窗含全字段",
  detailText.includes(newId) && detailText.includes(NEW_NAME) && detailText.includes("8517.62") &&
    detailText.includes("自动化测试类目") && detailText.includes("Amazon") && detailText.includes("199.50"),
  detailText.replace(/\n/g, " | ").slice(0, 140)
);
await page.screenshot({ path: `${OUT}/crud_04_detail.png`, fullPage: true });

await page.getByTestId("detail-dialog-edit").click();
await page.getByTestId("product-dialog").waitFor({ state: "visible" });
const editPrefill = await page.getByTestId("product-dialog").getByLabel(/产品名称/).inputValue();
check("详情：点编辑切到编辑弹窗并回填", editPrefill === NEW_NAME, `name=${editPrefill}`);
check("编辑：产品 ID 只读", await page.getByTestId("product-dialog").getByLabel(/产品 ID/).isDisabled());

/* ── 3) 编辑生效 ─────────────────────────────────────────── */
const EDITED = NEW_NAME + "（已改）";
await page.getByTestId("product-dialog").getByLabel(/产品名称/).fill(EDITED);
await page.getByTestId("product-dialog-submit").click();
await waitToast("已保存");
await page.waitForTimeout(400);
await setSearch(EDITED);
const editedRow = page.locator('[data-testid^="row-"]', { hasText: EDITED }).first();
check("编辑：修改生效并反映到列表", (await editedRow.count()) === 1, `search="${EDITED}"`);

/* ── 4) 删除（二次确认） ─────────────────────────────────── */
await page.getByTestId(`delete-${newId}`).click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
const delText = await page.getByTestId("delete-confirm-dialog").innerText();
check("删除：弹出二次确认并列出记录", delText.includes("确认删除") && delText.includes(EDITED), delText.replace(/\n/g, " | ").slice(0, 120));
await page.screenshot({ path: `${OUT}/crud_05_delete_confirm.png`, fullPage: true });

await page.getByTestId("delete-confirm-cancel").click();
await page.waitForTimeout(300);
check("删除：取消后记录仍在", (await page.getByTestId(`row-${newId}`).count()) === 1);

await page.getByTestId(`delete-${newId}`).click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
await page.getByTestId("delete-confirm-submit").click();
await waitToast("已删除");
await page.waitForTimeout(400);
check("删除：记录从列表消失", (await page.getByTestId(`row-${newId}`).count()) === 0);
const t2 = await totalUnfiltered();
check("删除：列表总数 -1", t2 === t0, `${t1} → ${t2}`);

/* ── 5) 批量删除 ─────────────────────────────────────────── */
const cb = page.locator("tbody tr td:first-child button");
const cbCount = await cb.count();
check("批量：当前页存在可勾选行", cbCount >= 2, `checkbox=${cbCount}`);
await cb.nth(0).click();
await cb.nth(1).click();
await page.getByTestId("batch-bar").waitFor({ state: "visible" });
check("批量：选中 2 行出现操作条", true);
await page.screenshot({ path: `${OUT}/crud_06_batch.png`, fullPage: true });
await page.getByTestId("batch-delete").click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
await page.getByTestId("delete-confirm-submit").click();
await waitToast("已删除");
await page.waitForTimeout(400);
const t3 = await totalOf();
check("批量删除：总数 -2", t3 === t2 - 2, `${t2} → ${t3}`);

/* ── 6) 回归：搜索/空态/清除筛选 ────────────────────────── */
await setSearch("不存在的关键字zzz");
check("回归：搜索无结果显示空态", (await page.getByTestId("list-empty").count()) === 1);
await page.getByTestId("list-reset").click();
await page.waitForTimeout(400);
check("回归：清除筛选后恢复", (await totalOf()) > 0);

await page.screenshot({ path: `${OUT}/crud_07_final.png`, fullPage: true });

report.ok = fail.length === 0 && report.consoleErrors.length === 0 && report.pageErrors.length === 0;
report.failedChecks = fail;
report.totals = { t0, t1, t2, t3 };
writeFileSync(`${OUT}/verify_crud.json`, JSON.stringify(report, null, 2));

console.log(`\nconsole errors: ${report.consoleErrors.length}  pageerrors: ${report.pageErrors.length}`);
if (report.consoleErrors.length) console.log(report.consoleErrors.slice(0, 5));
if (report.pageErrors.length) console.log(report.pageErrors.slice(0, 5));
console.log(`\n结果: ${report.ok ? "✅ ALL PASS" : "❌ FAIL — " + fail.join(", ")}`);

await browser.close();
process.exit(report.ok ? 0 : 1);
