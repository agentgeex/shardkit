/**
 * 校验：瀑布流页面 /waterfall（对齐 vue-admin-tpl「组件 → 瀑布流」）
 *
 * 断言：
 *  1. 页面可达，标题「瀑布流」存在
 *  2. 瀑布流容器渲染出图片项（≥ 初始 24 张）
 *  3. 图片为内联 SVG data-URI（零外网）
 *  4. flex 布局：列结构存在（多个纵向列桶）
 *  5. 切到 javascript 布局：项使用绝对定位（position:absolute）且 top/left 生效
 *  6. 响应式：列数随容器宽度变化（缩小视口后列数减少）
 *  7. 无限滚动：滚动到底部触发加载更多（图片数增加）
 *  8. 0 console error
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5178";
const res = [];
const ok = (n, c, d) => { res.push(c); console.log(`[${c ? "PASS" : "FAIL"}] ${n}${d ? "  — " + d : ""}`); };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PE:" + e.message));

await p.goto(`${BASE}/waterfall`, { waitUntil: "networkidle" });
await p.waitForTimeout(1200);

ok("页面标题含「瀑布流」", (await p.locator("h1, h2").filter({ hasText: "瀑布流" }).count()) > 0);

const wf = p.locator('[data-testid="waterfall"]');
ok("瀑布流容器存在", (await wf.count()) > 0);

const imgCount = async () => p.locator('[data-testid="waterfall"] img').count();
const n0 = await imgCount();
ok("渲染图片项 ≥ 24", n0 >= 24, `count=${n0}`);

const srcs = await p.locator('[data-testid="waterfall"] img').evaluateAll((els) =>
  els.slice(0, 3).map((e) => e.getAttribute("src") || "")
);
ok("图片为内联 data:image/svg（零外网）", srcs.every((s) => s.startsWith("data:image/svg+xml")), srcs[0]?.slice(0, 30));

// flex 布局：列桶
const flexCols = await p.locator('[data-testid="waterfall"] .flex-1').count();
ok("flex 布局：多列桶存在", flexCols >= 2, `cols=${flexCols}`);

// 记录当前列数以验证响应式
const colsAt1440 = flexCols;

// 切到 javascript 布局
await p.locator('[data-testid="wf-layout-js"]').click();
await p.waitForTimeout(600);
const absInfo = await p.evaluate(() => {
  const items = [...document.querySelectorAll('[data-testid="waterfall"] > div > div.absolute')];
  const sample = items.slice(0, 5).map((e) => {
    const s = getComputedStyle(e);
    return { pos: s.position, top: s.top, left: s.left };
  });
  return { n: items.length, sample };
});
ok("javascript 布局：项为 absolute 且 top/left 生效", absInfo.n >= 24 && absInfo.sample.every((x) => x.pos === "absolute" && x.top !== "auto" && x.left !== "auto"), `n=${absInfo.n} sample=${JSON.stringify(absInfo.sample[0])}`);

// 响应式：缩小视口，flex 列数应减少
await p.locator('[data-testid="wf-layout-flex"]').click();
await p.waitForTimeout(400);
await p.setViewportSize({ width: 640, height: 900 });
await p.waitForTimeout(700);
const colsSmall = await p.locator('[data-testid="waterfall"] .flex-1').count();
ok("响应式：窄视口列数 < 宽视口列数", colsSmall < colsAt1440, `1440w=${colsAt1440} 640w=${colsSmall}`);
await p.setViewportSize({ width: 1440, height: 1000 });
await p.waitForTimeout(500);

// 无限滚动
const before = await imgCount();
// 页面滚动容器是 <main>（AppShell 内容区），需逐步下滚触发 IntersectionObserver
for (let i = 0; i < 6; i++) {
  await p.evaluate(() => {
    const main = document.querySelector("main");
    if (main) main.scrollBy(0, Math.ceil(main.clientHeight * 0.8));
    else window.scrollBy(0, 800);
  });
  await p.waitForTimeout(500);
}
await p.waitForTimeout(1600);
const after = await imgCount();
ok("无限滚动：触底后图片数增加", after > before, `${before} → ${after}`);

ok("0 console error", errs.length === 0, errs.slice(0, 2).join(" | "));

await p.screenshot({ path: "logs/waterfall.png", fullPage: false });
await b.close();

const all = res.every(Boolean);
console.log(all ? "\n✅ ALL PASS" : "\n❌ SOME FAIL");
process.exit(all ? 0 : 1);
