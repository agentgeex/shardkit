#!/usr/bin/env node
/**
 * build-cases.mjs — 生成「案例」的 shadcn registry 条目 + 打包复制文本
 *
 * 复制形态 B（维护者拍板）：
 *   - 每个案例产出 public/r/<id>.json  → shadcn registry-item 格式，消费方可
 *     `npx shadcn@latest add <url>/r/dashboard.json` 直接安装；
 *   - 每个案例产出 public/bundles/<id>.txt → 打包复制文本（页面 + 全部依赖零件全文）。
 *
 * 依赖分析：读 src/lib/cases.ts 的 CASES 定义（单一事实源），
 * 逐一读取各文件源码，拼装 files[].path + target。
 *
 * 用法：node scripts/build-cases.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// —— 从 cases.ts 提取案例定义（轻量解析：不引入 ts 运行时，读源码正则） ——
// 为稳健起见，CASES 的关键字段在此以结构化方式再声明一次（与 cases.ts 保持同步）。
// 这里只用于构建产物；运行时以 src/lib/cases.ts 为准。
const CASES = [
  { id: "dashboard", title: "仪表盘", kind: "page", target: "src/pages/Dashboard.tsx",
    src: "src/pages/cases/dashboard.tsx",
    parts: ["src/components/ui/card.tsx","src/components/ui/badge.tsx","src/components/ui/table.tsx","src/components/ui/separator.tsx","src/components/page-header.tsx","src/components/status-badge.tsx","src/mock/data.ts"],
    npm: ["recharts","lucide-react"] },
  { id: "blank", title: "空白页", kind: "page", target: "src/pages/Blank.tsx",
    src: "src/pages/cases/blank.tsx",
    parts: ["src/components/ui/card.tsx"],
    npm: ["lucide-react"] },
  { id: "list", title: "列表页", kind: "page", target: "src/pages/ProductList.tsx",
    src: "src/pages/cases/dialog-crud/index.tsx",
    parts: ["src/components/ui/table.tsx","src/components/ui/input.tsx","src/components/ui/button.tsx","src/components/ui/badge.tsx","src/components/ui/card.tsx","src/components/ui/select.tsx","src/components/ui/checkbox.tsx","src/components/ui/separator.tsx","src/components/page-header.tsx","src/components/status-badge.tsx","src/mock/data.ts"],
    npm: ["lucide-react","@radix-ui/react-select","@radix-ui/react-checkbox"] },
  { id: "form", title: "表单页", kind: "page", target: "src/pages/RecipeCreate.tsx",
    src: "src/pages/cases/form.tsx",
    parts: ["src/components/ui/input.tsx","src/components/ui/button.tsx","src/components/ui/textarea.tsx","src/components/ui/switch.tsx","src/components/ui/label.tsx","src/components/ui/separator.tsx","src/components/ui/card.tsx","src/components/ui/badge.tsx","src/components/page-header.tsx","src/components/ui/select.tsx","src/components/ui/date-picker.tsx","src/components/ui/calendar.tsx","src/components/ui/popover.tsx","src/components/ui/transfer.tsx","src/components/ui/checkbox.tsx","src/components/ui/radio-group.tsx","src/components/ui/slider.tsx","src/components/ui/rich-text-editor.tsx","src/components/ui/markdown-editor.tsx"],
    npm: ["lucide-react","@radix-ui/react-select","@radix-ui/react-popover","@radix-ui/react-checkbox","@radix-ui/react-radio-group","@radix-ui/react-slider","@tiptap/react","@tiptap/starter-kit","@tiptap/extension-link","@tiptap/extension-placeholder","@tiptap/extension-underline","@tiptap/extension-text-align","@uiw/react-md-editor"] },
  { id: "components", title: "控件展厅", kind: "page", target: "src/pages/Components.tsx",
    src: "src/pages/cases/components.tsx",
    parts: ["src/components/ui/card.tsx","src/components/ui/badge.tsx","src/components/ui/button.tsx","src/components/ui/input.tsx","src/components/ui/label.tsx","src/components/ui/separator.tsx","src/components/ui/switch.tsx","src/components/ui/checkbox.tsx","src/components/ui/radio-group.tsx","src/components/ui/slider.tsx","src/components/page-header.tsx","src/components/ui/select.tsx","src/components/ui/date-picker.tsx","src/components/ui/calendar.tsx","src/components/ui/popover.tsx","src/components/ui/transfer.tsx","src/components/ui/rich-text-editor.tsx","src/components/ui/markdown-editor.tsx"],
    npm: ["lucide-react","@radix-ui/react-select","@radix-ui/react-popover","@radix-ui/react-checkbox","@radix-ui/react-radio-group","@radix-ui/react-slider","@tiptap/react","@tiptap/starter-kit","@tiptap/extension-link","@tiptap/extension-placeholder","@tiptap/extension-underline","@tiptap/extension-text-align","@uiw/react-md-editor"] },
  { id: "detail", title: "详情页", kind: "page", target: "src/pages/AgentDetail.tsx",
    src: "src/pages/cases/detail.tsx",
    parts: ["src/components/ui/card.tsx","src/components/ui/button.tsx","src/components/ui/badge.tsx","src/components/ui/separator.tsx","src/components/ui/table.tsx","src/components/ui/tabs.tsx","src/components/page-header.tsx","src/components/status-badge.tsx","src/mock/data.ts"],
    npm: ["lucide-react"] },
  { id: "auth", title: "认证页", kind: "page", target: "src/pages/Login.tsx",
    src: "src/pages/cases/auth.tsx",
    parts: ["src/components/ui/input.tsx","src/components/ui/button.tsx","src/components/ui/label.tsx","src/components/ui/card.tsx","src/components/ui/separator.tsx"],
    npm: ["lucide-react"] },
  { id: "error", title: "错误页", kind: "page", target: "src/pages/Error.tsx",
    src: "src/pages/cases/error.tsx",
    parts: ["src/components/ui/button.tsx","src/components/page-header.tsx"],
    npm: ["lucide-react"] },
  { id: "blocks", title: "布局区块", kind: "block", target: "src/blocks/Blocks.tsx",
    src: "src/pages/cases/blocks.tsx",
    parts: ["src/components/ui/card.tsx","src/components/ui/badge.tsx","src/components/ui/button.tsx","src/components/ui/input.tsx","src/components/ui/separator.tsx","src/components/page-header.tsx"],
    npm: ["lucide-react"] },
];

/** src/... → shadcn registry-item 的 target（用 @ui/@components/@lib 占位符） */
function toTarget(p) {
  if (p.startsWith("src/components/ui/")) return "@ui/" + p.slice("src/components/ui/".length);
  if (p.startsWith("src/components/")) return "@components/" + p.slice("src/components/".length);
  if (p.startsWith("src/lib/")) return "@lib/" + p.slice("src/lib/".length);
  return p; // src/mock/data.ts 等保持原路径
}

