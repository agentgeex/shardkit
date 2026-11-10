/**
 * verify_crud_page.mjs — 【列表页 · 页面式 CRUD（/list-page）】端到端验收
 *
 * 背景（2026-09-19）：两套 CRUD 拆成两个并列的侧边栏菜单入口，对齐参照项目
 *   - /list      列表页 · 弹窗式 CRUD（Dialog 式）
 *   - /list-page 列表页 · 页面式 CRUD（Page 式：新建/编辑/详情走独立页面）
 *
 * 覆盖：
 *   0) 侧边栏「页面案例」组同时存在两个菜单项且都可点击到达
 *   1) 路由直达（含刷新）可正常渲染：/list、/list-page、/list-page/new、
 *      /list-page/:id、/list-page/:id/edit —— 且 /list 不误吃 /list-page
 *   2) Page 式全链路：新建(/list-page/new) → 列表 → 详情(/list-page/:id) → 返回 →
 *      编辑(/list-page/:id/edit) → 生效 → 删除 → 消失
 *   3) 回归：/list 的 Dialog 式入口仍在且行为区分（弹窗不跳路由）
 *   4) 0 console error / 0 pageerror + 截图
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = "http://localhost:5178";
const OUT = "logs";
mkdirSync(OUT, { recursive: true });

const report = { base: BASE, at: new Date().toISOString(), checks: {}, consoleErrors: [], pageErrors: [], ok: false };
const fail = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// 屏蔽 refine 遥测（外网不可达会制造假 console error，与本次改动无关）
await ctx.route((u) => u.hostname === "telemetry.refine.dev", (r) => r.fulfill({ status: 200, body: "" }));
const page = await ctx.newPage();

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
const totalUnfiltered = async () => { await setSearch(""); return totalOf(); };
const waitToast = async (titlePart) => {
  await page.locator('[data-testid="toast"]', { hasText: titlePart }).first()
    .waitFor({ state: "visible", timeout: 4000 });
};

/* ── 0) 侧边栏：两个并列菜单入口 ───────────────────────────── */
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const navDialog = page.getByTestId("nav-list");
const navPage = page.getByTestId("nav-list-page");
check("侧边栏：存在「列表页 · 弹窗式 CRUD」菜单项", await navDialog.isVisible(), "nav-list");
check("侧边栏：存在「列表页 · 页面式 CRUD」菜单项", await navPage.isVisible(), "nav-list-page");
if (await navDialog.isVisible()) {
  const t = (await navDialog.innerText()).trim();
  check("菜单标签可区分（含「弹窗式」）", t.includes("弹窗式"), t);
}
if (await navPage.isVisible()) {
  const t = (await navPage.innerText()).trim();
  check("菜单标签可区分（含「页面式」）", t.includes("页面式"), t);
}
await page.screenshot({ path: `${OUT}/pagecrud_00_sidebar_two_menus.png`, fullPage: true });

// 点击两个菜单项都能到达
await navDialog.click();
await page.waitForURL("**/list", { timeout: 4000 });
check("侧边栏：点击「弹窗式」菜单到达 /list", page.url().endsWith("/list"), page.url());
await navPage.click();
await page.waitForURL("**/list-page", { timeout: 4000 });
check("侧边栏：点击「页面式」菜单到达 /list-page", page.url().endsWith("/list-page"), page.url());

/* ── 1) 路由直达（含刷新）─────────────────────────────────── */
for (const [name, path, probe] of [
  ["弹窗式列表页", "/list", "list-case"],
  ["页面式列表页", "/list-page", "list-page-case"],
  ["Page式新建", "/list-page/new", "page-new"],
  ["Page式详情", "/list-page/P-1001", "page-detail"],
  ["Page式编辑", "/list-page/P-1001/edit", "page-edit"],
]) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const visible = await page.getByTestId(probe).isVisible().catch(() => false);
  check(`路由直达：${path} 渲染正常（${name}）`, visible, `probe=${probe}`);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const visible2 = await page.getByTestId(probe).isVisible().catch(() => false);
  check(`刷新路由：${path} 刷新后仍正常`, visible2);
}
await page.screenshot({ path: `${OUT}/pagecrud_01_direct_routes.png`, fullPage: true });

