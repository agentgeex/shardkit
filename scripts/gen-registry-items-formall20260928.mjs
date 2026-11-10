#!/usr/bin/env node
/**
 * gen-registry-items-formall20260928.mjs — 为「表单页·全部示例」新增控件生成注册表条目
 * 生成 registry-items/<id>/{meta.json,demo.tsx}，随后 npm run build:registry 入索引。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS = join(ROOT, "registry-items");

const items = [
  {
    id: "input-number",
    name: "数字输入框",
    category: "02-form",
    tags: ["input-number", "number", "stepper", "form"],
    complexity: "组件",
    scene: ["表单", "数量"],
    demo: `import * as React from "react";
import { InputNumber } from "@/components/ui/input-number";

export default function Demo() {
  const [v, setV] = React.useState(3);
  return (
    <div className="flex items-center gap-3">
      <InputNumber value={v} onChange={setV} min={0} max={99} step={1} />
      <span className="text-sm text-muted-foreground">当前：{v}</span>
    </div>
  );
}`,
  },
  {
    id: "rate",
    name: "评分",
    category: "02-form",
    tags: ["rate", "star", "score", "form"],
    complexity: "组件",
    scene: ["表单", "评价"],
    demo: `import * as React from "react";
import { Rate } from "@/components/ui/rate";

export default function Demo() {
  const [v, setV] = React.useState(3);
  return <Rate value={v} onChange={setV} allowHalf />;
}`,
  },
  {
    id: "input-tag",
    name: "标签输入",
    category: "02-form",
    tags: ["input-tag", "tags", "chips", "form"],
    complexity: "组件",
    scene: ["表单", "多值"],
    demo: `import * as React from "react";
import { InputTag } from "@/components/ui/input-tag";

export default function Demo() {
  const [v, setV] = React.useState(["React", "Vite"]);
  return <InputTag value={v} onChange={setV} placeholder="输入后回车添加" />;
}`,
  },
  {
    id: "combobox",
    name: "自动完成",
    category: "02-form",
    tags: ["combobox", "autocomplete", "search", "form"],
    complexity: "组件",
    scene: ["表单", "搜索选择"],
    demo: `import * as React from "react";
import { Combobox } from "@/components/ui/combobox";

const OPTIONS = [
  { value: "vue", label: "Vue" },
  { value: "react", label: "React" },
  { value: "angular", label: "Angular" },
];

export default function Demo() {
  const [v, setV] = React.useState("");
  return <Combobox options={OPTIONS} value={v} onChange={setV} placeholder="选择或输入框架" />;
}`,
  },
  {
    id: "cascader",
    name: "级联选择",
    category: "02-form",
    tags: ["cascader", "cascade", "tree", "form"],
    complexity: "组件",
    scene: ["表单", "多级分类"],
    demo: `import * as React from "react";
import { Cascader } from "@/components/ui/cascader";

const OPTIONS = [
  { value: "guide", label: "指南", children: [
    { value: "spec", label: "规范", children: [{ value: "consistency", label: "一致性" }] },
  ]},
  { value: "comp", label: "组件", children: [{ value: "button", label: "按钮" }] },
];

export default function Demo() {
  const [v, setV] = React.useState([]);
  return <Cascader options={OPTIONS} value={v} onChange={(p) => setV(p)} suppressHydrationWarning />;
}`,
  },
  {
    id: "tree-select",
    name: "树选择",
    category: "02-form",
    tags: ["tree-select", "tree", "form"],
    complexity: "组件",
    scene: ["表单", "层级选择"],
    demo: `import * as React from "react";
import { TreeSelect } from "@/components/ui/tree-select";

const TREE = [
  { value: "1", label: "一级 1-1", children: [{ value: "1-1", label: "二级 1-1-1" }] },
  { value: "2", label: "一级 1-2" },
];

export default function Demo() {
  const [v, setV] = React.useState([]);
  return <TreeSelect tree={TREE} value={v} onChange={setV} />;
}`,
  },
  {
    id: "time-picker",
    name: "时间选择",
    category: "02-form",
    tags: ["time-picker", "time", "clock", "form"],
    complexity: "组件",
    scene: ["表单", "时间"],
    demo: `import * as React from "react";
import { TimePicker, TimeSelect } from "@/components/ui/time-picker";

export default function Demo() {
  const [t, setT] = React.useState("09:30");
  const [ts, setTs] = React.useState("");
  return (
    <div className="flex flex-col gap-3">
      <TimePicker value={t} onChange={setT} />
      <TimeSelect value={ts} onChange={setTs} start="08:30" end="18:00" stepMinutes={30} />
    </div>
  );
}`,
  },
  {
    id: "color-picker",
    name: "颜色选择",
    category: "02-form",
    tags: ["color-picker", "color", "palette", "form"],
    complexity: "组件",
    scene: ["表单", "主题色"],
    demo: `import * as React from "react";
import { ColorPicker } from "@/components/ui/color-picker";

export default function Demo() {
  const [c, setC] = React.useState("#6366f1");
  return <ColorPicker value={c} onChange={setC} />;
}`,
  },
  {
    id: "upload",
    name: "文件上传",
    category: "02-form",
    tags: ["upload", "file", "form"],
    complexity: "组件",
    scene: ["表单", "文件"],
    demo: `import * as React from "react";
import { Upload } from "@/components/ui/upload";

export default function Demo() {
  const [v, setV] = React.useState([]);
  return <Upload value={v} onChange={setV} multiple maxCount={3} tip="支持多选，最多 3 个文件" />;
}`,
  },
  {
    id: "pagination",
    name: "分页",
    category: "04-navigation",
    tags: ["pagination", "pager", "nav"],
    complexity: "组件",
    scene: ["列表", "导航"],
    demo: `import * as React from "react";
import { Pagination } from "@/components/ui/pagination";

export default function Demo() {
  const [p, setP] = React.useState(2);
  return <Pagination page={p} pageCount={10} onPageChange={setP} />;
}`,
  },
  {
    id: "tooltip",
    name: "文字提示",
    category: "07-overlay",
    tags: ["tooltip", "hint", "overlay", "radix"],
    complexity: "组件",
    deps: ["@radix-ui/react-tooltip"],
    scene: ["提示", "浮层"],
    demo: `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function Demo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild><Button variant="outline">悬停提示</Button></TooltipTrigger>
        <TooltipContent>这是一段悬浮提示文字</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}`,
  },
];

for (const it of items) {
  const dir = join(ITEMS, it.id);
  mkdirSync(dir, { recursive: true });
  const meta = {
    id: it.id,
    name: it.name,
    category: it.category,
    tags: it.tags,
    stack: "shadcn",
    source: "shardkit",
    complexity: it.complexity,
    scene: it.scene,
    status: "可用",
    usability: it.deps && it.deps.length ? "需依赖" : "copy-paste",
  };
  if (it.deps) {
    meta.deps = it.deps;
    meta.installCmd = `npm i ${it.deps.join(" ")}`;
  }
  meta.targetDir = "src/components/ui";
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  writeFileSync(join(dir, "demo.tsx"), it.demo + "\n");
  console.log(`✓ registry-items/${it.id}`);
}
console.log(`\n生成 ${items.length} 个注册表条目，请运行 npm run build:registry`);
