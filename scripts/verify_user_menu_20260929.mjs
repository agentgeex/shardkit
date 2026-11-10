/**
 * verify_user_menu_20260929.mjs — 顶栏「用户设置」子菜单验收
 *   对齐 vue-admin-tpl UserInfo：个人中心 / 文档 / 锁定屏幕 / 退出登录
 */
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:5178";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = [];
p.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
p.on("pageerror", (e) => errs.push(String(e)));
const results = [];
const ok = (n, c) => { results.push([n, c]); console.log(`[${c ? "PASS" : "FAIL"}] ${n}`); };

await p.goto(BASE + "/form", { waitUntil: "networkidle" });
await p.waitForTimeout(800);

// 1. 打开用户菜单
await p.getByTestId("header-user").click();
await p.waitForTimeout(300);
ok("用户菜单打开", await p.getByTestId("header-user-menu").isVisible());
ok("含 个人中心", (await p.getByTestId("user-profile").count()) === 1);
ok("含 文档", (await p.getByTestId("user-doc").count()) === 1);
ok("含 锁定屏幕", (await p.getByTestId("user-lock").count()) === 1);
ok("含 退出登录", (await p.getByTestId("user-logout").count()) === 1);

// 2. 个人中心 → 路由跳转
await p.getByTestId("user-profile").click();
await p.waitForTimeout(600);
ok("跳转 /personal/center", p.url().includes("/personal/center"));
ok("个人中心页渲染", await p.getByTestId("personal-center").isVisible());
ok("个人信息卡（头像）", await p.getByTestId("pc-avatar").isVisible());
// 切到修改密码 tab
await p.getByTestId("pc-tab-pwd").click();
await p.waitForTimeout(300);
await p.getByTestId("pc-pwd").fill("old");
await p.getByTestId("pc-npwd").fill("aaa");
await p.getByTestId("pc-npwd2").fill("bbb");
await p.getByTestId("pc-save-pwd").click();
await p.waitForTimeout(300);
ok("密码不一致报错", await p.getByTestId("pc-pwd-err").isVisible());
await p.getByTestId("pc-npwd2").fill("aaa");
await p.getByTestId("pc-save-pwd").click();
await p.waitForTimeout(400);
ok("密码一致成功 toast", (await p.getByTestId("toast").count()) > 0);

// 3. 锁定屏幕
await p.getByTestId("header-user").click();
await p.waitForTimeout(250);
await p.getByTestId("user-lock").click();
await p.waitForTimeout(400);
ok("锁屏对话框出现", await p.getByTestId("lock-dialog").isVisible());
await p.getByTestId("lock-pwd").fill("1234");
await p.getByTestId("lock-confirm").click();
await p.waitForTimeout(400);
ok("锁定层出现", await p.getByTestId("lock-page").isVisible());
// 错误密码
await p.getByTestId("unlock-pwd").fill("0000");
await p.getByTestId("unlock-btn").click();
await p.waitForTimeout(300);
ok("错误密码提示", await p.getByTestId("unlock-err").isVisible());
// 正确密码
await p.getByTestId("unlock-pwd").fill("1234");
await p.getByTestId("unlock-btn").click();
await p.waitForTimeout(400);
ok("解锁成功（锁定层消失）", (await p.getByTestId("lock-page").count()) === 0);

// 4. 退出登录
await p.getByTestId("header-user").click();
await p.waitForTimeout(250);
await p.getByTestId("user-logout").click();
await p.waitForTimeout(400);
ok("退出确认框出现", await p.getByTestId("logout-confirm").isVisible());
await p.getByTestId("logout-confirm-btn").click();
await p.waitForTimeout(600);
ok("跳转 /login", p.url().includes("/login"));

ok("0 console error", errs.length === 0);
if (errs.length) console.log("errors:", errs.slice(0, 5));

const all = results.every(([, c]) => c);
console.log(all ? "✅ ALL PASS" : "❌ SOME FAIL");
await b.close();
process.exit(all ? 0 : 1);
