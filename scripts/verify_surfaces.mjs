/**
 * 台面层次校验（布局四区对比）
 * ─────────────────────────────────────────────────────────────
 * 背景：2026-10-20 维护者反馈「A/B/C/D 四区全是同一个底色，没有对比」。
 *       根因是 --card 与 --background 同值（都是 #FFF），外壳又用半透明白叠加。
 *       修复后本脚本防止「再次退回同色」——它是这一层的回归闸。
 *
 * 校验（两条主题各一遍）：
 *   1. 侧栏(A+C) 与主区(D) 对比度 ≥ 5.0        ← 深色侧栏是层次主锚
 *   2. 卡片与主区(D) 对比度 ≥ 1.05             ← 卡片要从画布浮起
 *   3. 顶栏/标签栏 与主区(D) 不同色             ← 不能又变回一片白
 *   4. 菜单文字 与侧栏底 对比度 ≥ 4.5           ← 可读
 *   5. --border-strong 已定义                  ← 区域分界线必须存在
 *
 * 用法：node scripts/verify_surfaces.mjs
 * 退出码：0 全过 / 1 有失败
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:5178";

const lum = (rgb) => {
  const [r, g, b] = rgb
    .match(/\d+(\.\d+)?/g)
    .slice(0, 3)
    .map(Number)
    .map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const l1 = lum(a);
  const l2 = lum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};

let fails = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? "[PASS]" : "[FAIL]"} ${name}${detail ? " · " + detail : ""}`);
  if (!ok) fails++;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const sample = async (dark) => {
  await page.goto(`${BASE}/table`, { waitUntil: "networkidle" });
  await page.evaluate((d) => document.documentElement.classList.toggle("dark", d), dark);
  await page.waitForTimeout(400);
  return page.evaluate(() => {
    const bg = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).backgroundColor : null;
    };
    const colorOf = (sel) => {
      const el = document.querySelector(sel);
      return el ? getComputedStyle(el).color : null;
    };
    const root = getComputedStyle(document.documentElement);
    return {
      aside: bg("aside"),
      header: bg("header"),
      tabbar: bg('[data-testid="tabbar"]'),
      main: bg("main"),
      card: bg("main .rounded-xl"),
      navText: colorOf('aside nav a[data-testid^="menu-leaf-"]'),
      // 选中态：实心强调块 vs 侧栏底、白字 vs 强调块（“选中明显”两个都要够）
      activeBg: bg('aside nav a[class*="chrome-active"]'),
      activeFg: colorOf('aside nav a[class*="chrome-active"]'),
      borderStrong: root.getPropertyValue("--border-strong").trim(),
    };
  });
};

for (const dark of [false, true]) {
  const mode = dark ? "dark " : "light";
  const s = await sample(dark);

  // 亮色：深色侧栏是层次主锚，要求强对比；
  // 暗色：灰阶被压缩（黑上只能靠明度微差 + 分界线），阈值降到 1.10，靠 border-strong 补
  const sideMin = dark ? 1.1 : 5.0;
  const cSide = contrast(s.aside, s.main);
  check(
    `[${mode}] 侧栏 vs 主区 ≥ ${sideMin.toFixed(2)}`,
    cSide >= sideMin,
    `${cSide.toFixed(2)}:1  aside=${s.aside} main=${s.main}`
  );

  const cCard = contrast(s.card, s.main);
  check(`[${mode}] 卡片 vs 主区 ≥ 1.05`, cCard >= 1.05, `${cCard.toFixed(2)}:1  card=${s.card}`);

  check(
    `[${mode}] 顶栏/标签栏 与 主区 不同色`,
    s.header !== s.main && s.tabbar !== s.main,
    `header=${s.header} tabbar=${s.tabbar}`
  );

  if (s.navText) {
    const cNav = contrast(s.navText, s.aside);
    check(`[${mode}] 菜单文字 vs 侧栏 ≥ 4.5`, cNav >= 4.5, `${cNav.toFixed(2)}:1`);
  } else {
    check(`[${mode}] 菜单文字采样`, false, "未找到菜单项");
  }

  check(`[${mode}] --border-strong 已定义`, !!s.borderStrong, `"${s.borderStrong}"`);

  // 选中态必须“跳出来”：色块 vs 侧栏底 ≥ 2.5，白字 vs 色块 ≥ 4.0
  if (s.activeBg) {
    const cActive = contrast(s.activeBg, s.aside);
    check(
      `[${mode}] 选中色块 vs 侧栏 ≥ 2.5`,
      cActive >= 2.5,
      `${cActive.toFixed(2)}:1  active=${s.activeBg}`
    );
    const cActiveText = contrast(s.activeFg, s.activeBg);
    check(
      `[${mode}] 选中文字 vs 色块 ≥ 4.0`,
      cActiveText >= 4.0,
      `${cActiveText.toFixed(2)}:1`
    );
  } else {
    check(`[${mode}] 选中态采样`, false, "未找到选中菜单项");
  }
}

await browser.close();
console.log(fails === 0 ? "\nALL PASS" : `\nSOME FAIL (${fails})`);
process.exit(fails === 0 ? 0 : 1);
