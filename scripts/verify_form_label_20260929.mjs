/**
 * verify_form_label_20260929.mjs — 表单标签：右对齐（右边界成列）+ 必填 * 在左
 * ────────────────────────────────────────────────────────────────
 * 需求（维护者）：以 vue-admin-tpl「组件→表单→全部示例」为参考——
 *   标签在左、输入框在右；标签【右对齐】，所有标签右边界对齐同一竖线，
 *   从而所有输入框左边界对齐（不同字数标签也能齐）。必填 * 在标签文字左侧。
 *
 * 判定：
 *   1) 必填标签的 * 在 ::before（左侧），::after 无 *
 *   2) 同一表单列内，标签【右边界】唯一（成一条竖线）
 *   3) 同一列内输入控件左边界唯一
 */
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:5178";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 1400 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push(String(e)));
const res = []; const ok = (n, c, d) => { res.push(c); console.log(`[${c ? "PASS" : "FAIL"}] ${n}${d ? "  — " + d : ""}`); };

await p.goto(BASE + "/form", { waitUntil: "networkidle" });
await p.waitForTimeout(1000);

// ① 必填红星在 ::before（左侧）
const stars = await p.locator("label").evaluateAll((ls) => {
  const out = [];
  for (const l of ls) {
    const bf = getComputedStyle(l, "::before").content;
    const af = getComputedStyle(l, "::after").content;
    const hasB = bf && bf.includes("*"), hasA = af && af.includes("*");
    if (hasB || hasA) out.push({ t: l.textContent.trim().slice(0, 8), hasB, hasA });
  }
  return out;
});
ok("存在必填红星 *", stars.length > 0, `n=${stars.length}`);
ok("* 均在左侧（::before），无 ::after 红星", stars.every((s) => s.hasB && !s.hasA), JSON.stringify(stars.slice(0, 3)));

// ② 行式标签（FormRow）右边界成列：取第一列所有 row- 的 label 右边界
const rowRights = await p.locator('[data-testid^="row-"] > :first-child label').evaluateAll((ls) =>
  ls.map((l) => Math.round(l.getBoundingClientRect().right))
);
const uniqRow = [...new Set(rowRights)].sort((a, z) => a - z);
ok("行式标签右边界成一条竖线", uniqRow.length === 1 || (uniqRow.length <= 2 && uniqRow[uniqRow.length - 1] - uniqRow[0] <= 2), `right=${uniqRow.join(",")}`);

// ③ 栅格列内标签右边界成列（逐 grid 检查第一列）
const grids = ["grid-1", "grid-2", "grid-3"];
for (const g of grids) {
  const rights = await p.locator(`[data-testid="${g}"] [data-field-label]`).evaluateAll((ls) =>
    ls.map((l) => Math.round(l.getBoundingClientRect().right))
  );
  if (!rights.length) { ok(`[${g}] 有标签`, false, "0 label"); continue; }
  // 按列分组：相同右边界归一组，列数应 = 期望列数
  const cols = [...new Set(rights)].sort((a, z) => a - z);
  const expect = g === "grid-1" ? 1 : g === "grid-2" ? 2 : 3;
  ok(`[${g}] 标签右边界成 ${expect} 列竖线`, cols.length === expect, `cols=${cols.join(",")}`);
}

// ④ 输入控件左边界与该列标签右边界保持固定小间距（≈12px）
const gapInfo = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('[data-testid^="row-"], [data-testid^="field-"]')];
  const gaps = [];
  for (const r of rows) {
    const lab = r.querySelector(":scope > label, :scope > div:first-child > label");
    const ctrl = r.querySelector(":scope > div:nth-child(2)");
    if (!lab || !ctrl) continue;
    const lr = lab.getBoundingClientRect(), cr = ctrl.getBoundingClientRect();
    gaps.push(Math.round(cr.x - lr.right));
  }
  return gaps;
});
const uniqGap = [...new Set(gapInfo)];
ok("标签→输入间距一致（唯一值）", uniqGap.length === 1, `gap=${uniqGap.join(",")}px`);

ok("0 console error", errs.length === 0);
if (errs.length) console.log("errors:", errs.slice(0, 5));
const all = res.every(Boolean);
console.log(all ? "✅ ALL PASS" : "❌ SOME FAIL");
await b.close();
process.exit(all ? 0 : 1);
