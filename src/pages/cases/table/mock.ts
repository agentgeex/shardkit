/**
 * pages/cases/table/mock.ts — 表格页示例数据（对齐 vue-admin-tpl 的 mock 数据形态）
 *
 * 参考：vue-admin-tpl/mock/table/index.mock.ts
 *  - /mock/example/list → 基础示例表（DefaultTable）；字段：title/author/display_time/importance/pageviews
 *  - /mock/card/list    → 卡片表格（CardTable）；字段：logo/name/desc
 * 为保持前端案例自洽（不依赖后端 mock 服务），此处内联静态数据。
 */
import type { LucideIcon } from "lucide-react";

export interface ExampleRow {
  id: string;
  title: string;
  author: string;
  display_time: string;
  /** 1=重要 2=良好 3=一般（对应 ElTag type: success/warning/danger） */
  importance: 1 | 2 | 3;
  pageviews: number;
}

/** 基础示例表数据（100 条，取标题/作者/时间/重要度/浏览量） */
export const EXAMPLE_ROWS: ExampleRow[] = Array.from({ length: 100 }).map((_, i) => ({
  id: `row_${i + 1}`,
  title: [
    "AgentOS 任务编排最佳实践",
    "「把 Prompt 封装为按钮」的产品设计",
    "ShardKit 组件库接入指南",
    "任务配方可视化配置说明",
    "多 Agent 协作调度原理",
    "OpenClaw 网关配置手记",
  ][i % 6] + `（${i + 1}）`,
  author: ["维护者", "阿哲", "小林", "Kevin", "Amy", "子墨"][i % 6],
  // 倒序时间的基准：2026-09-28 起，每条递减 3 小时
  display_time: new Date(Date.UTC(2026, 8, 28, 12, 0, 0) - i * 3 * 3600_000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " "),
  importance: (([1, 2, 3] as const)[i % 3]) as 1 | 2 | 3,
  pageviews: 100 + ((i * 137) % 400),
}));

export interface CardRow {
  id: string;
  logo: string;
  name: string;
  desc: string;
}

/** 卡片表格数据（对齐 vue-admin-tpl cardList：6 个前端生态 logo） */
export const CARD_ROWS: CardRow[] = [
  { id: "c1", logo: "https://gw.alipayobjects.com/zos/rmsportal/WdGqmHpayyMjiEhcKoVE.png", name: "Alipay", desc: "在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。" },
  { id: "c2", logo: "https://gw.alipayobjects.com/zos/rmsportal/zOsKZmFRdUtvpqCImOVY.png", name: "Angular", desc: "在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。" },
  { id: "c3", logo: "https://gw.alipayobjects.com/zos/rmsportal/siCrBXXhmvTQGWPNLBow.png", name: "Bootstrap", desc: "在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。" },
  { id: "c4", logo: "https://gw.alipayobjects.com/zos/rmsportal/kZzEzemZyKLKFsojXItE.png", name: "React", desc: "在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。" },
  { id: "c5", logo: "https://gw.alipayobjects.com/zos/rmsportal/ComBAopevLwENQdKWiIn.png", name: "Vue", desc: "在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。" },
  { id: "c6", logo: "https://gw.alipayobjects.com/zos/rmsportal/nxkuOJlFJuAUhzlMTCEe.png", name: "Webpack", desc: "在中台产品的研发过程中，会出现不同的设计规范和实现方式，但其中往往存在很多类似的页面和组件，这些类似的组件会被抽离成一套标准规范。" },
];

/** 重要度 → 中文标签（对应 t('tableDemo.important'|'good'|'commonly')） */
export const IMPORTANCE_LABEL: Record<1 | 2 | 3, string> = {
  1: "重要",
  2: "良好",
  3: "一般",
};

/** 重要度 → Badge variant（success / warning / destructive） */
export const IMPORTANCE_VARIANT: Record<1 | 2 | 3, "success" | "warning" | "destructive"> = {
  1: "success",
  2: "warning",
  3: "destructive",
};

/** 供类型标注备用 */
export type AnyIcon = LucideIcon;
