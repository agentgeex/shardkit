/**
 * 校验：国际化（方案 A —— 框架层 zh-CN / en-US）
 *
 * 断言：
 *  1. 默认语言 = 简体中文（<html lang>=zh-CN，导航为中文）
 *  2. Header 语言下拉存在且只有 2 项（简体中文 / English，无繁体）
 *  3. 切到 English：导航分组标题、案例标题、索引页标题变英文
 *  4. <html lang> 同步为 en-US
 *  5. 持久化：刷新后仍为 English
 *  6. 切回简体中文：恢复中文
 *  7. 无 i18next 缺失 key 警告 / 0 console error（排除已知无关）
 */
import { chromium } from "playwright";

const BASE = "http://localhost:5178";
const res = [];
const ok = (n, c, d) => { res.push(c); console.log(`[${c ? "PASS" : "FAIL"}] ${n}${d ? "  — " + d : ""}`); };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push("PE:" + e.message));

await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
await p.waitForTimeout(1000);

const htmlLang = () => p.evaluate(() => document.documentElement.getAttribute("lang"));
const navText = async () =>
  (
    await p.evaluate(() => {
      // 取主导航分组（含 data-testid^=nav- 的链接所在的 nav）
      const nav = document.querySelector('aside nav');
      const groups = nav ? [...nav.querySelectorAll(':scope > div')] : [];
      // 只取含 nav-* 链接的分组文本
      const texts = groups
        .filter((g) => g.querySelector('[data-testid^="nav-"]'))
        .map((g) => (g.textContent || "").replace(/\s+/g, " ").trim());
      return texts.join(" | ");
    })
  ).trim();
const indexTitle = async () => (await p.locator("h1, h2").first().innerText()).trim();

// 1. 默认简中
const lang0 = await htmlLang();
const nav0 = await navText();
ok("默认 <html lang>=zh-CN", lang0 === "zh-CN", lang0);
ok("默认\u5bfc\u822a\u4e3a\u4e2d\u6587", /\u5f00\u59cb/.test(nav0) && /\u9875\u9762\u6848\u4f8b/.test(nav0) && /\u6848\u4f8b\u7d22\u5f15/.test(nav0), nav0.slice(0, 50));
ok("默认索引标题为中文", (await indexTitle()) === "案例索引", await indexTitle());

// 2. 语言下拉仅 2 项
await p.locator('[data-testid="header-locale"]').click();
await p.waitForTimeout(300);
const langs = await p.locator('[data-testid="header-locale-menu"] button').allInnerTexts();
ok("语言下拉仅 2 项（无繁体）", langs.length === 2 && !langs.join().includes("繁"), JSON.stringify(langs));

// 3. 切英文
await p.locator('[data-testid="locale-en-US"]').click();
await p.waitForTimeout(600);
const navEn = await navText();
const titleEn = await indexTitle();
ok("英文导航（Page cases / Case index）", /Page cases/.test(navEn) && /Case index/.test(navEn) && /Start/.test(navEn), navEn.slice(0, 80));
ok("英文索引标题", titleEn === "Case index", titleEn);
ok("案例卡标题转英文（Dashboard）", (await p.locator('[data-testid="case-dashboard"]').innerText()).includes("Dashboard"));
ok("案例卡描述转英文", /Metric cards/.test(await p.locator('[data-testid="case-dashboard"]').innerText()));

// 4. html lang
ok("切换后 <html lang>=en-US", (await htmlLang()) === "en-US", await htmlLang());

// 5. 持久化
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(900);
ok("刷新后仍为英文（持久化）", (await indexTitle()) === "Case index", await indexTitle());
ok("刷新后 html lang 仍 en-US", (await htmlLang()) === "en-US", await htmlLang());

// 6. 切回简中
await p.locator('[data-testid="header-locale"]').click();
await p.waitForTimeout(300);
await p.locator('[data-testid="locale-zh-CN"]').click();
await p.waitForTimeout(600);
ok("切回简体中文恢复", (await indexTitle()) === "案例索引" && (await htmlLang()) === "zh-CN", await indexTitle());

// 6.5 标签栏标题随语言切换（默认首页标签 /blank → Blank page）
await p.locator('[data-testid="header-locale"]').click();
await p.waitForSelector('[data-testid="locale-en-US"]', { state: "visible", timeout: 8000 });
await p.locator('[data-testid="locale-en-US"]').click();
await p.waitForTimeout(700);
const tabArea = (await p.locator("body").innerText()).slice(0, 500);
ok("标签栏标题转英文（Blank page）", /Blank page/.test(tabArea), tabArea.replace(/\s+/g, " ").slice(0, 80));
await p.locator('[data-testid="header-locale"]').click();
await p.waitForSelector('[data-testid="locale-zh-CN"]', { state: "visible", timeout: 8000 });
await p.locator('[data-testid="locale-zh-CN"]').click();
await p.waitForTimeout(700);
ok("标签栏恢复中文（空白页）", /空白页/.test((await p.locator("body").innerText()).slice(0, 500)));

// 7. 缺失 key / 错误
const missWarn = errs.filter((e) => /i18next|missingKey|key .* returned an empty/i.test(e));
ok("无 i18next 缺失 key 警告", missWarn.length === 0, missWarn.slice(0, 2).join(" | "));
ok("0 console error", errs.length === 0, errs.slice(0, 2).join(" | "));

await b.close();
const all = res.every(Boolean);
console.log(all ? "\n✅ ALL PASS" : "\n❌ SOME FAIL");
process.exit(all ? 0 : 1);
