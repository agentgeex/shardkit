#!/usr/bin/env node
/**
 * visual-baseline.mjs —— 视觉/交互基线（Playwright）
 *
 * 用途：给关键路由拍快照，形成可前后对比的视觉回归基线。
 *   capture : 拍快照 → shots/<name>.png + shots/_report.json(含 sha256 与控制台错误)
 *   compare : 与已有基线比对，报告 新增/变化/消失，并汇总控制台错误
 *
 * 用法（需先起 dev server）：
 *   node scripts/visual-baseline.mjs capture
 *   node scripts/visual-baseline.mjs compare
 *   BASE_URL=http://localhost:5178 node scripts/visual-baseline.mjs capture
 *
 * 退出码：capture 有控制台错误 → 1；compare 有变化或错误 → 1。
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = path.resolve(import.meta.dirname, "..");
const SHOTS = path.join(ROOT, "shots");
const REPORT = path.join(SHOTS, "_report.json");
const BASE_URL = process.env.BASE_URL || "http://localhost:5178";

// 关键路由（按需增删）
const ROUTES = [
  { name: "home", url: "/" },
  // mask：小地图与 attribution 会随着视口 transform 亚像素抖动重绘，哈希必然不稳。
  // 它们本身零信息量（导航辅助），屏蔽掉不影响「页面主体是否被改动」的判定。
  {
    name: "plan-flow",
    url: "/plan-flow",
    mask: [".react-flow__minimap", ".react-flow__attribution"],
  },
];

const mode = process.argv[2] || "capture";
if (!["capture", "compare"].includes(mode)) {
  console.error("用法: node scripts/visual-baseline.mjs [capture|compare]");
  process.exit(2);
}

fs.mkdirSync(SHOTS, { recursive: true });
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const results = {};
const buffers = {};   // compare 用：保存本次截图字节，供像素级噪声判定
let consoleErrors = 0;

/**
 * 亚像素噪声判定（PIL）
 * ─────────────────────
 * 为什么不用字节哈希一锤定音：CSS 渐变/圆角/阴影在亚像素位置上的抗锯齿，
 * 会因布局宽度的微小抖动（滚动条出现与否、字体度量、视口 transform）产生
 * 十几个像素的无意义差异。本项目实测：用户头像的 28px 圆 + 渐变，
 * 两次截图差 21 个像素、最大通道差 28 —— 肉眼为零，哈希却完全不同。
 *
 * 判定为「噪声」的条件（三者同时满足）：
 *   差异像素 <= 200        （占比通常 < 0.02%）
 *   最大通道差 <= 40       （低于人眼可辨阈值，且远小于任何真实改版）
 *   差异像素占比 <= 0.1%
 *
 * 任一不满足 → 判为真变化。python3 不可用 → 退回严格哈希（宁严不松）。
 */
const PY_DIFF = String.raw`
import sys, json
try:
    from PIL import Image, ImageChops
    import numpy as np
except Exception as e:
    print(json.dumps({"error": str(e)})); sys.exit(0)
a = Image.open(sys.argv[1]).convert("RGB")
b = Image.open(sys.argv[2]).convert("RGB")
if a.size != b.size:
    print(json.dumps({"sizeDiff": [a.size, b.size]})); sys.exit(0)
d = np.asarray(ImageChops.difference(a, b)).astype(int).max(axis=2)
px = int((d > 0).sum())
total = int(d.shape[0] * d.shape[1])
print(json.dumps({"px": px, "maxd": int(d.max()), "total": total}))
`;

