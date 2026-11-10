/**
 * verify_menu_and_crud.mjs — 【验证：右键菜单定位 + 两套 CRUD】端到端验收
 *
 * 覆盖（一次跑完全部，产出截图 + 断言日志 + JSON 报告）：
 *   A. 标签栏右键菜单
 *      A1) 定位：菜单左上角坐标与鼠标坐标偏差 < 24px（本次修复的核心回归）
 *      A2) 边界：贴近视口右/下边缘时不溢出（翻转/收拢）
 *      A3) 既有功能：刷新当前 / 固定·取消固定 / 关闭 / 关闭其他 / 关闭右侧 / 关闭全部
 *          （关闭全部后回落到默认空白页 /blank，且默认标签不可关闭）
 *   B. Dialog 式完整 CRUD（列表页内弹窗，/list）
 *   C. Page 式完整 CRUD（独立路由：/list-page/new、/list-page/:id、/list-page/:id/edit）
 *   D. 侧边栏「页面案例」组两个并列菜单入口（弹窗式 / 页面式）均可达
 *   E. 全局：0 console error / 0 pageerror
 *
 * 用法：先起 dev（npm run dev，端口 5178），再 `node scripts/verify_menu_and_crud.mjs`
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5178";
const OUT = "logs";
mkdirSync(OUT, { recursive: true });

const report = {
  base: BASE,
  at: new Date().toISOString(),
  checks: {},
  consoleErrors: [],
  pageErrors: [],
  ok: false,
};
const fail = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// 屏蔽 refine 遥测（外网不可达会制造假 console error）
await ctx.route((u) => u.hostname === "telemetry.refine.dev", (r) => r.fulfill({ status: 200, body: "" }));
const page = await ctx.newPage();

page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push(m.text()); });
page.on("pageerror", (e) => report.pageErrors.push(String(e)));

const check = (name, cond, detail = "") => {
  report.checks[name] = { pass: !!cond, detail };
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fail.push(name);
};

const waitToast = (titlePart) =>
  page.locator('[data-testid="toast"]', { hasText: titlePart }).first()
    .waitFor({ state: "visible", timeout: 4000 });

const setSearch = async (v) => {
  await page.getByTestId("list-search").fill(v);
  await page.waitForTimeout(500);
};
const totalOf = async () => {
  const t = await page.getByTestId("list-total").innerText();
  return Number((t.match(/(\d+)/) || [])[1] ?? NaN);
};
const totalUnfiltered = async () => { await setSearch(""); return totalOf(); };

/* ══════════════════════════════════════════════════════════════════════
 * A. 标签栏右键菜单
 * ══════════════════════════════════════════════════════════════════════ */

// 先清掉上次遗留的工作区标签，保证干净起点（默认空白页标签 /blank 由代码自动补回）
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.removeItem("shardkit.worktabs.v1"));

