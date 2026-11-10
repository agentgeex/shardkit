/**
 * verify_layout_feedback_20260928.mjs — 【验收反馈：维护者 4 条修改建议】端到端验收
 *
 * 覆盖维护者 2026-09-28 验收提出的 4 条建议：
 *   #1 认证页面独立化：/login 为 AppShell 之外的整页认证页（无侧边栏 / 无标签栏）
 *   #2 产品列表（页面式 CRUD）：点击「页面式新建」不新开标签，与列表页共用同一标签；
 *      在新建页点「保存」后回到列表页，且列表新增一条记录（闭环）
 *   #3 按钮边框：弹出新建页的「取消」按钮有边框；页面内所有 <button> 均可见边框
 *   #4 导航栏未选中项加边框
 *
 * 用法：先起 dev（npm run dev，端口 5178），再 `node scripts/verify_layout_feedback_20260928.mjs`
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
await ctx.route((u) => u.hostname === "telemetry.refine.dev", (r) => r.fulfill({ status: 200, body: "" }));
const page = await ctx.newPage();

page.on("console", (m) => { if (m.type() === "error") report.consoleErrors.push(m.text()); });
page.on("pageerror", (e) => report.pageErrors.push(String(e)));

const check = (name, cond, detail = "") => {
  report.checks[name] = { pass: !!cond, detail };
  console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${detail ? "  — " + detail : ""}`);
  if (!cond) fail.push(name);
};

/** 取某元素的「有效边框」：左右上下任一边可见即算有边框 */
const hasVisibleBorder = async (locator) => {
  return await locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    const widths = [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(parseFloat);
    const styles = [cs.borderTopStyle, cs.borderRightStyle, cs.borderBottomStyle, cs.borderLeftStyle];
    const colors = [cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor];
    const opaque = (c) => {
      if (/rgba\(.*,\s*0(\.0+)?\)/.test(c) || c === "transparent") return false;
      return true;
    };
    return widths.some((w, i) => w > 0 && styles[i] !== "none" && opaque(colors[i]));
  });
};

const tabKeyOf = async (p) => await p.getAttribute("data-testid");

