/**
 * lib/cases.ts — 案例目录（单一事实源）
 *
 * 作用：集中定义「页面案例」的元信息，驱动：
 *   1. shell.tsx 侧边栏导航      ← CASES
 *   2. index-page.tsx 案例索引   ← CASES
 *
 * 设计要点（2026-09-16 维护者三次纠偏）：
 *   - 案例页要**和真实应用一模一样**，顶部不带任何「取用 / 元数据」UI；
 *     原「复制页面源码 / 一键打包复制本页 / 页面·目标」等取用动作已全部移除。
 *   - 因此本目录只保留页面本身的展示元信息（路由/标题/描述/图标/标签/配色），
 *     不再承载「零件依赖表」——那套只为打包复制服务，已随打包功能一并删除。
 *   - 打包产物（public/r/*.json、public/bundles/*.txt）由 scripts/build-cases.mjs
 *     在构建期独立生成，页面运行时不依赖它们。
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, LayoutList, ClipboardList, FileText, Lock, AlertTriangle, Blocks, Component, FolderTree, Rows3, SquareDashed, Table2, LayoutGrid, ListFilter, FileSearch, GalleryVerticalEnd, GitBranch, AlignLeft,
} from "lucide-react";

export interface CaseDef {
  /** 路由 */
  to: string;
  /** 案例 id */
  id: string;
  title: string;
  desc: string;
  /** 英文标题（方案 A：导航/索引等框架层展示用；缺省回退 title） */
  titleEn?: string;
  /** 英文描述（缺省回退 desc） */
  descEn?: string;
  icon: LucideIcon;
  kind: "page" | "block";
  tags: string[];
  /** 卡片顶部渐变 */
  tone: string;
}

/** 按语言取案例标题（框架层展示用） */
export function caseTitle(c: CaseDef, lang: string): string {
  return lang.startsWith("en") && c.titleEn ? c.titleEn : c.title;
}

/** 按语言取案例描述 */
export function caseDesc(c: CaseDef, lang: string): string {
  return lang.startsWith("en") && c.descEn ? c.descEn : c.desc;
}

