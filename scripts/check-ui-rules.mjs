#!/usr/bin/env node
/**
 * check-ui-rules.mjs —— 框架 UI 质量闸（静态规则 / 预算制）
 *
 * 理念：存量存量不挡路，只拦「新增」。基线写在 ui-quality-budget.json；
 *      实际计数 > 预算 → 失败(exit 1)；≤ 预算 → 通过。
 *      每修一批，把预算数字下调，形成只降不升的棘轮。
 *
 * 规则来源：baseline-ui 硬约束 + shadcn 官方风格规则（见 agent_doc/UI质量线-使用说明.md）
 *
 * 用法：
 *   node scripts/check-ui-rules.mjs            # 检查
 *   node scripts/check-ui-rules.mjs --update    # 用当前实际值刷新预算(仅在你"降低"了存量时用)
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src");
const BUDGET_FILE = path.join(ROOT, "ui-quality-budget.json");

// ── 规则定义 ──────────────────────────────────────────────
const RULES = [
  {
    key: "rawPalette",
    label: "原生色板(禁: bg/text/border/ring-emerald-500 …→ 改用语义 token)",
    re: /\b(bg|text|border|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/g,
    gate: true,
  },
  {
    key: "zArbitrary",
    label: "任意 z 值(禁: z-[999] → 用 z-modal / z-popover 等标尺)",
    re: /z-\[[^\]]+\]/g,
    gate: true,
  },
  {
    key: "hScreen",
    label: "h-screen(禁: 移动端顶飞 → 用 h-dvh)",
    re: /(?<!min-)h-screen\b/g,
    gate: true,
  },
  {
    key: "spaceXY",
    label: "space-x/y(禁新增: flex 换行会失效 → 用 gap-*)",
    re: /\bspace-[xy]-/g,
    gate: true,
  },
];

// ── 采集 ────────────────────────────────────────────────
function walk(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const s = fs.statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const counts = {};
for (const r of RULES) counts[r.key] = 0;
for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  for (const r of RULES) {
    // 每次都要重置 lastIndex（正则带 g）
    r.re.lastIndex = 0;
    counts[r.key] += (text.match(r.re) || []).length;
  }
}

// ── 预算 ────────────────────────────────────────────────
const update = process.argv.includes("--update");
let budget;
if (fs.existsSync(BUDGET_FILE)) {
  budget = JSON.parse(fs.readFileSync(BUDGET_FILE, "utf8"));
} else {
  budget = { note: "UI 质量闸预算：只降不升。修一批 → 下调对应数字。", budgets: {} };
}
if (!budget.budgets) budget.budgets = {};

if (update || Object.keys(budget.budgets).length === 0) {
  for (const r of RULES) budget.budgets[r.key] = counts[r.key];
  fs.writeFileSync(BUDGET_FILE, JSON.stringify(budget, null, 2) + "\n");
  console.log(`\n📝 已${update ? "刷新" : "初始化"}预算 → ${path.relative(ROOT, BUDGET_FILE)}`);
}

// ── 判定 ────────────────────────────────────────────────
console.log(`\n检查 ${files.length} 个文件…\n`);
let failed = false;
const pad = (s, n) => String(s).padEnd(n, " ");
console.log(pad("规则", 12) + pad("实际", 6) + pad("预算", 6) + "结果");
console.log("-".repeat(70));
for (const r of RULES) {
  const cur = counts[r.key];
  const bud = budget.budgets[r.key] ?? 0;
  const over = cur > bud;
  const flag = !r.gate ? "· 仅提示" : over ? "❌ 超预算" : cur < bud ? "✅ 已下降" : "✅ 通过";
  if (over && r.gate) failed = true;
  console.log(pad(r.key, 12) + pad(cur, 6) + pad(bud, 6) + flag);
  if (over && r.gate) console.log(`             └ ${r.label}`);
}
console.log("-".repeat(70));

if (failed) {
  console.log("\n❌ 质量闸未通过：以上规则超出预算(出现新增违规)。");
  console.log("   修掉新增项，或若确认合理，跑 `node scripts/check-ui-rules.mjs --update` 前先复核。\n");
  process.exit(1);
}
console.log("\n✅ 质量闸通过（无新增违规）。\n");
