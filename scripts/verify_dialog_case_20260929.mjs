/**
 * verify_dialog_case_20260929.mjs
 * 验收「组件展厅」新增「弹窗（Dialog）」区块：
 *   ① 基础弹窗（内容 + footer，内容区可滚动）
 *   ② 与表单结合
 *   ③ 可拖拽 / 可缩放 / 可全屏
 * 用法：node scripts/verify_dialog_case_20260929.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:5178";
const OUT = "logs";
mkdirSync(OUT, { recursive: true });

const results = [];
let failed = 0;
function check(name, ok, extra = "") {
  results.push({ name, ok, extra });
  if (!ok) failed++;
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name}${extra ? "  — " + extra : ""}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
page.on("pageerror", (e) => pageErrors.push(String(e)));

await page.goto(`${BASE}/components`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// ── 区块入口 ──
check("弹窗区块入口按钮存在", (await page.getByTestId("dlg-open-basic").count()) === 1
  && (await page.getByTestId("dlg-open-form").count()) === 1
  && (await page.getByTestId("dlg-open-resize").count()) === 1);

// ── ① 基础弹窗 ──
await page.getByTestId("dlg-open-basic").click();
await page.waitForTimeout(400);
const basic = page.getByTestId("dlg-basic");
check("基础弹窗打开", (await basic.count()) === 1 && (await basic.isVisible()));
check("基础弹窗有头部/内容/底部", (await page.getByTestId("dlg-basic-body").count()) === 1
  && (await basic.locator("footer, [class*='border-t']").count()) >= 1);
check("基础弹窗含全屏按钮", (await page.getByTestId("dlg-basic-fullscreen").count()) === 1);
check("基础弹窗含缩放手柄", (await page.getByTestId("dlg-basic-resize").count()) === 1);

// 拖拽移动
const beforeDrag = await basic.boundingBox();
await page.getByTestId("dlg-basic").locator("xpath=.//*[contains(@class,'cursor-move')]").first().hover();
await page.mouse.down();
await page.mouse.move(300, 260, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(300);
const afterDrag = await basic.boundingBox();
check("弹窗可拖拽移动", beforeDrag && afterDrag && (Math.abs(afterDrag.x - beforeDrag.x) > 20 || Math.abs(afterDrag.y - beforeDrag.y) > 20),
  afterDrag ? `Δx=${Math.round(afterDrag.x - beforeDrag.x)} Δy=${Math.round(afterDrag.y - beforeDrag.y)}` : "");

// 关闭
await page.getByTestId("dlg-basic-close").click();
await page.waitForTimeout(400);
check("基础弹窗可关闭", (await page.getByTestId("dlg-basic").count()) === 0);

// ── ② 表单弹窗 ──
await page.getByTestId("dlg-open-form").click();
await page.waitForTimeout(400);
const form = page.getByTestId("dlg-form");
check("表单弹窗打开", (await form.count()) === 1 && (await form.isVisible()));
check("表单弹窗含输入控件", (await form.locator("input").count()) >= 2 && (await form.locator("[role='combobox'], button[role='combobox']").count()) >= 1);
check("表单弹窗含提交按钮", (await page.getByTestId("dlg-form-submit").count()) === 1);
await page.getByTestId("dlg-form-close").click();
await page.waitForTimeout(400);
check("表单弹窗可关闭", (await page.getByTestId("dlg-form").count()) === 0);

// ── ③ 可缩放 + 全屏 ──
await page.getByTestId("dlg-open-resize").click();
await page.waitForTimeout(400);
const rz = page.getByTestId("dlg-resize");
check("可缩放弹窗打开", (await rz.count()) === 1 && (await rz.isVisible()));
const sz0 = await rz.boundingBox();
const handle = await page.getByTestId("dlg-resize-resize").boundingBox();
if (handle) {
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 120, handle.y + handle.height / 2 + 90, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}
const sz1 = await rz.boundingBox();
check("弹窗可缩放", sz0 && sz1 && sz1.width > sz0.width + 40 && sz1.height > sz0.height + 40,
  sz1 ? `W=${Math.round(sz0.width)}→${Math.round(sz1.width)} H=${Math.round(sz0.height)}→${Math.round(sz1.height)}` : "");

// 全屏切换
await page.getByTestId("dlg-resize-fullscreen").click();
await page.waitForTimeout(400);
const szFull = await rz.boundingBox();
check("弹窗可全屏", szFull && szFull.width > 1200, szFull ? `W=${Math.round(szFull.width)}` : "");
await page.getByTestId("dlg-resize-fullscreen").click();
await page.waitForTimeout(300);
const szBack = await rz.boundingBox();
check("弹窗可退出全屏", szBack && szBack.width < 900, szBack ? `W=${Math.round(szBack.width)}` : "");
await page.getByTestId("dlg-resize-close").click();
await page.waitForTimeout(300);

// ── 无错误 ──
check("无 console error", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
check("无 page error", pageErrors.length === 0, pageErrors.slice(0, 3).join(" | "));

console.log(`\n${failed === 0 ? "✅ ALL PASS" : "❌ FAIL: " + failed}`);
console.log(`console errors: ${consoleErrors.length}, page errors: ${pageErrors.length}`);
await browser.close();
process.exit(failed === 0 ? 0 : 1);
