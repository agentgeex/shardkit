/**
 * verify_content_frame_20261028.mjs — 验收「页面排版：去页头 + 白框内容区」
 * ────────────────────────────────────────────────────────────────────────
 * 规范来源：note_d8e31b07502a《页面排版模式：去页头 + 白框内容区》
 * 覆盖：
 *   /list            列表页（弹窗式 CRUD）—— 无页头 + 白框 + 页头动作已搬到工具行最右
 *   /list-page       列表页（页面式 CRUD）—— 同上
 *   /list-page/1     详情页            —— 保留页头（实体身份）+ 白框 p-5 + 返回在最后
 *
 * 判定分三类：
 *   ① 白框规格   bg=rgb(255,255,255) / radius=12 / border=1 / padding=16|20
 *   ② 几何关系   内容在框内；白框与画布有间距（x≥200 / y≥90 / w>1000）
 *   ③ 按钮分色   实底 + 白字，对比度 ≥3:1（实测，不靠"这是语义色"推定）
 *
 * 用法：node scripts/verify_content_frame_20261028.mjs
 * 纪律：只读页面、只点 tab / 刷新，不提交业务表单。
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5178";
mkdirSync("logs", { recursive: true });

const results = [];
let failed = 0;
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  if (!ok) failed++;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name}${extra ? "  — " + extra : ""}`);
}

/* ── 对比度（WCAG 相对亮度） ── */
function srgb(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function lum([r, g, b]) {
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function contrast(fg, bg) {
  const a = lum(fg), b = lum(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function parseRgb(s) {
  const m = s.match(/(\d+(?:\.\d+)?)/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}

const browser = await chromium.launch();
// shard-kit 默认主题是 dark（index.html 预置），白框规格要在亮色下验；暗色单列一组对照
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
await ctx.addInitScript(() => {
  try { localStorage.setItem("shardkit.theme", "light"); } catch {}
});
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
await page.route((u) => u.hostname === "telemetry.refine.dev", (r) =>
  r.fulfill({ status: 200, contentType: "application/json", body: "{}" })
);

/** 读白框规格 + 几何 */
async function frameMetrics() {
  return page.evaluate(() => {
    const f = document.querySelector('[data-testid="content-frame"]');
    if (!f) return null;
    const cs = getComputedStyle(f);
    const fr = f.getBoundingClientRect();
    const child = f.querySelector("table, section, .overflow-x-auto, [data-testid]") || f.firstElementChild;
    const cr = child ? child.getBoundingClientRect() : null;
    return {
      bg: cs.backgroundColor,
      radius: parseFloat(cs.borderRadius),
      borderW: parseFloat(cs.borderTopWidth),
      padTop: parseFloat(cs.paddingTop),
      x: Math.round(fr.x),
      y: Math.round(fr.y),
      w: Math.round(fr.width),
      inside: cr ? cr.x >= fr.x - 1 && cr.y >= fr.y - 1 && cr.right <= fr.right + 1 : true,
      overflowHidden: cs.overflow === "hidden",
    };
  });
}

function assertFrame(label, m, padExpect) {
  check(`${label}｜白框存在`, !!m);
  if (!m) return;
  check(`${label}｜底色 rgb(255,255,255)`, m.bg === "rgb(255, 255, 255)", m.bg);
  check(`${label}｜圆角 12px`, m.radius === 12, String(m.radius));
  check(`${label}｜边框 1px`, m.borderW === 1, String(m.borderW));
  check(`${label}｜内边距 ${padExpect}px`, m.padTop === padExpect, String(m.padTop));
  check(`${label}｜内容几何在框内`, m.inside);
  check(`${label}｜白框与画布有间距`, m.x >= 200 && m.y >= 90 && m.w > 1000, `x=${m.x} y=${m.y} w=${m.w}`);
  check(`${label}｜未加 overflow-hidden（不裁 sticky/下拉）`, !m.overflowHidden);
}

/* ══════════ 1. /list 列表页 ══════════ */
await page.goto(`${BASE}/list`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("/list｜页面渲染", (await page.getByTestId("list-case").count()) === 1);
check("/list｜列表页无页头 h1（导航已说明这是哪一页）",
  (await page.locator("[data-testid='list-case'] h1").count()) === 0,
  `h1=${await page.locator("[data-testid='list-case'] h1").count()}`);
assertFrame("/list", await frameMetrics(), 16);

// 去页头 ≠ 删功能：三个动作必须还在，且在工具行最右侧
check("/list｜页头动作已搬家（新建产品）", (await page.getByTestId("create-product").count()) === 1);
check("/list｜页头动作已搬家（导出）", (await page.getByTestId("list-export").count()) === 1);
check("/list｜页头动作已搬家（切到页面式 CRUD）", (await page.getByTestId("goto-list-page").count()) === 1);

const listRowOrder = await page.evaluate(() => {
  const total = document.querySelector("[data-testid='list-total']");
  const btn = document.querySelector("[data-testid='create-product']");
  if (!total || !btn) return null;
  return { totalX: total.getBoundingClientRect().x, btnX: btn.getBoundingClientRect().x };
});
check("/list｜动作确实在最右侧（在「共 N 条」之后）",
  !!listRowOrder && listRowOrder.btnX >= listRowOrder.totalX,
  listRowOrder ? `total=${Math.round(listRowOrder.totalX)} btn=${Math.round(listRowOrder.btnX)}` : "缺失");

// 按钮分色：新建=蓝实底，切换=青实底
const btnStyle = await page.evaluate(() => {
  const pick = (id) => {
    const el = document.querySelector(`[data-testid='${id}']`);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { bg: cs.backgroundColor, fg: cs.color };
  };
  return { create: pick("create-product"), view: pick("goto-list-page") };
});
for (const [k, label, min] of [["create", "新建产品", 4.5], ["view", "切到页面式 CRUD", 3]]) {
  const st = btnStyle[k];
  check(`/list｜${label} 实底按钮`, !!st && !/rgba\(0, 0, 0, 0\)/.test(st.bg), st ? st.bg : "缺失");
  if (st && !/rgba\(0, 0, 0, 0\)/.test(st.bg)) {
    const ratio = contrast(parseRgb(st.fg), parseRgb(st.bg));
    check(`/list｜${label} 对比度 ≥${min}:1`, ratio >= min, ratio.toFixed(2) + ":1");
  }
}

// 行内图标按钮：ghost 在白底看不见 → 必须是实底（详情=青 / 编辑=橙 / 删除=红）
const rowBtns = await page.evaluate(() => {
  // /list（弹窗式）行内按钮的 testid 前缀是 detail-/edit-/delete-
  const ids = ["detail-", "edit-", "delete-"];
  const out = {};
  for (const pre of ids) {
    const el = document.querySelector(`[data-testid^='${pre}']`);
    out[pre] = el ? getComputedStyle(el).backgroundColor : null;
  }
  return out;
});
for (const [pre, label] of [["detail-", "详情（青）"], ["edit-", "编辑（橙）"], ["delete-", "删除（红）"]]) {
  const bg = rowBtns[pre];
  check(`/list｜行内${label} 实底（白底可见）`, !!bg && !/rgba\(0, 0, 0, 0\)/.test(bg), bg || "缺失");
}

/* ══════════ 2. /list-page 列表页 ══════════ */
await page.goto(`${BASE}/list-page`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("/list-page｜页面渲染", (await page.getByTestId("list-page-case").count()) === 1);
check("/list-page｜列表页无页头 h1", (await page.locator("[data-testid='list-page-case'] h1").count()) === 0);
assertFrame("/list-page", await frameMetrics(), 16);
check("/list-page｜页头动作已搬家（页面式新建）", (await page.getByTestId("create-product-page").count()) === 1);
check("/list-page｜页头动作已搬家（切到弹窗式 CRUD）", (await page.getByTestId("goto-list-dialog").count()) === 1);

/* ══════════ 3. /list-page/:id 详情页 ══════════ */
// 详情页 id 从真实行内按钮取（产品 id 不是 1）
const detailBtn = page.locator("[data-testid^='detail-page-']").first();
const detailTestId = (await detailBtn.count()) > 0 ? await detailBtn.getAttribute("data-testid") : null;
const detailId = detailTestId ? detailTestId.replace("detail-page-", "") : null;
const detailPath = detailId ? `/list-page/${detailId}` : "/list-page";
await page.goto(`${BASE}${detailPath}`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const detailOk = (await page.getByTestId("page-detail").count()) === 1;
check("详情页｜页面渲染", detailOk, detailPath);
if (detailOk) {
  check("详情页｜保留页头 h1（实体身份，不是重复导航）", (await page.locator("[data-testid='page-header'] h1").count()) === 1);
  check("详情页｜页头与标题同行（inline，无 mb-6）",
    (await page.locator("[data-testid='page-header']").evaluate((el) => getComputedStyle(el).marginBottom)) === "0px");
  assertFrame("详情页", await frameMetrics(), 20);
  check("详情页｜白框内不再套卡片（section 用横线分区）",
    (await page.locator("[data-testid='content-frame'] .rounded-lg.border").count()) === 0);
  // 返回永远是最后一个元素
  const actionsOrder = await page.evaluate(() => {
    const wrap = document.querySelector("[data-testid='page-header'] > div:last-child");
    if (!wrap) return null;
    const ids = [...wrap.querySelectorAll("[data-testid]")].map((e) => e.dataset.testid);
    return ids;
  });
  check("详情页｜「返回」是页头最后一个动作",
    Array.isArray(actionsOrder) && actionsOrder[actionsOrder.length - 1] === "page-detail-back",
    JSON.stringify(actionsOrder));

  const backSt = await page.evaluate(() => {
    const el = document.querySelector("[data-testid='page-detail-back']");
    const edit = document.querySelector("[data-testid='page-detail-edit']");
    const g = (e) => (e ? { bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e).color } : null);
    return { back: g(el), edit: g(edit) };
  });
  for (const [k, label] of [["back", "返回（紫）"], ["edit", "编辑（橙）"]]) {
    const st = backSt[k];
    check(`详情页｜${label} 实底按钮`, !!st && !/rgba\(0, 0, 0, 0\)/.test(st.bg), st ? st.bg : "缺失");
    if (st) {
      const ratio = contrast(parseRgb(st.fg), parseRgb(st.bg));
      check(`详情页｜${label} 对比度 ≥3:1`, ratio >= 3, ratio.toFixed(2) + ":1");
    }
  }
}

/* ══════════ 4. 暗色对照：白框必须走 --card 令牌，不能写死白色 ══════════ */
// 另一个 context：initScript 会强制写入主题，同 context 内改 localStorage 会被它覆盖
const darkCtx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark" });
await darkCtx.addInitScript(() => {
  try { localStorage.setItem("shardkit.theme", "dark"); } catch {}
});
const darkPage = await darkCtx.newPage();
await darkPage.route((u) => u.hostname === "telemetry.refine.dev", (r) =>
  r.fulfill({ status: 200, contentType: "application/json", body: "{}" })
);
await darkPage.goto(`${BASE}/list`, { waitUntil: "networkidle" });
await darkPage.waitForTimeout(800);
const darkFrame = await darkPage.evaluate(() => {
  const f = document.querySelector('[data-testid="content-frame"]');
  if (!f) return null;
  const cs = getComputedStyle(f);
  const canvas = getComputedStyle(document.querySelector("main") || document.body).backgroundColor;
  return {
    bg: cs.backgroundColor,
    canvas,
    radius: parseFloat(cs.borderRadius),
    borderW: parseFloat(cs.borderTopWidth),
    padTop: parseFloat(cs.paddingTop),
    isDark: document.documentElement.classList.contains("dark"),
  };
});
check("暗色｜已进入暗色模式", !!darkFrame && darkFrame.isDark);
check("暗色｜白框仍存在", !!darkFrame);
check("暗色｜底色未写死白色（应为 --card 暗档）",
  !!darkFrame && darkFrame.bg !== "rgb(255, 255, 255)", darkFrame ? darkFrame.bg : "缺失");
check("暗色｜白框明显亮于画布（层次仍成立）",
  !!darkFrame && darkFrame.bg !== darkFrame.canvas,
  darkFrame ? `frame=${darkFrame.bg} canvas=${darkFrame.canvas}` : "缺失");
check("暗色｜圆角/边框/内距规格不变",
  !!darkFrame && darkFrame.radius === 12 && darkFrame.borderW === 1 && darkFrame.padTop === 16,
  darkFrame ? `r=${darkFrame.radius} b=${darkFrame.borderW} p=${darkFrame.padTop}` : "缺失");
await darkCtx.close();


/* ══════════ 5. 全站扫描：每个页面都必须「恰好一个白框」且规格一致 ══════════ */
const ALL_ROUTES = [
  ["/", "案例索引", "list"],
  ["/dashboard", "仪表盘", "list"],
  ["/list", "列表·弹窗式", "list"],
  ["/list-page", "列表·页面式", "list"],
  ["/list-page/P-1001", "详情·产品", "detail"],
  ["/list-page/new", "新建·产品", "detail"],
  ["/list-page/P-1001/edit", "编辑·产品", "detail"],
  ["/form", "表单·全部示例", "detail"],
  ["/form/recipe", "表单·业务配方", "detail"],
  ["/table", "表格·基础", "list"],
  ["/table/card", "表格·卡片", "list"],
  ["/search", "查询·通用", "list"],
  ["/search/orders", "查询·订单", "list"],
  ["/plan-flow", "计划流程图", "fill"],
  ["/plan-flow-fit", "计划流程图·自适应网格", "fill"],
  ["/detail", "详情·Agent", "detail"],
  ["/detail-view", "详情·表格型", "detail"],
  ["/auth", "认证演示", "list"],
  ["/error", "错误页", "list"],
  ["/components", "组件展厅", "list"],
  ["/waterfall", "瀑布流", "list"],
  ["/blocks", "布局区块", "list"],
  ["/personal/center", "个人中心", "detail"],
  ["/menu", "多级菜单", "list"],
  ["/menu/reports/daily", "菜单占位页", "list"],
  ["/blank", "空白页", "list"],
];

const sweepFail = [];
for (const [route, name, kind] of ALL_ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const m = await page.evaluate(() => {
    const fs = [...document.querySelectorAll('[data-testid="content-frame"]')];
    const h1 = document.querySelectorAll("h1").length;
    const f = fs[0];
    const cs = f ? getComputedStyle(f) : null;
    const r = f ? f.getBoundingClientRect() : null;
    return {
      count: fs.length,
      bg: cs ? cs.backgroundColor : null,
      radius: cs ? parseFloat(cs.borderRadius) : null,
      borderW: cs ? parseFloat(cs.borderTopWidth) : null,
      pad: cs ? parseFloat(cs.paddingTop) : null,
      x: r ? Math.round(r.x) : null,
      y: r ? Math.round(r.y) : null,
      w: r ? Math.round(r.width) : null,
      h1,
    };
  });
  const padExpect = kind === "fill" ? 0 : kind === "detail" ? 20 : 16;
  const problems = [];
  if (m.count !== 1) problems.push(`白框数=${m.count}（应恰好 1）`);
  if (m.bg !== "rgb(255, 255, 255)") problems.push(`底色=${m.bg}`);
  if (m.radius !== 12) problems.push(`圆角=${m.radius}`);
  if (m.borderW !== 1) problems.push(`边框=${m.borderW}`);
  if (m.pad !== padExpect) problems.push(`内距=${m.pad}（应 ${padExpect}）`);
  if (!(m.x >= 200 && m.y >= 90 && m.w > 1000)) problems.push(`位置 x=${m.x} y=${m.y} w=${m.w}`);
  // 列表页不得有页头 h1；详情/表单页必须有
  if (kind === "list" && m.h1 > 0 && !["/components", "/error"].includes(route)) {
    problems.push(`列表页仍有 h1×${m.h1}`);
  }
  if (kind === "detail" && m.h1 === 0) problems.push("详情/表单页缺身份 h1");
  if (problems.length) sweepFail.push(`${route}(${name}): ${problems.join(" / ")}`);
  console.log(`${problems.length ? "[FAIL]" : "[PASS]"} 全站 ${route.padEnd(24)} ${name}${problems.length ? "  — " + problems.join(" / ") : ""}`);
}
check(`全站 ${ALL_ROUTES.length} 路由白框规格一致`, sweepFail.length === 0, sweepFail.slice(0, 3).join(" | "));

/* ══════════ 6. 零错误 ══════════ */
check("全程 0 个 pageerror", pageErrors.length === 0, pageErrors.slice(0, 2).join(" | "));

await browser.close();
console.log(failed === 0 ? "\nALL PASS" : `\nSOME FAIL (${failed})`);
process.exit(failed === 0 ? 0 : 1);