/** 页面/区块案例 */
export const CASES: CaseDef[] = [
  {
    to: "/blank", id: "blank", title: "空白页",
    desc: "默认空白工作区；标签全部关闭后回落到此（固定不可关），内容后续再填",
    titleEn: "Blank page",
    descEn: "Default blank workspace; the fallback when all tabs are closed (pinned). Content TBD.",
    icon: SquareDashed, kind: "page",
    tags: ["空白", "默认页", "兜底"],
    tone: "from-slate-500/20 to-slate-400/10",
  },
  {
    to: "/dashboard", id: "dashboard", title: "仪表盘",
    desc: "指标卡 + 折线/饼图/柱状图 + 最近执行表格",
    titleEn: "Dashboard",
    descEn: "Metric cards + line/pie/bar charts + recent executions table.",
    icon: LayoutDashboard, kind: "page",
    tags: ["图表", "指标卡", "recharts"],
    tone: "from-sky-500/20 to-indigo-500/10",
  },
  {
    to: "/list", id: "list", title: "列表页 · 弹窗式 CRUD",
    desc: "数据表格 + 搜索 + 分页 + 行内工具条；新建/编辑/详情在列表内弹窗完成",
    titleEn: "List · Dialog CRUD",
    descEn: "Data table + search + pagination + row toolbar; create/edit/detail via in-page dialogs.",
    icon: LayoutList, kind: "page",
    tags: ["表格", "搜索", "分页", "弹窗式"],
    tone: "from-emerald-500/20 to-teal-500/10",
  },
  {
    to: "/list-page", id: "list-page", title: "列表页 · 页面式 CRUD",
    desc: "同款数据表格与筛选；新建/编辑/详情跳转独立页面完成，两套形态并列可直接对比",
    titleEn: "List · Page CRUD",
    descEn: "Same table & filters; create/edit/detail on dedicated pages — compare the two CRUD styles side by side.",
    icon: Rows3, kind: "page",
    tags: ["表格", "搜索", "分页", "页面式"],
    tone: "from-teal-500/20 to-cyan-500/10",
  },
  {
    to: "/form", id: "form", title: "表单页",
    desc: "表单·全部示例（对齐 vue-admin-tpl）：输入/选择/日期时间/上传/富文本/展示反馈全控件总览 + 校验",
    titleEn: "Form page",
    descEn: "All form examples: input/select/date-time/upload/rich-text/feedback controls with validation.",
    icon: ClipboardList, kind: "page",
    tags: ["表单", "全部示例", "全控件"],
    tone: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    to: "/table", id: "table", title: "表格 · 基础示例",
    desc: "表格基础用法（对齐 vue-admin-tpl「表格→基础示例」）：可排序列、状态标签、行内操作、分页",
    titleEn: "Table · Basic",
    descEn: "Table basics: sortable columns, status tags, row actions, pagination.",
    icon: Table2, kind: "page",
    tags: ["表格", "排序", "标签", "分页", "基础示例"],
    tone: "from-emerald-500/20 to-lime-500/10",
  },
  {
    to: "/table/card", id: "table-card", title: "表格 · 卡片表格",
    desc: "以卡片网格承载数据（对齐 vue-admin-tpl「表格→卡片表格」）：圆形头像 + 名称 + 描述 + 底部操作",
    titleEn: "Table · Card grid",
    descEn: "Data as a card grid: round avatar + name + description + footer actions.",
    icon: LayoutGrid, kind: "page",
    tags: ["表格", "卡片", "网格", "卡片表格"],
    tone: "from-teal-500/20 to-emerald-500/10",
  },
  {
    to: "/search", id: "search", title: "查询 · 全部示例",
    desc: "查询面板形态演示（对齐 vue-admin-tpl「组件→查询」）：Schema 驱动多字段筛选 + 栅格/布局/按钮位置切换 + 展开收起 + 动态增删字段/赋值/加载态",
    titleEn: "Search · All examples",
    descEn: "Search-panel patterns: schema-driven multi-field filters, grid/layout/button-position toggles, collapse, dynamic fields/assign/loading.",
    icon: ListFilter, kind: "page",
    tags: ["查询", "筛选", "全部示例", "Schema驱动"],
    tone: "from-sky-500/20 to-cyan-500/10",
  },
  {
    to: "/search/orders", id: "search-orders", title: "查询 · 订单查询",
    desc: "产品化查询页：订单筛选面板 + 结果表格（排序/状态标签/行内操作/分页），客户可直接照抄的成品",
    titleEn: "Search · Orders",
    descEn: "Production-style search page: order filter panel + result table (sort/status tags/row actions/pagination).",
    icon: FileSearch, kind: "page",
    tags: ["查询", "筛选", "表格", "产品化"],
    tone: "from-cyan-500/20 to-sky-500/10",
  },
  {
    to: "/components", id: "components", title: "控件展厅",
    desc: "表单/交互控件集中演示：下拉·日期·日历·穿梭框·复选·单选·滑块·开关·富文本·Markdown",
    titleEn: "Widget gallery",
    descEn: "Form & interactive widgets in one place: select/date/calendar/transfer/checkbox/radio/slider/switch/rich-text/Markdown.",
    icon: Component, kind: "page",
    tags: ["控件", "展厅", "交互"],
    tone: "from-fuchsia-500/20 to-purple-500/10",
  },
  {
    to: "/waterfall", id: "waterfall", title: "瀑布流",
    desc: "不等高卡片流式排布 + 无限滚动（对齐 vue-admin-tpl「组件→瀑布流」）：flex 分列 / javascript 绝对定位双算法，栏目宽自适应",
    titleEn: "Waterfall",
    descEn: "Staggered-height cards + infinite scroll: flex-column and absolute-positioning algorithms, auto-responsive columns.",
    icon: GalleryVerticalEnd, kind: "page",
    tags: ["瀑布流", "无限滚动", "响应式", "组件"],
    tone: "from-cyan-500/20 to-teal-500/10",
  },
  {
    to: "/detail", id: "detail", title: "详情页",
    desc: "信息卡 + 描述列表 + 活动时间线 + 关联表格",
    titleEn: "Detail page",
    descEn: "Info card + description list + activity timeline + related table.",
    icon: FileText, kind: "page",
    tags: ["详情", "时间线", "描述列表"],
    tone: "from-amber-500/20 to-orange-500/10",
  },
  {
    to: "/detail-view", id: "detail-view", title: "详情页 · 表格型",
    desc: "只读展示页：标签列浅灰底的表格型描述列表（对齐 vue-admin-tpl 描述列表 border 模式），零输入控件",
    titleEn: "Detail · Descriptions table",
    descEn: "Read-only descriptions table with a muted label column (Element Plus border mode); no editable controls.",
    icon: AlignLeft, kind: "page",
    tags: ["详情", "描述列表", "只读", "表格型"],
    tone: "from-amber-500/20 to-yellow-500/10",
  },
  {
    to: "/auth", id: "auth", title: "认证页",
    desc: "居中登录卡 + 表单 + SSO 入口",
    titleEn: "Auth page",
    descEn: "Centered sign-in card + form + SSO entry.",
    icon: Lock, kind: "page",
    tags: ["登录", "认证", "居中卡"],
    tone: "from-rose-500/20 to-pink-500/10",
  },
  {
    to: "/error", id: "error", title: "错误页",
    desc: "404 / 500 / 403 三态标准错误页",
    titleEn: "Error page",
    descEn: "Standard 404 / 500 / 403 error states.",
    icon: AlertTriangle, kind: "page",
    tags: ["错误", "404", "空态"],
    tone: "from-slate-500/20 to-zinc-500/10",
  },
  {
    to: "/menu", id: "menu", title: "多级菜单",
    desc: "树形嵌套导航：父级可展开/折叠（2-3 级），每个叶子菜单对应一个空白占位页",
    titleEn: "Multi-level menu",
    descEn: "Nested tree navigation: expandable parents (2–3 levels), each leaf maps to a placeholder page.",
    icon: FolderTree, kind: "page",
    tags: ["菜单", "嵌套", "路由"],
    tone: "from-blue-500/20 to-cyan-500/10",
  },
  {
    to: "/plan-flow", id: "plan-flow", title: "计划流程图",
    desc: "计划任务执行可视化（对齐 PROJECT_MANAGEMENT.md）：把 plan 的 steps 渲染成 DAG 流程图，直观呈现 1:1/1:N/N:1 依赖与执行状态。基于 React Flow + dagre",
    titleEn: "Plan flow",
    descEn: "Plan-execution visualization: render a plan's steps as a DAG, showing 1:1/1:N/N:1 dependencies and run status. Built on React Flow + dagre.",
    icon: GitBranch, kind: "page",
    tags: ["计划", "流程图", "DAG", "React Flow", "可视化"],
    tone: "from-indigo-500/20 to-violet-500/10",
  },
  {
    to: "/plan-flow-fit", id: "plan-flow-fit", title: "计划流程图 · 自适应网格（实验）",
    desc: "研究原型：按容器大小自动求最优行列，把流程图的阶段列铺成网格撑满一屏。附实时指标（zoom / 正文 px / 填充率）与蛇形/齐左对比",
    titleEn: "Plan flow · auto grid (experiment)",
    descEn: "Research prototype: solve the optimal row/column split to fill one screen. Live metrics (zoom / body px / fill ratio) and snake vs left-aligned comparison.",
    icon: LayoutGrid, kind: "page",
    tags: ["计划", "流程图", "网格", "布局算法", "实验"],
    tone: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    to: "/blocks", id: "blocks", title: "布局区块",
    desc: "统计卡组 / 工具条 / 空态 / 用户卡 / 设置项 等可整块复用区块",
    titleEn: "Layout blocks",
    descEn: "Reusable blocks: stat card groups / toolbars / empty states / user cards / setting rows.",
    icon: Blocks, kind: "block",
    tags: ["区块", "布局", "组合"],
    tone: "from-cyan-500/20 to-blue-500/10",
  },
];