function isNoiseOnly(basePath, buf) {
  if (!fs.existsSync(basePath)) return null;
  const tmp = path.join(os.tmpdir(), `vb-${process.pid}-${Date.now()}.png`);
  fs.writeFileSync(tmp, buf);
  try {
    const out = execFileSync("python3", ["-c", PY_DIFF, basePath, tmp], { encoding: "utf8" });
    const r = JSON.parse(out);
    if (r.error) return null;            // PIL 缺失 → 严格
    if (r.sizeDiff) return { noise: false, sizeDiff: r.sizeDiff };
    const ratio = r.total ? r.px / r.total : 1;
    const noise = r.px <= 200 && r.maxd <= 40 && ratio <= 0.001;
    return { noise, ...r, ratio };
  } catch {
    return null;                          // 无法判定 → 严格
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

for (const route of ROUTES) {
  const { name, url } = route;
  const errors = [];
  const onMsg = (m) => m.type() === "error" && errors.push(m.text());
  const onErr = (e) => errors.push(String(e));
  page.on("console", onMsg);
  page.on("pageerror", onErr);
  try {
    await page.goto(BASE_URL + url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1200);
    // animations:"disabled" —— 关掉 CSS 动画/过渡再截图。
    // 否则含 animate-pulse（如 /plan-flow 的当前节点、运行中状态点）的页面
    // 每次截图都落在动画的不同相位，哈希必然不同，基线永远红。
    const buf = await page.screenshot({
      fullPage: true,
      animations: "disabled",
      mask: (route.mask || []).map((sel) => page.locator(sel)),
    });
    const hash = sha(buf);
    buffers[name] = buf;
    results[name] = { url, hash, errors };
    consoleErrors += errors.length;
    if (mode === "capture") {
      fs.writeFileSync(path.join(SHOTS, `${name}.png`), buf);
      console.log(`📸 ${name.padEnd(12)} ${url.padEnd(16)} ${hash}  errors=${errors.length}`);
    }
  } catch (e) {
    results[name] = { url, hash: null, errors: [String(e)] };
    consoleErrors += 1;
    console.log(`💥 ${name.padEnd(12)} ${url} 失败: ${e}`);
  } finally {
    page.off("console", onMsg);
    page.off("pageerror", onErr);
  }
}

await browser.close();

if (mode === "capture") {
  fs.writeFileSync(REPORT, JSON.stringify({ ts: new Date().toISOString(), baseUrl: BASE_URL, results }, null, 2) + "\n");
  console.log(`\n报告 → ${path.relative(ROOT, REPORT)}`);
  if (consoleErrors) {
    console.log(`\n❌ 存在 ${consoleErrors} 条控制台错误。`);
    process.exit(1);
  }
  console.log("\n✅ 基线已采集，零控制台错误。");
  process.exit(0);
}

// compare
if (!fs.existsSync(REPORT)) {
  console.error("无基线报告，请先跑 capture。");
  process.exit(2);
}
const base = JSON.parse(fs.readFileSync(REPORT, "utf8"));
let changed = 0;
console.log(`基线: ${base.ts}\n`);
for (const { name } of ROUTES) {
  const b = base.results[name];
  const c = results[name];
  if (!b) { console.log(`➕ ${name}: 新增`); changed++; continue; }
  if (b.hash === c.hash) {
    console.log(`✅ ${name}: 一致`);
  } else {
    const n = buffers[name] ? isNoiseOnly(path.join(SHOTS, `${name}.png`), buffers[name]) : null;
    if (n && n.noise) {
      console.log(`✅ ${name}: 一致（亚像素噪声 ${n.px}px / 最大通道差 ${n.maxd}，已忽略）`);
    } else {
      const why = n && n.px !== undefined ? ` 差异 ${n.px}px / 最大 ${n.maxd}` : "";
      console.log(`⚠️  ${name}: 视觉变化 (${b.hash} → ${c.hash})${why}`);
      changed++;
    }
  }
  if (c.errors.length) console.log(`    控制台错误 ${c.errors.length}: ${c.errors.slice(0, 3).join(" | ")}`);
}
console.log("");
if (changed || consoleErrors) {
  console.log(`❌ 有 ${changed} 处变化 / ${consoleErrors} 条控制台错误。`);
  process.exit(1);
}
console.log("✅ 与基线一致。");
