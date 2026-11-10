/**
 * 校验：Markdown 编辑器（@uiw/react-md-editor）编辑区「光标 ↔ 可见文字」对齐
 *
 * 背景：编辑区 = 透明 textarea（真光标层）+ 背后语法高亮 pre 叠层。
 * 二者字体度量必须完全一致，否则光标随行漂移（现象：光标和编辑内容不匹配）。
 * 曾因 .w-md-editor-text-pre > code 默认 14px（textarea 13px）而错位。
 *
 * 断言：
 *  1. textarea 与 pre 的 font-size / line-height / font-family 完全一致
 *  2. pre 内层 code / .code-line 与 textarea 字体度量一致
 *  3. 多种字符（中/英/数字/标点）在两层宽度差为 0
 *  4. 0 console error
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5178";
const res = [];
const ok = (n, c, d) => { res.push(c); console.log(`[${c ? "PASS" : "FAIL"}] ${n}${d ? "  — " + d : ""}`); };

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PE:" + e.message));

await p.goto(`${BASE}/components`, { waitUntil: "networkidle" });
await p.waitForTimeout(1400);

const r = await p.evaluate(() => {
  const ta = document.querySelector(".win3-md .w-md-editor-text-input");
  const pre = document.querySelector(".win3-md .w-md-editor-text-pre");
  if (!ta || !pre) return { found: false };
  const code = pre.querySelector("code") || pre;
  const line = pre.querySelector(".code-line");
  const s = (e) => { const c = getComputedStyle(e); return { fs: c.fontSize, lh: c.lineHeight, ff: c.fontFamily, ls: c.letterSpacing }; };
  const taS = s(ta), preS = s(pre), codeS = s(code), lineS = line ? s(line) : codeS;
  const canvas = (ff, fs) => { const c = document.createElement("canvas").getContext("2d"); c.font = `${fs} ${ff}`; return c; };
  const samples = ["中", "a", "M", "1", "-", "："];
  const diffs = samples.map((ch) => {
    const w1 = canvas(taS.ff, taS.fs).measureText(ch).width;
    const w2 = canvas(codeS.ff, codeS.fs).measureText(ch).width;
    return Math.abs(w1 - w2);
  });
  return {
    found: true,
    ta: taS, pre: preS, code: codeS, line: lineS,
    sameFP: taS.fs === preS.fs && taS.lh === preS.lh && taS.ff === preS.ff,
    sameFC: taS.fs === codeS.fs && taS.lh === codeS.lh && taS.ff === codeS.ff,
    sameFL: taS.fs === lineS.fs && taS.lh === lineS.lh && taS.ff === lineS.ff,
    maxDiff: Math.max(...diffs),
    diffs: diffs.map((d) => Math.round(d * 1000) / 1000),
  };
});

ok("找到 textarea 与高亮 pre", r.found);
ok("textarea 与 pre 字体度量一致（fs/lh/ff）", r.sameFP, `ta=${r.ta?.fs}/${r.ta?.lh} pre=${r.pre?.fs}/${r.pre?.lh}`);
ok("textarea 与 pre>code 字体度量一致", r.sameFC, `code=${r.code?.fs}/${r.code?.lh}`);
ok("textarea 与 .code-line 字体度量一致", r.sameFL, `line=${r.line?.fs}/${r.line?.lh}`);
ok("多字符宽度差 = 0（无光标漂移）", r.maxDiff === 0, `maxDiff=${r.maxDiff} diffs=${JSON.stringify(r.diffs)}`);
ok("0 console error", errs.length === 0, errs.slice(0, 2).join(" | "));

await b.close();

const all = res.every(Boolean);
console.log(all ? "\n✅ ALL PASS" : "\n❌ SOME FAIL");
process.exit(all ? 0 : 1);