/* ══════════════════════════════════════════════════════════════════════
 * #1 认证页独立化
 * ══════════════════════════════════════════════════════════════════════ */
{
  await page.goto(BASE + "/login", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("#1 /login 可访问", page.url().endsWith("/login"));
  const loginCard = page.getByTestId("auth-login-page");
  check("#1 登录卡渲染", await loginCard.count() === 1);
  // 独立页不应含侧边栏（aside）与工作区标签栏（tabbar）
  check("#1 无侧边栏", (await page.locator("aside").count()) === 0);
  check("#1 无标签栏", (await page.locator('[data-testid="tabbar"]').count()) === 0);
  await page.screenshot({ path: `${OUT}/fb_login_standalone.png`, fullPage: true });
}

/* ══════════════════════════════════════════════════════════════════════
 * #2 页面式新建共用标签 + 保存回到列表并新增记录
 * ══════════════════════════════════════════════════════════════════════ */
{
  // 干净起点
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("shardkit.worktabs.v1"));
  await page.goto(BASE + "/list-page", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const tabsBefore = await page.locator('[data-testid^="tab-"]').count();
  const listTotalBefore = Number((await page.getByTestId("list-total").innerText()).match(/(\d+)/)[1]);

  // 点击「页面式新建」
  await page.getByTestId("create-product-page").click();
  await page.waitForTimeout(500);
  check("#2 跳转到新建页", page.url().endsWith("/list-page/new"));
  const tabsAfterNew = await page.locator('[data-testid^="tab-"]').count();
  check("#2 未新开标签", tabsAfterNew === tabsBefore, `before=${tabsBefore} after=${tabsAfterNew}`);
  // 列表页标签应处于激活态
  const listTab = page.locator('[data-testid="tab-/list-page"]');
  check("#2 列表页标签存在", (await listTab.count()) === 1);
  check("#2 列表页标签为激活态", (await listTab.getAttribute("data-active")) === "true");
  await page.screenshot({ path: `${OUT}/fb_page_new_shared_tab.png`, fullPage: true });

  // #3 新建页「取消」按钮有边框
  const cancelBtn = page.getByTestId("page-new-cancel");
  check("#3 新建页取消按钮有边框", await hasVisibleBorder(cancelBtn));
  // #3 全页所有 <button> 均可见边框
  const allBtns = page.locator("main button:visible");
  const n = await allBtns.count();
  let noBorder = 0;
  for (let i = 0; i < n; i++) {
    if (!(await hasVisibleBorder(allBtns.nth(i)))) noBorder++;
  }
  check("#3 新建页所有按钮均有边框", noBorder === 0, `buttons=${n} 无边框=${noBorder}`);

  // 填写并保存（平台/状态为 Select，需点选）
  await page.getByTestId("page-form").waitFor({ timeout: 3000 });
  // 必填文本字段：按 placeholder 精确定位
  await page.getByPlaceholder("如：无线蓝牙耳机 Pro").fill("验收新增产品X");
  await page.getByPlaceholder("8517.12").fill("9988.77");
  await page.getByPlaceholder("如：消费电子").fill("测试类目");
  await page.locator('[data-testid="page-form"] input[type="number"]').fill("12.34");
  // 平台 Select
  await page.locator('[data-testid="page-form"] [role="combobox"]').first().click();
  await page.waitForTimeout(200);
  await page.getByRole("option", { name: "Amazon" }).click();
  await page.waitForTimeout(200);
  await page.getByTestId("page-new-submit").click();
  await page.waitForTimeout(800);

  check("#2 保存后回到列表页", page.url().endsWith("/list-page"));
  const listTotalAfter = Number((await page.getByTestId("list-total").innerText()).match(/(\d+)/)[1]);
  check("#2 列表新增一条记录", listTotalAfter === listTotalBefore + 1, `before=${listTotalBefore} after=${listTotalAfter}`);
  const tabsAfterSave = await page.locator('[data-testid^="tab-"]').count();
  check("#2 保存后标签数不变", tabsAfterSave === tabsBefore, `before=${tabsBefore} after=${tabsAfterSave}`);
  await page.screenshot({ path: `${OUT}/fb_after_save_list.png`, fullPage: true });
}

/* ══════════════════════════════════════════════════════════════════════
 * #4 导航栏未选中项加边框
 * ══════════════════════════════════════════════════════════════════════ */
{
  await page.goto(BASE + "/list-page", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  // 侧边栏案例导航项（未被选中的）：找 /dashboard 的 nav 链接（当前在 /list-page）
  const inactiveNav = page.getByTestId("nav-dashboard");
  check("#4 未选中导航项存在", (await inactiveNav.count()) === 1);
  check("#4 未选中导航项有边框", await hasVisibleBorder(inactiveNav));
  // 多级菜单未选中叶子
  const menuLeaf = page.locator('[data-testid^="menu-leaf-"]').first();
  if ((await menuLeaf.count()) > 0) {
    check("#4 多级菜单未选中叶子有边框", await hasVisibleBorder(menuLeaf));
  }
  await page.screenshot({ path: `${OUT}/fb_nav_border.png`, fullPage: true });
}

/* ══════════════════════════════════════════════════════════════════════
 * 全局：0 console error / 0 pageerror
 * ══════════════════════════════════════════════════════════════════════ */
report.ok = fail.length === 0 && report.consoleErrors.length === 0 && report.pageErrors.length === 0;
writeFileSync(`${OUT}/verify_layout_feedback_20260928.json`, JSON.stringify(report, null, 2));
console.log(`\n${report.ok ? "✅ ALL PASS" : "❌ FAIL: " + fail.join(", ")}`);
console.log(`console errors: ${report.consoleErrors.length}, page errors: ${report.pageErrors.length}`);
await browser.close();
process.exit(report.ok ? 0 : 1);
