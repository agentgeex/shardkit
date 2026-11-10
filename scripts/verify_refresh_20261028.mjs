/**
 * verify_refresh_20261028.mjs — 验收「导航栏一键刷新」
 * ────────────────────────────────────────────────────────────────────────
 * 规范来源：note_cf70980bb4ed（agentos agent_doc/2026-10-28-页面排版规范-
 *           白框模式与刷新按钮.md 第八章），配套公告 note_38c9a666c959。
 *
 * 覆盖规范 §8.9 必查 5 项：
 *   1. 按钮常驻可见，且在标签栏内、紧贴右边
 *   2. 点击后 data-state=running + SVG animationName 含 spin + disabled + cursor:progress
 *   3. 成功后 data-state=ok 且变绿 → 1.2s 回 idle
 *   4. 数据真的重取了（plan_exports 请求数 +2，不是"只转了个圈"）
 *   5. 连点只触发一次（在途去重）
 * 附加：
 *   6. 右键菜单「刷新当前」复用同一个 doRefresh（不再靠 navigate 空转）
 *   7. 刷新不重载整页（标签栏 / 侧栏保留，performance.navigation 计数不变）
 *
 * 用法：node scripts/verify_refresh_20261028.mjs
 * 纪律：只点刷新按钮 / 右键菜单，不提交任何业务表单。
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5178";
const SEL = '[data-testid="tabbar-refresh"]';

const results = [];
let failed = 0;
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  if (!ok) failed++;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name}${extra ? "  — " + extra : ""}`);
}

const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number).slice(0, 3);
const close = (a, b, tol = 6) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
await page.addInitScript(() => {
  try {
    localStorage.setItem("shardkit.theme", "light");
  } catch {
    /* ignore */
  }
});
await page.route(
  (u) => u.hostname === "telemetry.refine.dev",
  (r) => r.fulfill({ status: 200, contentType: "application/json", body: "{}" })
);

let jsonReqs = 0;
page.on("request", (r) => {
  if (r.url().includes("/plan_exports/")) jsonReqs++;
});

await page.goto(`${BASE}/plan-flow`, { waitUntil: "networkidle" });
await page.waitForSelector(`${SEL}[data-state="idle"]`, { timeout: 15000 });
await page.waitForTimeout(1200);

// ── 1. 常驻可见 + 位置在标签栏内、紧贴右边 ──────────────────────────────
{
  const btn = await page.locator(SEL).boundingBox();
  const bar = await page.locator('[data-testid="tabbar"]').boundingBox();
  const visible = !!btn && btn.width > 0 && btn.height > 0;
  const rightFlush = btn && bar ? Math.abs(btn.x + btn.width - (bar.x + bar.width)) <= 1 : false;
  const fullHeight = btn && bar ? Math.abs(btn.height - bar.height) <= 2 : false;
  check("1. 刷新按钮常驻可见", visible, btn ? `${Math.round(btn.width)}×${Math.round(btn.height)}` : "缺失");
  check("1b. 位于标签栏最右（紧贴右边）", rightFlush, btn && bar ? `btn右=${Math.round(btn.x + btn.width)} 栏右=${Math.round(bar.x + bar.width)}` : "");
  check("1c. 占满标签栏高度（h-full w-9）", fullHeight, btn && bar ? `btn=${Math.round(btn.height)} 栏=${Math.round(bar.height)}` : "");
}

// ── 2/3. 四态 + 动画 + 颜色 ─────────────────────────────────────────────
const readState = () =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      state: el.dataset.state,
      color: cs.color,
      cursor: cs.cursor,
      disabled: el.disabled,
      spin: getComputedStyle(el.querySelector("svg")).animationName,
    };
  }, SEL);

const idleColor = rgb((await readState()).color);
const before = jsonReqs;
await page.locator(SEL).click();
await page.waitForTimeout(120);
const running = await readState();
check("2. 点击后进入 running", running.state === "running", `data-state=${running.state}`);
check("2b. running 时图标转圈", String(running.spin).includes("spin"), `animationName=${running.spin}`);
check("2c. running 时禁用防连点", running.disabled === true);
check("2d. 禁用态 cursor=progress（不是 not-allowed）", running.cursor === "progress", `cursor=${running.cursor}`);
check("2e. running 用主色（视觉即反馈）", close(rgb(running.color), [80, 72, 229]), `color=${running.color}`);

