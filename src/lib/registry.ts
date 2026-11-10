/**
 * lib/registry.ts — ShardKit 注册表读取层
 *
 * 机制（注册表驱动）：
 *   新增组件 = 放一份 registry-items/<id>/{meta.json,index.tsx,demo.tsx}
 *   → 跑 `npm run build:registry` 生成 registry/index.json
 *   → 页面自动出现该组件（无需改页面代码）
 *
 * 本模块只读 registry/index.json（构建期产物），并提供分类/标签聚合。
 */
import registry from "../../registry/index.json";

export type Complexity = "片段" | "组件" | "区块" | "页面";
export type Status = "可用" | "待整理" | "弃用";
export type Usability = "copy-paste" | "需适配" | "需依赖";

export interface RegistryItem {
  id: string;
  name: string;
  category: string;
  tags: string[];
  stack: string;
  source: string;
  complexity: Complexity | string;
  scene?: string[];
  status?: Status | string;
  usability?: Usability | string;
  preview?: string;
  demo?: string;
  files?: string[];
  deps?: string[];
  installCmd?: string;
  targetDir?: string;
  createdAt?: string;
}

export interface RegistryIndex {
  $schema?: string;
  generatedAt: string;
  version: string;
  count: number;
  items: RegistryItem[];
}

const data = registry as unknown as RegistryIndex;

export const CATEGORIES: { id: string; label: string }[] = [
  { id: "01-basic", label: "基础元素" },
  { id: "02-form", label: "表单" },
  { id: "03-layout", label: "布局" },
  { id: "04-navigation", label: "导航" },
  { id: "05-data-display", label: "数据展示" },
  { id: "06-feedback", label: "反馈" },
  { id: "07-overlay", label: "浮层" },
  { id: "08-advanced", label: "复合 / 高级" },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function allItems(): RegistryItem[] {
  return [...data.items].sort((a, b) => a.id.localeCompare(b.id));
}

export function getItem(id: string): RegistryItem | undefined {
  return data.items.find((i) => i.id === id);
}

export function registryMeta(): Omit<RegistryIndex, "items"> {
  return {
    $schema: data.$schema,
    generatedAt: data.generatedAt,
    version: data.version,
    count: data.count,
  };
}

/** 按主分类聚合（保持 CATEGORIES 顺序，忽略空分类） */
export function itemsByCategory(): { id: string; label: string; items: RegistryItem[] }[] {
  return CATEGORIES.map((c) => ({
    ...c,
    items: allItems().filter((i) => i.category === c.id),
  })).filter((g) => g.items.length > 0);
}

/** 聚合所有正交标签（stack/source/complexity/scene/status/usability） */
export function allFacets(): {
  stack: string[];
  source: string[];
  complexity: string[];
  scene: string[];
  status: string[];
  usability: string[];
} {
  const uniq = (arr: (string | undefined)[]) =>
    Array.from(new Set(arr.filter((x): x is string => !!x))).sort();
  const items = allItems();
  return {
    stack: uniq(items.map((i) => i.stack)),
    source: uniq(items.map((i) => i.source)),
    complexity: uniq(items.map((i) => i.complexity)),
    scene: uniq(items.flatMap((i) => i.scene ?? [])),
    status: uniq(items.map((i) => i.status)),
    usability: uniq(items.map((i) => i.usability)),
  };
}
