/**
 * verify_form_layout_all_20260930.mjs — 全站表单排布规范（左右排列 + 表单页样式）
 * ────────────────────────────────────────────────────────────────
 * 规范（2026-09-29 维护者定）：
 *   ① 所有表单标签与输入框【左右排列】（label 左、控件 右），无上下堆叠
 *   ② 标签【右对齐】，同列右边界成一条竖线
 *   ③ 标签列宽 8em（≈128px）；标签↔控件间距 gap-3（12px）
 *
 * 覆盖页面：/form /search /search/orders /personal/center /list-page/new
 */
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:5178";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 1600 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push(String(e)));
const res = []; const ok = (n, c, d) => { res.push(c); console.log(`[${c ? "PASS" : "FAIL"}] ${n}${d ? "  — " + d : ""}`); };

const pages = [
  ["/form", "表单页", { minFields: 20 }],
  ["/search", "查询页", { minFields: 2 }],
  ["/search/orders", "订单查询", { minFields: 4 }],
  ["/personal/center", "个人中心", { minFields: 3 }],
  ["/list-page/new", "分页CRUD-新建", { minFields: 5 }],
];

for (const [u, name, opt] of pages) {
  const before = errs.length;
  await p.goto(BASE + u, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  const info = await p.evaluate(() => {
    // 用 grid 布局的字段：label 与控件在同一 grid row，标签列在左
    const outer = [...document.querySelectorAll("div")].filter((d) => {
      const s = getComputedStyle(d);
      return s.display === "grid" && /(^|\s)\d+(\.\d+)?(px|em|rem)?\s/.test(s.gridTemplateColumns) === false &&
        s.gridTemplateColumns.split(" ").length === 2;
    });
    // 更稳的做法：找 label 的父级 grid，判定 label 在 col1、控件在 col2
    const labels = [...document.querySelectorAll("label")].filter((l) => l.offsetParent !== null && l.textContent.trim());
    let horiz = 0, vert = 0; const rights = [];
    for (const l of labels) {
      const g = l.closest('[class*="grid-cols-"]');
      if (!g) continue;
      const s = getComputedStyle(g);
      const cols = s.gridTemplateColumns.split(" ").filter(Boolean);
      if (cols.length !== 2) continue;
      const lr = l.getBoundingClientRect();
      const ctrl = g.querySelector("input,select,textarea,[role=combobox],button");
      if (!ctrl) continue;
      const cr = ctrl.getBoundingClientRect();
      if (cr.x >= lr.right - 2 && Math.abs(cr.y + cr.height / 2 - (lr.y + lr.height / 2)) < 30) {
        horiz++; rights.push(Math.round(lr.right));
      } else if (cr.y >= lr.bottom - 2) vert++;
    }
    const uniq = [...new Set(rights)].sort((a, z) => a - z);
    return { horiz, vert, rights: uniq };
  });
  ok(`[${name}] 表单标签与控件【左右排列】`, info.horiz >= opt.minFields, `左右=${info.horiz} 上下=${info.vert} (需≥${opt.minFields})`);
  ok(`[${name}] 无上下堆叠字段`, info.vert === 0, `上下=${info.vert}`);
  // 右对齐：主要字段列右边界应集中在少数几个值（列数）
  ok(`[${name}] 标签右对齐成列`, info.rights.length >= 1 && info.rights.length <= 8, `右边界=${info.rights.join(",")}`);
  ok(`[${name}] 0 console error`, errs.length === before);
}

const all = res.every(Boolean);
console.log(all ? "✅ ALL PASS" : "❌ SOME FAIL");
if (errs.length) console.log("errors:", errs.slice(0, 5));
await b.close();
process.exit(all ? 0 : 1);
