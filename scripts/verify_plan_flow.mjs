import { chromium } from "playwright";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1680, height: 1000 } });
const fails = [];
const ok = (c, msg) => { console.log(`${c ? "[PASS]" : "[FAIL]"} ${msg}`); if (!c) fails.push(msg); };

await p.goto("http://127.0.0.1:5178/plan-flow", { waitUntil: "networkidle" });
await p.waitForTimeout(3000);
try { await p.getByRole("button", { name: /暂停/ }).first().click({ timeout: 2000 }); } catch {}
await p.waitForTimeout(500);

// ══ 展开态（P0-1 / 2026-10-29 A 方案）════════════════════════════════════
// 先展开到全量：大图自动折叠（排版规范 §10.5，2026-10-28）让默认态 = 17 节点（阶段级），
// 而下方既有断言写的是「默认全展开 137」——此处只做前置，不改任何既有断言。
await p.getByRole("button", { name: "全部展开" }).click();
await p.waitForTimeout(2200);

const ex = await p.evaluate(() => {
  const vp = document.querySelector(".react-flow__viewport");
  const zoom = Number(getComputedStyle(vp).transform.split("(")[1].split(",")[0]);
  const rf = document.querySelector(".react-flow").getBoundingClientRect();
  const nodes = [...document.querySelectorAll(".react-flow__node")].map((el) => ({ id: el.getAttribute("data-id"), r: el.getBoundingClientRect() }));
  const panels = [...document.querySelectorAll(".react-flow__panel")].map((el) => ({ cls: el.className.replace("react-flow__panel", "").trim(), r: el.getBoundingClientRect() }));
  const hit = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
  const overlapOf = (name) => panels.filter((x) => x.cls.includes(name)).reduce((acc, x) => acc + nodes.filter((n) => hit(x.r, n.r)).length, 0);
  const entry = nodes.find((n) => n.id === "run_quality_write_ch10_119dfd");
  const centerHits = panels.map((x) => {
    const el = document.elementFromPoint(x.r.left + x.r.width / 2, x.r.top + x.r.height / 2);
    return { cls: x.cls, coversNode: !!el?.closest?.(".react-flow__node") };
  });
  return {
    zoom, eff14: 14 * zoom, total: nodes.length,
    entry: entry ? { rect: [Math.round(entry.r.left), Math.round(entry.r.top), Math.round(entry.r.width), Math.round(entry.r.height)],
      inside: entry.r.left >= rf.left && entry.r.right <= rf.right && entry.r.top >= rf.top && entry.r.bottom <= rf.bottom } : null,
    panels: panels.map((x) => x.cls),
    ovInfo: overlapOf("top left"), ovMinimap: overlapOf("minimap"), ovLoad: overlapOf("bottom left"),
    centerHits,
    scaleText: document.querySelector('[data-testid="plan-scale"]')?.textContent?.trim() ?? "",
    minimapMounted: !!document.querySelector(".react-flow__minimap"),
    loadCardMounted: panels.some((x) => x.cls.includes("bottom left")),
    loadCardH: Math.round((panels.find((x) => x.cls.includes("bottom left"))?.r.height) ?? 0),
    scaleChips: document.querySelectorAll('button[title^="聚焦到"]').length,
    visible: nodes.filter((n) => n.r.bottom > rf.top && n.r.top < rf.bottom && n.r.right > rf.left && n.r.left < rf.right).length,
  };
});

ok(ex.total === 137, `展开态：节点 = ${ex.total}（应为 137）`);
ok(ex.zoom >= 0.7, `展开态：zoom = ${ex.zoom}（≥0.7）`);
ok(ex.eff14 >= 10, `展开态：14px 标题有效字号 = ${ex.eff14.toFixed(2)}px（可读下限 ≥10）`);
ok(!!ex.entry?.inside, `展开落点：入口 run_quality_write_ch10 在画布内 rect=${JSON.stringify(ex.entry?.rect)}（全展开后只显示 ${ex.visible} 个，属预期：137 节点不可能既全见又可读）`);
ok(ex.ovInfo === 0, `展开态：左上信息卡与节点相交 = ${ex.ovInfo}（应为 0）`);
ok(ex.ovMinimap === 0, `展开态：右下小地图与节点相交 = ${ex.ovMinimap}（应为 0，且默认不挂载 = ${!ex.minimapMounted}）`);
ok(ex.ovLoad === 0, `展开态：左下载荷卡与节点相交 = ${ex.ovLoad}（应为 0）`);
ok(!ex.minimapMounted, `展开态：缩略图默认收起（开关唤出）`);
ok(ex.loadCardMounted && ex.loadCardH <= 32, `展开态：载荷卡降级为一行（高 ${ex.loadCardH}px ≤32；播放/悬停才展开整卡）`);
ok(ex.centerHits.every((h) => !h.coversNode), `展开态：elementsFromPoint(各浮层中心) 均不落在节点上 ${JSON.stringify(ex.centerHits)}`);
ok(ex.scaleChips === 17, `展开态：阶段聚焦徽标 = ${ex.scaleChips} 个（17 列）`);
ok(/已展开 137/.test(ex.scaleText), `展开态：工具栏尺度现算 = 「${ex.scaleText}」`);