// 前缀不误吃：/list-page 不得被 /list 匹配（否则会渲染成弹窗式列表页）
await page.goto(BASE + "/list-page", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check(
  "前缀隔离：/list-page 渲染页面式列表页（未被 /list 误吃）",
  (await page.getByTestId("list-page-case").isVisible()) &&
    !(await page.getByTestId("list-case").isVisible().catch(() => false)),
);

/* ── 2) Page 式全链路（/list-page）────────────────────────── */
await page.goto(BASE + "/list-page", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const t0 = await totalUnfiltered();
check("列表加载且有条目", t0 > 0, `共 ${t0} 条`);

check("并存：页面式列表页存在「页面式新建」入口", await page.getByTestId("create-product-page").isVisible());
check("并存：页面式列表页存在切往「弹窗式」的链接", await page.getByTestId("goto-list-dialog").isVisible());
await page.screenshot({ path: `${OUT}/pagecrud_02_list_page_entries.png`, fullPage: true });

await page.getByTestId("create-product-page").click();
await page.waitForURL("**/list-page/new", { timeout: 4000 });
check("Page式新建：点击后进入 /list-page/new", page.url().endsWith("/list-page/new"), page.url());
check("Page式新建：页面标题/返回/保存均存在",
  (await page.getByTestId("page-new").isVisible()) &&
  (await page.getByTestId("page-new-back").isVisible()) &&
  (await page.getByTestId("page-new-submit").isVisible()));

/* 2a) 空表单校验拦截 */
const pf = page.getByTestId("page-form");
await page.getByTestId("page-new-submit").click();
await page.waitForTimeout(300);
check("Page式新建：空表单被校验拦截（未跳转）", page.url().endsWith("/list-page/new"), page.url());
check("Page式新建：显示必填错误", (await page.getByTestId("page-new").innerText()).includes("请填写产品名称"));
await page.screenshot({ path: `${OUT}/pagecrud_03_new_validation.png`, fullPage: true });

/* 2b) 填写并保存 */
const NEW_NAME = "Page式验证产品 E2E";
await pf.getByLabel(/产品名称/).fill(NEW_NAME);
await pf.getByLabel(/HS6/).fill("8517.62");
await pf.getByLabel(/类目/).fill("Page式测试类目");
await pf.getByRole("combobox").nth(0).click();
await page.getByRole("option", { name: "Amazon" }).click();
await pf.getByLabel(/价格/).fill("188.8");
await page.screenshot({ path: `${OUT}/pagecrud_04_new_filled.png`, fullPage: true });
await page.getByTestId("page-new-submit").click();

await page.waitForURL("**/list-page", { timeout: 4000 });
await waitToast("已创建");
check("Page式新建：保存后跳回 /list-page", page.url().endsWith("/list-page"), page.url());
const t1 = await totalUnfiltered();
check("Page式新建：列表总数 +1", t1 === t0 + 1, `${t0} → ${t1}`);
await setSearch(NEW_NAME);
const newRow = page.locator('[data-testid^="row-"]', { hasText: NEW_NAME }).first();
const newId = (await newRow.getAttribute("data-testid") || "").replace("row-", "");
check("Page式新建：记录出现在列表", (await newRow.count()) === 1, `id=${newId}`);

/* ── 3) 列表 → Page 式详情（/list-page/:id） ─────────────── */
await page.getByTestId(`detail-page-${newId}`).click();
await page.waitForURL(`**/list-page/${newId}`, { timeout: 4000 });
check("Page式详情：进入 /list-page/:id", page.url().endsWith(`/list-page/${newId}`), page.url());
const bodyText = await page.getByTestId("page-detail-body").innerText();
check("Page式详情：整页只读含全字段",
  bodyText.includes(newId) && bodyText.includes(NEW_NAME) && bodyText.includes("8517.62") &&
  bodyText.includes("Page式测试类目") && bodyText.includes("Amazon") && bodyText.includes("188.80"),
  bodyText.replace(/\n/g, " | ").slice(0, 140));
check("Page式详情：无输入控件（只读）", (await page.getByTestId("page-detail").locator("input,select,textarea").count()) === 0);
await page.screenshot({ path: `${OUT}/pagecrud_05_detail.png`, fullPage: true });

await page.getByTestId("page-detail-back").click();
await page.waitForURL("**/list-page", { timeout: 4000 });
check("Page式详情：点返回回到 /list-page", page.url().endsWith("/list-page"));

/* ── 4) 详情 → 编辑（/list-page/:id/edit） → 生效 ─────────── */
await setSearch(NEW_NAME);
await page.getByTestId(`detail-page-${newId}`).click();
await page.waitForURL(`**/list-page/${newId}`, { timeout: 4000 });
await page.getByTestId("page-detail-edit").click();
await page.waitForURL(`**/list-page/${newId}/edit`, { timeout: 4000 });
check("Page式编辑：从详情进入 /list-page/:id/edit", page.url().endsWith(`/list-page/${newId}/edit`), page.url());
const ef = page.getByTestId("page-form");
check("Page式编辑：回填当前记录", (await ef.getByLabel(/产品名称/).inputValue()) === NEW_NAME);
check("Page式编辑：产品 ID 只读", await ef.getByLabel(/产品 ID/).isDisabled());
await page.screenshot({ path: `${OUT}/pagecrud_06_edit_prefill.png`, fullPage: true });

const EDITED = NEW_NAME + "（页面已改）";
await ef.getByLabel(/产品名称/).fill(EDITED);
await page.getByTestId("page-edit-submit").click();
await page.waitForURL("**/list-page", { timeout: 4000 });
await waitToast("已保存");
check("Page式编辑：保存后跳回 /list-page", page.url().endsWith("/list-page"));
await setSearch(EDITED);
const editedRow = page.locator('[data-testid^="row-"]', { hasText: EDITED }).first();
check("Page式编辑：修改生效并反映到列表", (await editedRow.count()) === 1, `search=${EDITED}`);

/* ── 5) 删除（二次确认） → 消失 ───────────────────────────── */
await page.getByTestId(`delete-${newId}`).click();
await page.getByTestId("delete-confirm-dialog").waitFor({ state: "visible" });
await page.getByTestId("delete-confirm-submit").click();
await waitToast("已删除");
await page.waitForTimeout(400);
check("删除：记录从列表消失", (await page.getByTestId(`row-${newId}`).count()) === 0);
const t2 = await totalUnfiltered();
check("删除：列表总数回到初值", t2 === t0, `${t1} → ${t2}`);

/* ── 6) 回归：/list 的 Dialog 式入口仍可用（行为区分） ────── */
await page.goto(BASE + "/list", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("回归：/list 存在弹窗式新建入口", await page.getByTestId("create-product").isVisible());
await page.getByTestId("create-product").click();
await page.getByTestId("product-dialog").waitFor({ state: "visible" });
check("回归：Dialog 式新建打开弹窗（不跳路由）", page.url().endsWith("/list") && (await page.getByTestId("product-dialog").isVisible()));
await page.getByTestId("product-dialog-cancel").click();
await page.waitForTimeout(200);

/* 直接访问不存在的 ID → 友好空态（不崩） */
await page.goto(BASE + "/list-page/P-9999", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
check("健壮性：不存在的 ID 显示友好空态", await page.getByTestId("page-detail-missing").isVisible());

await page.goto(BASE + "/list-page", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/pagecrud_07_final.png`, fullPage: true });

report.ok = fail.length === 0 && report.consoleErrors.length === 0 && report.pageErrors.length === 0;
report.failedChecks = fail;
report.totals = { t0, t1, t2 };
writeFileSync(`${OUT}/verify_crud_page.json`, JSON.stringify(report, null, 2));

console.log(`\nconsole errors: ${report.consoleErrors.length}  pageerrors: ${report.pageErrors.length}`);
if (report.consoleErrors.length) console.log(report.consoleErrors.slice(0, 5));
if (report.pageErrors.length) console.log(report.pageErrors.slice(0, 5));
console.log(`\n结果: ${report.ok ? "✅ ALL PASS" : "❌ FAIL — " + fail.join(", ")}`);

await browser.close();
process.exit(report.ok ? 0 : 1);
