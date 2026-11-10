/**
 * 演示执行播放器（Playback）
 * ──────────────────────────────────────────────────────────────
 * 目的：真实导出不含 run_status，用一个"模拟执行器"让流程图跑起来，
 *       从而可视化「当前执行到哪一步 / 路径流转 / 自动追踪居中」。
 *
 * 语义：
 *   - 执行顺序 = 拓扑序（先 children 扇出、再沿 next 串行推进），与 plan 的
 *     activate_mode=chain 的推进语义一致。
 *   - done：已执行完的节点集合（不再变）
 *   - current：当前正在执行的节点（唯一）
 *   - 每 tick 前进一步；可选「跟随自动演示」
 *
 * 真实接入：当 ao_task_execution.run_status 可用时，直接用它驱动
 *           done/current，无需本播放器（接口对齐即可）。
 */
import * as React from "react";
import type { Edge, Node } from "@xyflow/react";

/** 计算拓扑执行顺序：从根（无入边）出发，BFS；同层按 children→next 优先 */
export function computeExecutionOrder(nodes: Node[], edges: Edge[]): string[] {
  const ids = new Set(nodes.map((n) => n.id));
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  nodes.forEach((n) => { adj.set(n.id, []); indeg.set(n.id, 0); });
  for (const e of edges) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    adj.get(e.source)!.push(e.target);
    indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1);
  }
  // 起点：入度为 0；若成环则兜底取第一个
  const queue = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  if (queue.length === 0 && nodes[0]) queue.push(nodes[0].id);
  const order: string[] = [];
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const nx of adj.get(id) ?? []) {
      indeg.set(nx, (indeg.get(nx) ?? 1) - 1);
      if (!seen.has(nx)) queue.push(nx);
    }
  }
  // 兜底：未被覆盖的节点（环内）追加
  nodes.forEach((n) => { if (!seen.has(n.id)) order.push(n.id); });
  return order;
}

export interface PlaybackState {
  /** 当前执行节点 id */
  current: string | null;
  /** 已执行完节点集合 */
  done: Set<string>;
  /** 正在走的边 id 集合（current 的入边） */
  activeEdges: Set<string>;
  /** 已走过的边 id 集合（done 关联的边） */
  flowedEdges: Set<string>;
}

/**
 * 播放器 Hook
 * @param order 执行顺序（节点 id 数组）
 * @param edges 边集合（用于算 activeEdges/flowedEdges）
 * @param playing 是否播放
 * @param speedMs 每步间隔
 */
export function usePlayback(
  order: string[],
  edges: Edge[],
  playing: boolean,
  speedMs = 700,
  /** 重置信号：仅当「换了一张图」时变化（折叠展开不算，否则每次折叠播放都跳回开头） */
  resetKey?: string
): { state: PlaybackState; idx: number; total: number; reset: () => void; stepTo: (i: number) => void } {
  const [idx, setIdx] = React.useState(0);

  // 换图时重置；折叠/展开不重置（否则用户折一下就把进度清零了）
  const key = resetKey ?? String(order.length);
  React.useEffect(() => { setIdx(0); }, [key]);

  React.useEffect(() => {
    if (!playing || order.length === 0) return;
    const t = setInterval(() => {
      setIdx((i) => (i >= order.length ? i : i + 1));
    }, speedMs);
    return () => clearInterval(t);
  }, [playing, order, speedMs]);

  const state = React.useMemo<PlaybackState>(() => {
    const done = new Set<string>();
    for (let i = 0; i < Math.min(idx, order.length); i++) done.add(order[i]);
    const current = idx < order.length ? order[idx] : null;
    const activeEdges = new Set<string>();
    const flowedEdges = new Set<string>();
    const doneSet = new Set([...done, ...(current ? [current] : [])]);
    for (const e of edges) {
      if (current && e.target === current) activeEdges.add(e.id);
      if (e.target !== current && doneSet.has(e.source) && doneSet.has(e.target)) flowedEdges.add(e.id);
    }
    return { current, done, activeEdges, flowedEdges };
  }, [idx, order, edges]);

  const reset = React.useCallback(() => setIdx(0), []);
  const stepTo = React.useCallback((i: number) => setIdx(Math.max(0, Math.min(i, order.length))), [order.length]);

  return { state, idx, total: order.length, reset, stepTo };
}

/** 依据播放状态给节点/边着色（当前执行=红、已流转=绿）
 *
 * ★ 2026-10-27 两处修正：
 *   1. 染色时必须【保留原 strokeDasharray】—— 旧版写死 `strokeDasharray: undefined`，
 *      把时序虚线硬改成了实线，于是父子边与时序边在播放态下完全一样，层级信息归零。
 *   2. 父子边（data.kind === "struct"）【不参与】流转染色 —— 它表达的是归属，
 *      不是执行先后，不应该因为“走过了”而变绿。 */
export function applyPlayback<T extends Record<string, unknown>>(
  nodes: Node<T>[],
  edges: Edge[],
  st: PlaybackState
): { nodes: Node<T>[]; edges: Edge[] } {
  const n2 = nodes.map((n) => {
    const active = n.id === st.current;
    const done = st.done.has(n.id);
    return { ...n, data: { ...n.data, active, done } } as Node<T>;
  });
  const e2 = edges.map((e) => {
    const kind = (e.data as { kind?: string } | undefined)?.kind;
    if (kind === "struct") return e; // 结构边：保持原样（垂直、border-strong）

    const base = (e.style ?? {}) as React.CSSProperties;
    if (st.activeEdges.has(e.id)) {
      return {
        ...e,
        animated: true,
        style: { ...base, stroke: "#ef4444", strokeWidth: 3.5, opacity: 1 },
        markerEnd: e.markerEnd ? { ...(e.markerEnd as object), color: "#ef4444" } : e.markerEnd,
        zIndex: 10,
      } as Edge;
    }
    if (st.flowedEdges.has(e.id)) {
      return {
        ...e,
        animated: false,
        style: { ...base, stroke: "#10b981", strokeWidth: 2.5, opacity: 1 },
        markerEnd: e.markerEnd ? { ...(e.markerEnd as object), color: "#10b981" } : e.markerEnd,
      } as Edge;
    }
    return e;
  });
  return { nodes: n2, edges: e2 };
}