// A5 阶段聚焦：点「审校 R2」→ 视口跳走且仍是可读 zoom
await p.locator('button[title^="聚焦到「审校 R2」"]').first().click();
await p.waitForTimeout(1000);
const focused = await p.evaluate(() => {
  const zoom = Number(getComputedStyle(document.querySelector(".react-flow__viewport")).transform.split("(")[1].split(",")[0]);
  const rf = document.querySelector(".react-flow").getBoundingClientRect();
  const nodes = [...document.querySelectorAll(".react-flow__node")].map((el) => el.getBoundingClientRect());
  return { zoom, visible: nodes.filter((b) => b.bottom > rf.top && b.top < rf.bottom && b.right > rf.left && b.left < rf.right).length, nodes: nodes.length };
});
ok(focused.zoom >= 0.7 && focused.zoom <= 0.9, `A5 聚焦后 zoom = ${focused.zoom}（≈0.8）`);
ok(focused.visible > 0 && focused.visible < 30, `A5 聚焦后视野内只剩 ${focused.visible}/${focused.nodes} 个节点（把 137 变可读）`);

// A6 回到入口
await p.getByRole("button", { name: "回到入口" }).click();
await p.waitForTimeout(900);
const backEntry = await p.evaluate(() => {
  const rf = document.querySelector(".react-flow").getBoundingClientRect();
  const n = document.querySelector('.react-flow__node[data-id="run_quality_write_ch10_119dfd"]')?.getBoundingClientRect();
  return { zoom: Number(getComputedStyle(document.querySelector(".react-flow__viewport")).transform.split("(")[1].split(",")[0]),
    inside: n ? n.left >= rf.left && n.right <= rf.right && n.top >= rf.top && n.bottom <= rf.bottom : false };
});
ok(backEntry.inside && backEntry.zoom >= 0.7, `A6 回到入口：zoom = ${backEntry.zoom}、入口在画布内 = ${backEntry.inside}`);

// 显式「适配全图」= 接受不可读，只用于看结构
await p.getByRole("button", { name: "适配全图" }).click();
await p.waitForTimeout(1000);
const fitAll = await p.evaluate(() => {
  const zoom = Number(getComputedStyle(document.querySelector(".react-flow__viewport")).transform.split("(")[1].split(",")[0]);
  const rf = document.querySelector(".react-flow").getBoundingClientRect();
  const nodes = [...document.querySelectorAll(".react-flow__node")].map((el) => el.getBoundingClientRect());
  return { zoom, visible: nodes.filter((b) => b.bottom > rf.top && b.top < rf.bottom && b.right > rf.left && b.left < rf.right).length, nodes: nodes.length };
});
ok(fitAll.visible === fitAll.nodes && fitAll.zoom < 0.2, `「适配全图」：${fitAll.visible}/${fitAll.nodes} 全见，zoom = ${fitAll.zoom}（<0.2，仅看结构）`);

// 回到入口，给下方既有断言一个稳定的起点
await p.getByRole("button", { name: "回到入口" }).click();
await p.waitForTimeout(900);
// ══ 展开态断言结束 ═══════════════════════════════════════════════════

const nNodes = () => p.locator(".react-flow__node").count();
const nEdges = () => p.locator(".react-flow__edge").count();

const total = await nNodes();
ok(total === 137, `默认展开：节点数 = ${total}（应为 137）`);

// 折叠按钮数量 = 父节点数 = 10
const foldBtns = await p.locator('button[title="折叠子任务"]').count();
ok(foldBtns === 10, `父节点徽标数 = ${foldBtns}（应为 10）`);

// 父/子卡片宽度
const widths = await p.evaluate(() => {
  const parent = document.querySelector('.react-flow__node[data-id="run_quality_write_ch10_119dfd"] > div');
  const child = document.querySelector('.react-flow__node[data-id="run_w_ch10_s01_119dfd"] > div');
  return {
    parent: parent?.offsetWidth ?? 0,
    child: child?.offsetWidth ?? 0,
    parentCls: parent?.className ?? "",
    childCls: child?.className ?? "",
  };
});
ok(Math.round(widths.parent) === 240, `父卡宽 ${Math.round(widths.parent)}px（应为 240）`);
ok(Math.round(widths.child) === 200, `子卡宽 ${Math.round(widths.child)}px（应为 200）`);

