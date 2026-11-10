/**
 * plan → React Flow 转换适配器
 * ──────────────────────────────────────────────────────────────
 * 输入：docs/PROJECT_MANAGEMENT.md §3.2 定义的 plan JSON
 * 输出：@xyflow/react 的 nodes / edges（经 dagre 自动布局）
 *
 * 依赖关系映射（对齐文档 §1）：
 *   - children[]        → 父 → 子 实线边（structural / containment）
 *   - parent_run_uuid   → 同一条边的反向引用（冗余，用于自愈补边）
 *   - prev_task         → A → B 虚线边（dependency / 时序）
 *   - scheduled_at      → 无显式边，靠「激活顺序」连线（定时串行）
 */
import dagre from "@dagrejs/dagre";
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import type { Plan, PlanStep, RunStatus } from "./mock";

export interface StepNodeData extends Record<string, unknown> {
  step: PlanStep;
  status: RunStatus;
  isHierarchy: boolean; // 是否为「容器步」（有子任务）
  /** 子任务数量（0/undefined = 叶节点）。父节点卡片上显示「N 子」徽标 */
  childCount?: number;
  /** 直接子任务 id 列表（折叠时据此隐藏整棵子树） */
  childIds?: string[];
  /** 是否为子任务（非主链节点）——决定卡片尺寸与视觉权重 */
  isChild?: boolean;
  /** 是否已折叠（仅父节点有意义） */
  collapsed?: boolean;
  /** 折叠开关回调（由页面注入，仅父节点有） */
  onToggleCollapse?: (id: string) => void;
  /** 演示播放：是否当前执行节点 */
  active?: boolean;
  /** 演示播放：是否已执行完 */
  done?: boolean;
}

/** 边语义：struct = 父子包含（垂直），dep = 时序先后（水平） */
export type EdgeKind = "struct" | "dep";

const NODE_W = 240;
const NODE_H = 92;

/** 判定是否为「层级计划」调度步（靠 task_id / instruction 特征） */
function isHierarchyStep(step: PlanStep): boolean {
  const t = `${step.task_id ?? ""} ${step.instruction ?? ""}`;
  return /plan_execute|plan_generate_and_deploy|激活计划|部署.*计划/.test(t);
}

/** 收集依赖边（去重，children 与 parent_run_uuid 双写只连一条） */
function collectEdges(plan: Plan): { source: string; target: string; kind: "struct" | "dep" }[] {
  const ids = new Set(plan.steps.map((s) => s.run_uuid));
  const edges: { source: string; target: string; kind: "struct" | "dep" }[] = [];
  const seen = new Set<string>();
  const add = (source: string, target: string, kind: "struct" | "dep") => {
    if (!ids.has(source) || !ids.has(target)) return;
    const k = `${source}->${target}:${kind}`;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({ source, target, kind });
  };

  for (const s of plan.steps) {
    // children：父 → 子（结构边）
    (s.children ?? []).forEach((c) => add(s.run_uuid, c, "struct"));
    // parent_run_uuid：子 → 父 的反向指针，补一条父 → 子（自愈）
    if (s.parent_run_uuid) add(s.parent_run_uuid, s.run_uuid, "struct");
    // prev_task：前置 → 当前（时序虚线边）
    if (s.prev_task) add(s.prev_task, s.run_uuid, "dep");
  }
  return edges;
}

export function planToFlow(plan: Plan): { nodes: Node<StepNodeData>[]; edges: Edge[] } {
  const rawEdges = collectEdges(plan);

  // ── dagre 自动布局（自左向右 TB / LR 可切换，这里用 LR 更贴合"流水线"观感）
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 140, marginx: 32, marginy: 32 });
  g.setDefaultEdgeLabel(() => ({}));

  plan.steps.forEach((s) => g.setNode(s.run_uuid, { width: NODE_W, height: NODE_H }));
  rawEdges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);

  const nodes: Node<StepNodeData>[] = plan.steps.map((s) => {
    const p = g.node(s.run_uuid) ?? { x: 0, y: 0 };
    return {
      id: s.run_uuid,
      type: "step",
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      data: {
        step: s,
        status: (s.status ?? "pending") as RunStatus,
        isHierarchy: isHierarchyStep(s),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      width: NODE_W,
      height: NODE_H,
    };
  });

  const edges: Edge[] = rawEdges.map((e, i) => {
    const isDep = e.kind === "dep";
    return {
      id: `e-${i}-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      sourceHandle: isDep ? "next-out" : "struct-out",
      targetHandle: isDep ? "next-in" : "struct-in",
      type: "smoothstep",
      animated: false,
      data: { kind: e.kind },
      // 时序边（先后）＝深灰虚线，横向；父子边（包含）＝border-strong 实线，纵向。
      // 之前父子边用的是 --border（≈ 画布色，1.2:1）导致完全隐形，这里必须提到 border-strong。
      style: isDep
        ? { stroke: "hsl(var(--muted-foreground))", strokeDasharray: "7 5", strokeWidth: 2.5, opacity: 1 }
        : { stroke: "hsl(var(--muted-foreground) / 0.6)", strokeWidth: 2, opacity: 1 },
      markerEnd: { type: MarkerType.ArrowClosed, width: isDep ? 16 : 12, height: isDep ? 16 : 12 },
    };
  });

  return { nodes, edges };
}

export const STATUS_COLOR: Record<RunStatus, { dot: string; ring: string; text: string }> = {
  draft: { dot: "bg-slate-400", ring: "border-slate-300 dark:border-slate-600", text: "text-slate-500" },
  pending: { dot: "bg-slate-400", ring: "border-slate-300 dark:border-slate-600", text: "text-slate-500" },
  running: { dot: "bg-blue-500", ring: "border-blue-400", text: "text-blue-600 dark:text-blue-400" },
  succeeded: { dot: "bg-emerald-500", ring: "border-emerald-400", text: "text-emerald-600 dark:text-emerald-400" },
  failed: { dot: "bg-red-500", ring: "border-red-400", text: "text-red-600 dark:text-red-400" },
  cancelled: { dot: "bg-amber-500", ring: "border-amber-400", text: "text-amber-600 dark:text-amber-400" },
};
