/**
 * 校验：Markdown 编辑器（@uiw/react-md-editor）全屏遮蔽
 *
 * 问题：点全屏后覆盖层 fixed inset-0 z-99999，但背景透明（受 .win3-md .w-md-editor
 *       { @apply bg-transparent } 影响）→ 背后控件（侧边栏/顶栏/内容）可见。
 * 修复：给 .w-md-editor-fullscreen 及其内容区强制不透明主题背景。
 *
 * 断言：
 *  1. 存在全屏按钮且可点击
 *  2. 全屏态元素 position=fixed、尺寸=视口、z-index 很高
 *  3. 全屏态背景色不透明（alpha=1）
 *  4. 视口 5 个采样点 elementFromPoint 均命中 md 编辑器（无其他控件透出）
 *  5. 0 console error
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5178";
const res = [];
const ok = (n, c, d) => { res.push(c); console.log(`[${c ? "PASS" : "FAIL"}] ${n}${d ? "  — " + d : ""}`); };

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PE:" + e.message));

await p.goto(`${BASE}/components`, { waitUntil: "networkidle" });
await p.waitForTimeout(1400);

const sel = '.win3-md .w-md-editor-toolbar button[data-name="fullscreen"], .win3-md .w-md-editor-toolbar li[data-name="fullscreen"]';
const btn = p.locator(sel).first();
ok("存在 Markdown 全屏按钮", (await btn.count()) > 0);

await btn.click();
await p.waitForTimeout(700);

const r = await p.evaluate(() => {
  const fs = document.querySelector(".w-md-editor-fullscreen");
  if (!fs) return { found: false };
  const s = getComputedStyle(fs);
  const rect = fs.getBoundingClientRect();
  const alpha = (() => {
    const m = s.backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const parts = m[1].split(",").map((x) => parseFloat(x));
    return parts.length === 4 ? parts[3] : 1;
  })();
  const pts = [[20, 20], [720, 450], [1420, 20], [1420, 880], [20, 880]];
  const hits = pts.map(([x, y]) => {
    const e = document.elementFromPoint(x, y);
    return !!e && !!e.closest(".w-md-editor");
  });
  return {
    found: true, pos: s.position, z: parseInt(s.zIndex) || 0,
    vw: window.innerWidth, vh: window.innerHeight,
    w: Math.round(rect.width), h: Math.round(rect.height),
    bg: s.backgroundColor, alpha, hits,
  };
});

ok("全屏态存在且 position=fixed", r.found && r.pos === "fixed", `pos=${r.pos}`);
ok("全屏态覆盖整个视口", r.w === r.vw && r.h === r.vh, `${r.w}x${r.h} vs ${r.vw}x${r.vh}`);
ok("全屏态 z-index 足够高（≥1000）", r.z >= 1000, `z=${r.z}`);
ok("全屏态背景不透明（alpha=1）", r.alpha === 1, `bg=${r.bg}`);
ok("视口采样点均被 md 编辑器遮蔽", Array.isArray(r.hits) && r.hits.every(Boolean), `hits=${JSON.stringify(r.hits)}`);
ok("0 console error", errs.length === 0, errs.slice(0, 2).join(" | "));

await p.screenshot({ path: "logs/md_fullscreen.png" });
await b.close();

const all = res.every(Boolean);
console.log(all ? "\n✅ ALL PASS" : "\n❌ SOME FAIL");
process.exit(all ? 0 : 1);