// 折叠第 1 个父
await p.evaluate(() => document.querySelector('button[title="折叠子任务"]')?.click());
await p.waitForTimeout(900);
const afterFold = await nNodes();
ok(afterFold === 137 - 12, `折叠 1 个父(12 子)：节点 ${total} → ${afterFold}（应为 125）`);

const unfoldTxt = await p.locator("button", { hasText: "全部展开" }).count();
ok(unfoldTxt > 0, `工具栏出现「全部展开」按钮`);

const badgeTxt = await p.locator("text=/已折叠 \\d+ 步/").count();
ok(badgeTxt > 0, `统计区出现「已折叠 N 步」`);

// 折叠状态下播放进度不应被重置
const prog1 = await p.locator("text=/^\\d+\\/\\d+$/").first().textContent();
ok((prog1 ?? "").length > 0, `进度文本可读：${prog1}`);

// 展开回来
await p.evaluate(() => document.querySelector('button[title="展开子任务"]')?.click());
await p.waitForTimeout(900);
ok((await nNodes()) === 137, `单个展开：节点回到 ${await nNodes()}（应为 137）`);

// 全部折叠
await p.getByRole("button", { name: "全部折叠" }).click();
await p.waitForTimeout(1200);
const folded = await nNodes();
ok(folded === 17, `全部折叠：节点 = ${folded}（应为 17 = 主链步数）`);
ok((await nEdges()) <= 32, `折叠后边数 = ${await nEdges()}（只应剩时序边）`);

// 全部展开
await p.getByRole("button", { name: "全部展开" }).click();
await p.waitForTimeout(1200);
ok((await nNodes()) === 137, `全部展开：节点回到 ${await nNodes()}`);


// ── 布局与全屏（2026-10-27：底部被 footer 遮 + 全屏演示）──────────
const geo = () => p.evaluate(() => {
  const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width), l: Math.round(b.left), r: Math.round(b.right) }; };
  const flow = document.querySelector(".react-flow");
  const nodes = [...document.querySelectorAll(".react-flow__node")].map(el => el.getBoundingClientRect());
  const panels = [...document.querySelectorAll(".react-flow__panel")].map(el => ({ cls:(el.className||"").slice(0,80), ...box(el) }));
  return {
    main: box(document.querySelector("main")),
    flow: box(flow),
    nodeBounds: nodes.length ? { top: Math.round(Math.min(...nodes.map(n=>n.top))), bottom: Math.round(Math.max(...nodes.map(n=>n.bottom))),
                                 left: Math.round(Math.min(...nodes.map(n=>n.left))), right: Math.round(Math.max(...nodes.map(n=>n.right))) } : null,
    panels, progress: [...document.querySelectorAll("span")].map(s=>s.textContent).find(t=>/^\d+\/\d+$/.test(t||"")),
    root: box(document.querySelector(".z-modal")),
  };
});

const g1 = await geo();
ok(g1.flow.bottom <= g1.main.bottom, `普通态：容器底 ${g1.flow.bottom} ≤ main 底 ${g1.main.bottom}`);
const execCard = g1.panels.find(x => /bottom left/.test(x.cls));
ok(execCard && execCard.bottom <= g1.main.bottom, `普通态：「正在执行」浮层底 ${execCard?.bottom} ≤ main 底 ${g1.main.bottom}（不被 footer 切）`);

await p.locator('button[title="全屏演示（隐藏页面外壳）"]').click();
await p.waitForTimeout(2000);
const g2 = await geo();
ok(g2.root.h >= 958, `全屏容器铺满视口：${g2.root.w}×${g2.root.h}`);
ok(g2.nodeBounds && g2.nodeBounds.bottom <= g2.flow.bottom, `全屏：节点底 ${g2.nodeBounds?.bottom} ≤ 画布底 ${g2.flow.bottom}（重新 fitView）`);
ok(g2.nodeBounds && g2.nodeBounds.top >= g2.flow.top, `全屏：节点顶 ${g2.nodeBounds?.top} ≥ 画布顶 ${g2.flow.top}`);
ok(g2.panels.length <= 3, `全屏面板精简为 ${g2.panels.length} 个`);
const overlap = g2.panels.filter(pn => g2.nodeBounds &&
  pn.bottom > g2.nodeBounds.top && pn.top < g2.nodeBounds.bottom &&
  pn.right > g2.nodeBounds.left && pn.left < g2.nodeBounds.right);
ok(overlap.length <= 1, `全屏面板压节点 ${overlap.length} 个`);
ok(/^\d+\/\d+$/.test(g2.progress || ""), `进度文本 ${g2.progress}`);

await p.locator('button[title="退出全屏（ESC）"]').click();
await p.waitForTimeout(1400);
ok((await geo()).flow.bottom <= g1.main.bottom, `退出全屏归位`);

console.log(`\n${fails.length ? "SOME FAIL" : "ALL PASS"}`);
await b.close();
process.exit(fails.length ? 1 : 0);