/** 文件类型 */
function fileType(target, isPage) {
  if (isPage) return "registry:page";
  if (target.startsWith("@ui/")) return "registry:ui";
  if (target.startsWith("@lib/")) return "registry:lib";
  return "registry:file";
}

function read(p) {
  const full = join(ROOT, p);
  return existsSync(full) ? readFileSync(full, "utf8") : "";
}

function main() {
  mkdirSync(join(ROOT, "public", "r"), { recursive: true });
  mkdirSync(join(ROOT, "public", "bundles"), { recursive: true });

  for (const c of CASES) {
    // ---- 1. shadcn registry-item ----
    const files = [{ path: c.src, target: c.target, type: "registry:page" }];
    for (const p of c.parts) {
      const t = toTarget(p);
      files.push({ path: p, target: t, type: fileType(t, false) });
    }
    const registryDeps = c.parts
      .filter((p) => p.startsWith("src/components/ui/"))
      .map((p) => p.slice("src/components/ui/".length).replace(/\.tsx$/, ""));

    const item = {
      $schema: "https://ui.shadcn.com/schema/registry-item.json",
      name: c.id,
      type: c.kind === "block" ? "registry:block" : "registry:page",
      title: c.title,
      description: `ShardKit 案例：${c.title}`,
      registryDependencies: registryDeps,
      dependencies: c.npm,
      files,
      categories: ["shardkit", c.kind],
      meta: { shardkit: { kind: c.kind, target: c.target } },
    };
    writeFileSync(join(ROOT, "public", "r", `${c.id}.json`), JSON.stringify(item, null, 2) + "\n", "utf8");

    // ---- 2. 打包复制文本 ----
    const lines = [];
    lines.push(`=== ShardKit Bundle: ${c.title} (${c.id}) ===`);
    lines.push(`# 用法：把下面每段写入对应"目标路径"，再按需 npm install。`);
    lines.push(`# 本包含 ${files.length} 个文件${c.npm.length ? ` + ${c.npm.length} 个 npm 依赖` : ""}。`);
    lines.push("");
    if (c.npm.length) {
      lines.push(`[npm]  npm install ${c.npm.join(" ")}`);
      lines.push("");
    }
    lines.push("--- 目标路径清单 ---");
    for (const f of files) lines.push(`  ${f.target}`);
    lines.push("");
    for (const f of files) {
      const src = read(f.path);
      if (!src) continue;
      lines.push(`--- ${f.target} ---`);
      lines.push(src.trimEnd());
      lines.push("");
    }
    writeFileSync(join(ROOT, "public", "bundles", `${c.id}.txt`), lines.join("\n"), "utf8");
  }

  console.log(`[build-cases] ✅ 生成 ${CASES.length} 个 shadcn registry 条目 → public/r/`);
  console.log(`[build-cases] ✅ 生成 ${CASES.length} 个打包复制文本 → public/bundles/`);
}

main();