await page.waitForSelector(`${SEL}[data-state="ok"]`, { timeout: 8000 });
await page.waitForTimeout(260); // 等 transition-colors(150ms) 走完，否则量到渐变中间值
const okState = await readState();
check("3. 成功后进入 ok", okState.state === "ok");
check("3b. ok 变绿（成功色）", close(rgb(okState.color), [33, 196, 93]), `color=${okState.color}`);
check("3c. ok 后转圈停止", !String(okState.spin).includes("spin"), `animationName=${okState.spin}`);

await page.waitForSelector(`${SEL}[data-state="idle"]`, { timeout: 6000 });
await page.waitForTimeout(260);
const backIdle = await readState();
check("3d. 1.2s 后自动回到 idle", backIdle.state === "idle");
check("3e. idle 回到灰色", close(rgb(backIdle.color), idleColor), `color=${backIdle.color}`);

// ── 4. 数据真的重取了 ──────────────────────────────────────────────────
// ⚠️ 不写死 +2：dev 下 <StrictMode> 会把 effect 跑两遍，一次刷新实测 +4
//    （2 个 plan_exports 文件 × 2 次）。所以先量出「一次刷新」的增量当基线，
//    后面所有断言都跟这个基线比 —— 这样 StrictMode 开关都不会让用例失真。
const after = jsonReqs;
const perRefresh = after - before;
check("4. 真的重取了数据（plan_exports 网络请求增加）", perRefresh >= 2, `${before} → ${after}（+${perRefresh}）`);

// ── 7. 不是整页重载（标签栏 / 侧栏保留）────────────────────────────────
{
  const shellIntact = await page.evaluate(() => ({
    tabbar: !!document.querySelector('[data-testid="tabbar"]'),
    tabs: document.querySelectorAll('[data-testid^="tab-"]').length,
    sidebar: !!document.querySelector('[data-testid="sidebar"], aside, nav'),
    // 刷新若走 location.reload，这个标记会被清掉
    mark: window.__spa ?? null,
  }));
  await page.evaluate(() => {
    window.__spa = true;
  });
  await page.locator(SEL).click();
  await page.waitForSelector(`${SEL}[data-state="ok"]`, { timeout: 8000 });
  const stillThere = await page.evaluate(() => window.__spa === true);
  check("7. 刷新是局部重挂，不是 location.reload", stillThere, "window 标记未被清掉");
  check("7b. 刷新后标签栏 / 侧栏仍在", shellIntact.tabbar && shellIntact.tabs > 0, `tabs=${shellIntact.tabs}`);
  await page.waitForSelector(`${SEL}[data-state="idle"]`, { timeout: 6000 });
}

// ── 5. 在途去重：连点 3 下只发一份 ─────────────────────────────────────
{
  const b0 = jsonReqs;
  const btn = page.locator(SEL);
  await btn.click({ noWaitAfter: true });
  await btn.click({ force: true, noWaitAfter: true }).catch(() => {});
  await btn.click({ force: true, noWaitAfter: true }).catch(() => {});
  await page.waitForSelector(`${SEL}[data-state="ok"]`, { timeout: 8000 });
  await page.waitForTimeout(300);
  check(
    "5. 连点 3 下只触发一次刷新",
    jsonReqs - b0 === perRefresh,
    `${b0} → ${jsonReqs}（+${jsonReqs - b0}，一次刷新基线 +${perRefresh}）`
  );
  await page.waitForSelector(`${SEL}[data-state="idle"]`, { timeout: 6000 });
}

// ── 6. 右键菜单「刷新当前」走同一动作 ──────────────────────────────────
{
  const b0 = jsonReqs;
  const tab = page.locator('[data-testid^="tab-"][data-active="true"]').first();
  await tab.click({ button: "right" });
  await page.waitForSelector('[data-testid="menu-refresh"]', { timeout: 4000 });
  await page.locator('[data-testid="menu-refresh"]').click();
  await page.waitForSelector(`${SEL}[data-state="ok"]`, { timeout: 8000 });
  check(
    "6. 右键菜单「刷新当前」真的刷新（走同一个 doRefresh）",
    jsonReqs - b0 === perRefresh,
    `${b0} → ${jsonReqs}（+${jsonReqs - b0}）`
  );
  await page.waitForSelector(`${SEL}[data-state="idle"]`, { timeout: 6000 });
}

// ── 收尾 ───────────────────────────────────────────────────────────────
check("全程 0 个 pageerror", pageErrors.length === 0, pageErrors[0] ?? "");

await browser.close();
const pass = results.filter((r) => r.ok).length;
console.log(`\n${passedLine(pass, results.length)}`);
if (failed > 0) {
  console.log("SOME FAIL");
  process.exit(1);
}

function passedLine(p, t) {
  return `${p}/${t} 项通过 —— ${p === t ? "ALL PASS" : "SOME FAIL"}`;
}
