/**
 * verify_password_input_20260929.mjs — 密码输入框（PasswordInput）验收
 */
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:5178";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push(String(e)));
const res = []; const ok = (n, c) => { res.push(c); console.log(`[${c ? "PASS" : "FAIL"}] ${n}`); };

await p.goto(BASE + "/components", { waitUntil: "networkidle" });
await p.waitForTimeout(800);

ok("密码输入框区块存在", (await p.getByTestId("password-input-field").count()) >= 3);
ok("基础密码框存在", await p.getByTestId("pwd-basic").isVisible());

// 默认 type=password
const f = p.getByTestId("password-input-field").first();
ok("默认 type=password", (await f.getAttribute("type")) === "password");

// 切换明文
await p.getByTestId("password-input-toggle").first().click();
await p.waitForTimeout(200);
ok("切换后 type=text", (await f.getAttribute("type")) === "text");
await p.getByTestId("password-input-toggle").first().click();
await p.waitForTimeout(200);
ok("再切回 type=password", (await f.getAttribute("type")) === "password");

// 强度条：输入弱密码
const sf = p.getByTestId("pwd-strength").getByTestId("password-input-field");
const sLabel = p.getByTestId("pwd-strength").getByTestId("password-strength-label");
await sf.fill("abc123");
await p.waitForTimeout(300);
let label = await sLabel.textContent();
let score = await sLabel.getAttribute("data-score");
console.log("  弱密码 abc123 →", label, "score=", score);
ok("弱密码得分为低档", Number(score) <= 1);

// 强密码
await sf.fill("Abc@12345xyz");
await p.waitForTimeout(300);
label = await sLabel.textContent();
score = await sLabel.getAttribute("data-score");
console.log("  强密码 Abc@12345xyz →", label, "score=", score);
ok("强密码得分为高档", Number(score) >= 3);

// 清空后无评分标签
await sf.fill("");
await p.waitForTimeout(300);
ok("清空后不显示强度标签", (await sLabel.count()) === 0);

ok("0 console error", errs.length === 0);
if (errs.length) console.log("errors:", errs.slice(0, 5));
const all = res.every(Boolean);
console.log(all ? "✅ ALL PASS" : "❌ SOME FAIL");
await b.close();
process.exit(all ? 0 : 1);
