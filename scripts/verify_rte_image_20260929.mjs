/**
 * 校验：富文本编辑器（Tiptap）图片上传能力
 * 对齐 vue-admin-tpl「组件 → 表单 → 全部示例」的富文本图片上传（wangEditor uploadImgShowBase64）。
 *
 * 断言：
 *  1. 富文本工具栏存在「插入图片」按钮（data-testid=rte-image-btn）
 *  2. 存在隐藏 file input（data-testid=rte-image-input, accept=image/*）
 *  3. 选择图片后，编辑器内插入 <img>，src 为 base64 data:image/... （纯前端内联）
 *  4. 0 console error
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://localhost:5178";
const res = [];
const ok = (n, c, d) => {
  res.push(c);
  console.log(`[${c ? "PASS" : "FAIL"}] ${n}${d ? "  — " + d : ""}`);
};
const TMP = "/tmp/rte_verify";
fs.mkdirSync(TMP, { recursive: true });
const png = `${TMP}/px.png`;
fs.writeFileSync(png, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 1600 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PE:" + e.message));

await p.goto(`${BASE}/components`, { waitUntil: "networkidle" });
await p.waitForTimeout(1500);

// 1. 图片按钮
const btn = p.locator('[data-testid="rte-image-btn"]').first();
const btnCount = await btn.count();
ok("富文本工具栏含「插入图片」按钮", btnCount > 0, `count=${btnCount}`);

// 2. 隐藏 file input
const accept = await p.locator('[data-testid="rte-image-input"]').first().getAttribute("accept").catch(() => null);
ok("含隐藏图片 file input（accept=image/*）", accept === "image/*", `accept=${accept}`);

// 3. 选图 → 插入 base64 img
await p.locator('[data-testid="rte-image-input"]').first().setInputFiles(png);
await p.waitForTimeout(800);
const r = await p.evaluate(() => {
  const ed = document.querySelector(".prose-win3");
  const imgs = ed ? [...ed.querySelectorAll("img")] : [];
  return { n: imgs.length, src: imgs[0]?.getAttribute("src")?.slice(0, 30) ?? null };
});
ok("选图后编辑器插入 <img>", r.n >= 1, `imgs=${r.n}`);
ok("图片为 base64 内联（data:image/...）", (r.src || "").startsWith("data:image/"), `src=${r.src}`);

// 4. console error
ok("0 console error", errs.length === 0, errs.slice(0, 2).join(" | "));

await p.screenshot({ path: "logs/rte_image.png", fullPage: false });
await b.close();

const all = res.every(Boolean);
console.log(all ? "\n✅ ALL PASS" : "\n❌ SOME FAIL");
process.exit(all ? 0 : 1);