// 打开若干标签：/dashboard、/list、/form（路由变化自动登记 tab）
for (const p of ["/dashboard", "/list", "/form"]) {
  await page.goto(BASE + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(250);
}
await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(400);

const tabs = page.locator('[data-testid^="tab-"]');
const tabCount = await tabs.count();
check("菜单前置：标签栏存在多个标签", tabCount >= 4, `tabs=${tabCount}`);
await page.screenshot({ path: `${OUT}/menu_00_tabs.png`, fullPage: true });

/* A1) 定位：右键菜单左上角 ≈ 鼠标坐标（偏差 < 24px） */
// 用按 key 的稳定定位器（固定/取消固定会重排标签，index 定位器会漂移）
const target = page.getByTestId("tab-/list"); // 中段标签，远离视口边界，不触发钳制
await target.waitFor({ state: "visible", timeout: 3000 });
const tbox = await target.boundingBox();
const mx = Math.round(tbox.x + tbox.width / 2);
const my = Math.round(tbox.y + tbox.height / 2);

await page.mouse.click(mx, my, { button: "right" });
const menuEl = page.getByTestId("tab-context-menu");
await menuEl.waitFor({ state: "visible", timeout: 3000 });
// 等一帧布局钳制
await page.waitForTimeout(120);
const mbox = await menuEl.boundingBox();
const dx = Math.abs(mbox.x - mx);
const dy = Math.abs(mbox.y - my);
check(
  "A1 定位：菜单左上角贴近鼠标（偏差 < 24px）",
  dx < 24 && dy < 24,
  `mouse=(${mx},${my}) menu=(${Math.round(mbox.x)},${Math.round(mbox.y)}) Δ=(${dx.toFixed(1)},${dy.toFixed(1)})`
);
await page.screenshot({ path: `${OUT}/menu_01_position.png`, fullPage: true });

// A2) 菜单不溢出视口
const vw = 1440, vh = 900, MARGIN = 8;
check(
  "A2 边界：菜单完整落在视口内",
  mbox.x >= MARGIN - 1 && mbox.y >= MARGIN - 1 &&
    mbox.x + mbox.width <= vw - MARGIN + 1 && mbox.y + mbox.height <= vh - MARGIN + 1,
  `menu=(${Math.round(mbox.x)},${Math.round(mbox.y)},${Math.round(mbox.width)}x${Math.round(mbox.height)})`
);

// 菜单项齐备
for (const [label, tid] of [
  ["刷新当前", "menu-refresh"],
  ["固定标签", "menu-pin"],
  ["关闭", "menu-close"],
  ["关闭其他", "menu-close-others"],
  ["关闭右侧", "menu-close-right"],
  ["关闭全部", "menu-close-all"],
]) {
  check(`A3 菜单项存在：${label}`, await page.getByTestId(tid).isVisible(), tid);
}

/* 关闭菜单：点击空白 */
await page.mouse.click(700, 500);
await page.waitForTimeout(200);
check("A3 点击空白处菜单关闭", !(await menuEl.isVisible().catch(() => false)));

/* A3-固定/取消固定/刷新：每次右键前重测目标标签位置（固定会重排标签）*/
const rightClickTabList = async () => {
  const t = page.getByTestId("tab-/list");
  await t.waitFor({ state: "visible", timeout: 3000 });
  const b = await t.boundingBox();
  const cx = Math.round(b.x + b.width / 2);
  const cy = Math.round(b.y + b.height / 2);
  await page.mouse.click(cx, cy, { button: "right" });
  await page.getByTestId("tab-context-menu").waitFor({ state: "visible", timeout: 3000 });
};

await rightClickTabList();
await page.getByTestId("menu-pin").click();
await page.waitForTimeout(250);
check("A3 固定：标签 data-pinned=true", (await page.getByTestId("tab-/list").getAttribute("data-pinned")) === "true");
await rightClickTabList();
await page.getByTestId("menu-pin").click();
await page.waitForTimeout(250);
check("A3 取消固定：标签 data-pinned=false", (await page.getByTestId("tab-/list").getAttribute("data-pinned")) === "false");

/* A3-刷新当前 */
await rightClickTabList();
await page.getByTestId("menu-refresh").click();
await page.waitForTimeout(500);
check("A3 刷新当前：菜单关闭且停在当前标签", page.url().endsWith("/list") && !(await menuEl.isVisible().catch(() => false)), page.url());

/* A3-关闭其他（对 /list 标签）*/
await rightClickTabList();
await page.getByTestId("menu-close-others").click();
await page.waitForTimeout(300);
let remaining = await page.locator('[data-testid^="tab-"]').count();
check(
  "A3 关闭其他：仅保留固定(默认空白页) + 当前(/list)",
  remaining === 2 && (await page.getByTestId("tab-/blank").count()) === 1 && (await page.getByTestId("tab-/list").count()) === 1,
  `remaining=${remaining}`
);

/* A3-关闭全部 → 回默认空白页 /blank */
await page.goto(BASE + "/form", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.goto(BASE + "/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const anyTab = page.getByTestId("tab-/dashboard");
await anyTab.waitFor({ state: "visible", timeout: 3000 });
const abox = await anyTab.boundingBox();
await page.mouse.click(Math.round(abox.x + abox.width / 2), Math.round(abox.y + abox.height / 2), { button: "right" });
await page.getByTestId("menu-close-all").click();
await page.waitForTimeout(400);
remaining = await page.locator('[data-testid^="tab-"]').count();
check(
  "A3 关闭全部：仅剩默认空白页标签且落到 /blank",
  remaining === 1 && (await page.getByTestId("tab-/blank").count()) === 1 && page.url().endsWith("/blank"),
  `remaining=${remaining} url=${page.url()}`
);
check("A3 关闭全部：空白页渲染出默认工作区", await page.getByTestId("blank-page").isVisible());
await page.screenshot({ path: `${OUT}/menu_02_after_close_all.png`, fullPage: true });

/* A3-默认空白标签不可关闭（右键菜单「关闭」禁用；标签上无关闭按钮）*/
const blankTab = page.getByTestId("tab-/blank");
await blankTab.waitFor({ state: "visible", timeout: 3000 });
const bbox = await blankTab.boundingBox();
await page.mouse.click(Math.round(bbox.x + bbox.width / 2), Math.round(bbox.y + bbox.height / 2), { button: "right" });
await page.getByTestId("tab-context-menu").waitFor({ state: "visible", timeout: 3000 });
check("A3 默认空白标签不可关闭：右键「关闭」禁用", await page.getByTestId("menu-close").isDisabled());
await page.keyboard.press("Escape");
await page.mouse.click(700, 500);
await page.waitForTimeout(200);

/* ══════════════════════════════════════════════════════════════════════
 * B. Dialog 式完整 CRUD
 * ══════════════════════════════════════════════════════════════════════ */

await page.goto(BASE + "/list", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const t0 = await totalUnfiltered();
check("B 列表加载且有条目", t0 > 0, `共 ${t0} 条`);

// 新建（空表单校验拦截）
await page.getByTestId("create-product").click();
await page.getByTestId("product-dialog").waitFor({ state: "visible" });
await page.getByTestId("product-dialog-submit").click();
await page.waitForTimeout(300);
const errText = await page.getByTestId("product-dialog").innerText();
check("B 新建：空表单被校验拦截", await page.getByTestId("product-dialog").isVisible());
check("B 新建：显示必填错误", errText.includes("请填写产品名称") && errText.includes("请填写 HS6 编码"), errText.replace(/\n/g, " | ").slice(0, 160));

const dlg = page.getByTestId("product-dialog");
const NEW_NAME = "菜单CRUD验证产品 E2E";
await dlg.getByLabel(/产品名称/).fill(NEW_NAME);
await dlg.getByLabel(/HS6/).fill("8517.62");
await dlg.getByLabel(/类目/).fill("验证类目");
await dlg.getByRole("combobox").nth(0).click();
await page.getByRole("option", { name: "Amazon" }).click();
await dlg.getByLabel(/价格/).fill("199.5");
await page.screenshot({ path: `${OUT}/menu_03_dialog_filled.png`, fullPage: true });
await page.getByTestId("product-dialog-submit").click();
await waitToast("已创建");
await page.waitForTimeout(400);
const t1 = await totalUnfiltered();
check("B 新建：总数 +1", t1 === t0 + 1, `${t0} → ${t1}`);

await setSearch(NEW_NAME);
const newRow = page.locator('[data-testid^="row-"]', { hasText: NEW_NAME }).first();
const newId = (await newRow.getAttribute("data-testid") || "").replace("row-", "");
check("B 新建：记录出现在列表", (await newRow.count()) === 1, `id=${newId}`);

// 详情（只读）→ 编辑
await page.getByTestId(`detail-${newId}`).click();
await page.getByTestId("detail-dialog").waitFor({ state: "visible" });
const detailText = await page.getByTestId("detail-body").innerText();
check("B 详情：只读弹窗含全字段", detailText.includes(newId) && detailText.includes(NEW_NAME) && detailText.includes("8517.62") && detailText.includes("Amazon"), detailText.replace(/\n/g, " | ").slice(0, 140));
await page.getByTestId("detail-dialog-edit").click();
await page.getByTestId("product-dialog").waitFor({ state: "visible" });
check("B 编辑：回填当前记录", (await dlg.getByLabel(/产品名称/).inputValue()) === NEW_NAME);
check("B 编辑：产品 ID 只读", await dlg.getByLabel(/产品 ID/).isDisabled());

const EDITED = NEW_NAME + "（已改）";
await dlg.getByLabel(/产品名称/).fill(EDITED);
await page.getByTestId("product-dialog-submit").click();
await waitToast("已保存");
await page.waitForTimeout(400);
await setSearch(EDITED);
check("B 编辑：修改生效", (await page.locator('[data-testid^="row-"]', { hasText: EDITED }).count()) === 1);

// 删除（二次确认）
await page.getByTestId(`delete-${newId}`).click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
await page.getByTestId("delete-confirm-cancel").click();
await page.waitForTimeout(300);
check("B 删除：取消后记录仍在", (await page.getByTestId(`row-${newId}`).count()) === 1);
await page.getByTestId(`delete-${newId}`).click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
await page.getByTestId("delete-confirm-submit").click();
await waitToast("已删除");
await page.waitForTimeout(400);
check("B 删除：记录从列表消失", (await page.getByTestId(`row-${newId}`).count()) === 0);
check("B 删除：总数回到初值", (await totalUnfiltered()) === t0, `${t1} → ${t0}`);

// 批量删除
await page.locator("tbody tr td:first-child button").nth(0).click();
await page.locator("tbody tr td:first-child button").nth(1).click();
await page.getByTestId("batch-bar").waitFor({ state: "visible" });
await page.getByTestId("batch-delete").click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
await page.getByTestId("delete-confirm-submit").click();
await waitToast("已删除");
await page.waitForTimeout(400);
check("B 批量删除：总数 -2", (await totalOf()) === t0 - 2, `${t0} → ${t0 - 2}`);
await page.screenshot({ path: `${OUT}/menu_04_dialog_crud_done.png`, fullPage: true });

/* ══════════════════════════════════════════════════════════════════════
 * C. Page 式完整 CRUD（/list-page）
 * ══════════════════════════════════════════════════════════════════════ */

await page.goto(BASE + "/list-page", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const p0 = await totalUnfiltered();
check("C 页面式列表页加载且有条目", p0 > 0, `共 ${p0} 条`);
check("C 页面式列表页存在「页面式新建」入口", await page.getByTestId("create-product-page").isVisible());
check("C 页面式列表页存在切往「弹窗式」的链接", await page.getByTestId("goto-list-dialog").isVisible());

await page.getByTestId("create-product-page").click();
await page.waitForURL("**/list-page/new", { timeout: 4000 });
check("C 新建：进入 /list-page/new", page.url().endsWith("/list-page/new"));
check("C 新建：页头按钮齐备", (await page.getByTestId("page-new-back").isVisible()) && (await page.getByTestId("page-new-submit").isVisible()));

const pf = page.getByTestId("page-form");
await page.getByTestId("page-new-submit").click();
await page.waitForTimeout(300);
check("C 新建：空表单被拦截", page.url().endsWith("/list-page/new") && (await page.getByTestId("page-new").innerText()).includes("请填写产品名称"));

const PAGE_NAME = "Page式菜单验证产品 E2E";
await pf.getByLabel(/产品名称/).fill(PAGE_NAME);
await pf.getByLabel(/HS6/).fill("8517.62");
await pf.getByLabel(/类目/).fill("Page式验证类目");
await pf.getByRole("combobox").nth(0).click();
await page.getByRole("option", { name: "Amazon" }).click();
await pf.getByLabel(/价格/).fill("188.8");
await page.getByTestId("page-new-submit").click();
await page.waitForURL("**/list-page", { timeout: 4000 });
await waitToast("已创建");
const p1 = await totalUnfiltered();
check("C 新建：保存后跳回列表 + 总数 +1", page.url().endsWith("/list-page") && p1 === p0 + 1, `${p0} → ${p1}`);

await setSearch(PAGE_NAME);
const pRow = page.locator('[data-testid^="row-"]', { hasText: PAGE_NAME }).first();
const pId = (await pRow.getAttribute("data-testid") || "").replace("row-", "");
check("C 新建：记录出现在列表", (await pRow.count()) === 1, `id=${pId}`);

// 详情
await page.getByTestId(`detail-page-${pId}`).click();
await page.waitForURL(`**/list-page/${pId}`, { timeout: 4000 });
const pBody = await page.getByTestId("page-detail-body").innerText();
check("C 详情：整页只读含全字段", pBody.includes(pId) && pBody.includes(PAGE_NAME) && pBody.includes("188.80"), pBody.replace(/\n/g, " | ").slice(0, 120));
check("C 详情：无输入控件", (await page.getByTestId("page-detail").locator("input,select,textarea").count()) === 0);
await page.screenshot({ path: `${OUT}/menu_05_page_detail.png`, fullPage: true });
await page.getByTestId("page-detail-back").click();
await page.waitForURL("**/list-page", { timeout: 4000 });
check("C 详情：返回列表", page.url().endsWith("/list-page"));

// 编辑
await setSearch(PAGE_NAME);
await page.getByTestId(`detail-page-${pId}`).click();
await page.waitForURL(`**/list-page/${pId}`, { timeout: 4000 });
await page.getByTestId("page-detail-edit").click();
await page.waitForURL(`**/list-page/${pId}/edit`, { timeout: 4000 });
check("C 编辑：回填 + ID 只读", (await pf.getByLabel(/产品名称/).inputValue()) === PAGE_NAME && (await pf.getByLabel(/产品 ID/).isDisabled()));
const PAGE_EDITED = PAGE_NAME + "（页面已改）";
await pf.getByLabel(/产品名称/).fill(PAGE_EDITED);
await page.getByTestId("page-edit-submit").click();
await page.waitForURL("**/list-page", { timeout: 4000 });
await waitToast("已保存");
await setSearch(PAGE_EDITED);
check("C 编辑：修改生效", (await page.locator('[data-testid^="row-"]', { hasText: PAGE_EDITED }).count()) === 1);

// 删除
await page.getByTestId(`delete-${pId}`).click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
await page.getByTestId("delete-confirm-submit").click();
await waitToast("已删除");
await page.waitForTimeout(400);
check("C 删除：记录消失 + 总数回初值", (await page.getByTestId(`row-${pId}`).count()) === 0 && (await totalUnfiltered()) === p0, `${p1} → ${p0}`);

// 健壮性：不存在的 ID
await page.goto(BASE + "/list-page/P-9999", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("C 健壮性：不存在 ID 显示友好空态", await page.getByTestId("page-detail-missing").isVisible());
await page.screenshot({ path: `${OUT}/menu_06_page_crud_done.png`, fullPage: true });

/* ══════════════════════════════════════════════════════════════════════
 * D. 侧边栏两个并列菜单入口
 * ══════════════════════════════════════════════════════════════════════ */

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const navDialog = page.getByTestId("nav-list");
const navPage = page.getByTestId("nav-list-page");
check("D 侧边栏：弹窗式菜单项存在", await navDialog.isVisible(), "nav-list");
check("D 侧边栏：页面式菜单项存在", await navPage.isVisible(), "nav-list-page");
if (await navDialog.isVisible()) check("D 菜单标签含「弹窗式」", (await navDialog.innerText()).includes("弹窗式"), (await navDialog.innerText()).trim());
if (await navPage.isVisible()) check("D 菜单标签含「页面式」", (await navPage.innerText()).includes("页面式"), (await navPage.innerText()).trim());
await page.screenshot({ path: `${OUT}/menu_07_sidebar_two_menus.png`, fullPage: true });
await navDialog.click();
await page.waitForURL("**/list", { timeout: 4000 });
check("D 点击弹窗式菜单到达 /list", page.url().endsWith("/list"), page.url());
await navPage.click();
await page.waitForURL("**/list-page", { timeout: 4000 });
check("D 点击页面式菜单到达 /list-page", page.url().endsWith("/list-page"), page.url());

/* ══════════════════════════════════════════════════════════════════════
 * E. 汇总
 * ══════════════════════════════════════════════════════════════════════ */

report.ok = fail.length === 0 && report.consoleErrors.length === 0 && report.pageErrors.length === 0;
report.failedChecks = fail;
report.totals = { t0, t1, p0, p1 };
writeFileSync(`${OUT}/verify_menu_and_crud.json`, JSON.stringify(report, null, 2));

console.log(`\nconsole errors: ${report.consoleErrors.length}  pageerrors: ${report.pageErrors.length}`);
if (report.consoleErrors.length) console.log(report.consoleErrors.slice(0, 5));
if (report.pageErrors.length) console.log(report.pageErrors.slice(0, 5));
console.log(`断言：${Object.keys(report.checks).length} 项，失败 ${fail.length} 项`);
console.log(`\n结果: ${report.ok ? "✅ ALL PASS" : "❌ FAIL — " + fail.join(", ")}`);

await browser.close();
process.exit(report.ok ? 0 : 1);
