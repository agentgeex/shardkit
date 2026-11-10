import { chromium } from "playwright";
const BASE = "http://localhost:5178";
const routes = ["/","/blank","/dashboard","/list","/list-page","/list-page/new","/list-page/P-1001","/list-page/P-1001/edit","/form","/detail","/auth","/error","/components","/blocks","/menu","/menu/reports/daily","/menu/help"];
const b = await chromium.launch();
const c = await b.newContext({ viewport:{width:1440,height:900} });
await c.route(u => u.hostname === "telemetry.refine.dev", r => r.fulfill({ status:200, body:"" }));
const p = await c.newPage();
const errs = [], pe = [];
p.on("console", m => { if (m.type()==="error") errs.push(m.text()); });
p.on("pageerror", e => pe.push(String(e)));
let bad = [];
for (const r of routes) {
  await p.goto(BASE + r, { waitUntil: "networkidle" });
  await p.waitForTimeout(250);
  const body = await p.locator("body").innerText();
  const ok = body.trim().length > 0 && !body.includes("Cannot") ;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r}  (chars=${body.trim().length})`);
  if (!ok) bad.push(r);
}
console.log(`\nconsole errors: ${errs.length}  pageerrors: ${pe.length}`);
if (errs.length) console.log(errs.slice(0,5));
if (pe.length) console.log(pe.slice(0,5));
console.log(`\n结果: ${bad.length===0 && errs.length===0 && pe.length===0 ? "✅ ALL PASS" : "❌ FAIL "+bad.join(",")}`);
await b.close();
process.exit(bad.length===0 && errs.length===0 && pe.length===0 ? 0 : 1);
