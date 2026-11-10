#!/usr/bin/env node
// 为新增 UI 控件生成 registry-items/<id>/{meta.json,demo.tsx}
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ITEMS = join(ROOT, "registry-items");

const defs = [
  { id: "select", name: "下拉选择", cat: "02-form", tags: ["select", "dropdown", "form", "radix", "shadcn"],
    deps: ["@radix-ui/react-select"], install: "npm i @radix-ui/react-select", scene: ["form", "筛选"],
    demo: `import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Demo() {
  return (
    <div className="grid max-w-sm gap-4">
      <Select defaultValue="tiktok">
        <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="tiktok">TikTok Shop</SelectItem>
          <SelectItem value="amazon">Amazon</SelectItem>
          <SelectItem value="temu">Temu</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="worker">
        <SelectTrigger><SelectValue placeholder="选择角色" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>执行类</SelectLabel>
            <SelectItem value="worker">worker</SelectItem>
            <SelectItem value="specialist">specialist</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>管理类</SelectLabel>
            <SelectItem value="project_manager">project_manager</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
` },
  { id: "date-picker", name: "日期选择", cat: "02-form", tags: ["date", "calendar", "popover", "form"],
    deps: ["@radix-ui/react-popover"], install: "npm i @radix-ui/react-popover", scene: ["form"],
    demo: `import * as React from "react";
import { DatePicker, DateTimePicker } from "@/components/ui/date-picker";

export default function Demo() {
  const [d, setD] = React.useState<Date | undefined>(new Date());
  const [dt, setDt] = React.useState<Date | undefined>(new Date());
  return (
    <div className="flex flex-wrap gap-4">
      <DatePicker value={d} onChange={setD} />
      <DateTimePicker value={dt} onChange={setDt} />
    </div>
  );
}
` },
  { id: "calendar", name: "日历", cat: "05-data-display", tags: ["calendar", "date", "picker"],
    deps: [], install: "", scene: ["form", "排期"],
    demo: `import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

export default function Demo() {
  const [d, setD] = React.useState<Date | undefined>(new Date());
  return <Calendar value={d} onChange={setD} className="rounded-lg border p-3" />;
}
` },
  { id: "popover", name: "浮层", cat: "07-overlay", tags: ["popover", "overlay", "radix"],
    deps: ["@radix-ui/react-popover"], install: "npm i @radix-ui/react-popover", scene: ["浮层", "气泡"],
    demo: `import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function Demo() {
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline">打开浮层</Button></PopoverTrigger>
      <PopoverContent className="w-64 text-sm">浮层内容：任意 React 节点。</PopoverContent>
    </Popover>
  );
}
` },
  { id: "transfer", name: "穿梭框", cat: "02-form", tags: ["transfer", "form", "shuttle"],
    deps: ["@radix-ui/react-checkbox"], install: "npm i @radix-ui/react-checkbox", scene: ["form", "权限分配"],
    demo: `import * as React from "react";
import { Transfer, type TransferItem } from "@/components/ui/transfer";

const DATA: TransferItem[] = [
  { key: "1", title: "数据采集 Agent" },
  { key: "2", title: "内容生成 Agent" },
  { key: "3", title: "渠道分发 Agent" },
  { key: "4", title: "合规审查 Agent", disabled: true },
];

export default function Demo() {
  const [keys, setKeys] = React.useState<string[]>(["2"]);
  return <Transfer dataSource={DATA} targetKeys={keys} onChange={setKeys} />;
}
` },
  { id: "checkbox", name: "复选框", cat: "02-form", tags: ["checkbox", "form", "radix"],
    deps: ["@radix-ui/react-checkbox"], install: "npm i @radix-ui/react-checkbox", scene: ["form", "多选"],
    demo: `import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Demo() {
  return (
    <div className="grid gap-3">
      <Label className="flex items-center gap-2 font-normal"><Checkbox defaultChecked /> 已接入 API</Label>
      <Label className="flex items-center gap-2 font-normal"><Checkbox /> 人工确认</Label>
      <Label className="flex items-center gap-2 font-normal opacity-50"><Checkbox disabled /> 禁用项</Label>
    </div>
  );
}
` },
  { id: "radio-group", name: "单选组", cat: "02-form", tags: ["radio", "form", "radix"],
    deps: ["@radix-ui/react-radio-group"], install: "npm i @radix-ui/react-radio-group", scene: ["form"],
    demo: `import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function Demo() {
  const [v, setV] = React.useState("standard");
  return (
    <RadioGroup value={v} onValueChange={setV} className="grid gap-2 sm:grid-cols-3">
      {[["light","轻量"],["standard","标准"],["heavy","重度"]].map(([val, label]) => (
        <Label key={val} htmlFor={val} className="flex items-center gap-2 font-normal">
          <RadioGroupItem id={val} value={val} /> {label}
        </Label>
      ))}
    </RadioGroup>
  );
}
` },
  { id: "slider", name: "滑块", cat: "02-form", tags: ["slider", "form", "radix"],
    deps: ["@radix-ui/react-slider"], install: "npm i @radix-ui/react-slider", scene: ["form", "阈值"],
    demo: `import * as React from "react";
import { Slider } from "@/components/ui/slider";

export default function Demo() {
  const [v, setV] = React.useState([40]);
  return (
    <div className="flex max-w-sm items-center gap-4">
      <Slider value={v} onValueChange={setV} min={0} max={100} step={5} />
      <span className="w-10 text-sm tabular-nums">{v[0]}</span>
    </div>
  );
}
` },
  { id: "rich-text-editor", name: "富文本编辑器", cat: "08-advanced", tags: ["tiptap", "editor", "richtext"],
    deps: ["@tiptap/react","@tiptap/starter-kit","@tiptap/extension-link","@tiptap/extension-placeholder","@tiptap/extension-underline","@tiptap/extension-text-align"],
    install: "npm i @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-underline @tiptap/extension-text-align",
    scene: ["form", "内容"],
    demo: `import * as React from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function Demo() {
  const [html, setHtml] = React.useState("<p>用 <strong>按钮</strong> 驱动 Agent，而不是写 Prompt。</p>");
  return <RichTextEditor value={html} onChange={setHtml} />;
}
` },
  { id: "markdown-editor", name: "Markdown 编辑器", cat: "08-advanced", tags: ["markdown", "editor", "preview"],
    deps: ["@uiw/react-md-editor"], install: "npm i @uiw/react-md-editor", scene: ["form", "文档"],
    demo: `import * as React from "react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

export default function Demo() {
  const [md, setMd] = React.useState("# 标题\\n\\n- 支持实时预览\\n- 支持 GFM 待办\\n\\n- [x] 已完成\\n- [ ] 待办");
  return <MarkdownEditor value={md} onChange={setMd} />;
}
` },
];

let n = 0;
for (const d of defs) {
  const dir = join(ITEMS, d.id);
  if (existsSync(join(dir, "meta.json"))) { console.log("skip", d.id); continue; }
  mkdirSync(dir, { recursive: true });
  const meta = {
    id: d.id, name: d.name, category: d.cat, tags: d.tags, stack: "shadcn", source: "shardkit",
    complexity: "组件", scene: d.scene, status: "可用", usability: d.deps.length ? "需依赖" : "copy-paste",
    deps: d.deps, installCmd: d.install, targetDir: "src/components/ui",
  };
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n", "utf8");
  writeFileSync(join(dir, "demo.tsx"), d.demo, "utf8");
  n++;
}
console.log(`generated ${n} registry-items`);
