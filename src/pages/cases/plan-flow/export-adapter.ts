/**
 * 真实计划导出（plan_exports/*.graph.json）适配器
 * ──────────────────────────────────────────────────────────────
 * 数据来源：agentgeex_agent 的 plan 导出工具产物，含：
 *   graph.json { plan_id, project_id, activate_mode, mode, chapter,
 *                n_top_steps, n_nodes_expanded, nodes[], edges[] }
 *   node { run_uuid, task_id, agent_id, plan_section, depth,
 *          parent_run_uuid, prev_task, next_task, children[], n_children }
 *   edge { from, to, type: "children" | "next" | "prev" }
 *
 * ⚠️ 导出不带 run_status（真实运行态需另接 ao_task_execution）。
 *
 * ── 布局：主链分列 + 子任务同列下挂（2026-10-27 重写）──────────
 * 旧版按「阶段名正则」分列，有三个致命后果：
 *   1. 阶段名表漏了「审校入口 / 试读入口 / 修订入口」→ indexOf 返回 -1
 *      → 排序时当 99 处理 → 父节点被甩到图最右端（实测距其子节点 2580px），
 *      父子边从右往左画，逆阅读方向；
 *   2. R1/R2/R3 三轮共用同一阶段名 → 被压进同一列，36 个节点垂直堆叠 4608px；
 *   3. 父子边复用了时序边的低阶色（--border），对比度仅 1.22:1，肉眼看不见。
 *
 * 新版改为按「真实执行顺序」布局，并把两类关系在空间上正交化：
 *   主链（next_task 链）→ 横向分列，父节点逐列右移（时序 = 水平向右）
 *   子任务（children）  → 与父同列、纵向依次下挂（包含 = 垂直向下）
 * 于是「先后」与「包含」不再挤在同一个平面上，一眼可分。
 */
import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import type { RunStatus } from "./mock";
import type { StepNodeData } from "./adapter";

export interface ExportNode {
  run_uuid: string;
  task_id?: string;
  agent_id: string;
  plan_section?: string | null;
  depth: number;
  parent_run_uuid?: string;
  prev_task?: string;
  next_task?: string;
  children?: string[];
  n_children?: number;
}
export interface ExportEdge { from: string; to: string; type: "children" | "next" | "prev"; }
export interface ExportGraph {
  plan_id: string;
  project_id: string;
  activate_mode?: string;
  mode?: string;
  chapter?: string;
  n_top_steps: number;
  n_nodes_expanded: number;
  nodes: ExportNode[];
  edges: ExportEdge[];
}

const NODE_W = 240;
const CHILD_W = 200;  // 子任务卡更窄 — 视觉从属（父 240 / 子 200）
const NODE_H = 92;
const COL_GAP = 360;   // 无子节点时的主链列间距（节点 240 + 净空 120）
const ROW_GAP = 132;   // 列内纵向间距（节点 92 + 净空 40）
/** 子任务相对父的横向偏移。
 *  ★ 不能太小：若父与子 x 相近，12 条父子边会几乎垂直重合，
 *    视觉上被误读成「子1→子2→子3」的串行链，而它们实际是并行兄弟。
 *    300px 的偏移能让 12 条边扇形散开，一眼看出「扇出」。 */
const CHILD_DX = 300;

/* ── 名称 ─────────────────────────────────────────────────── */

/** run_uuid → 中文阶段名 */
const PHASE_LABEL: { re: RegExp; label: string }[] = [
  { re: /^run_quality_write_/, label: "写作" },
  { re: /^run_w_/, label: "写作" },
  { re: /^run_review_r\d+_entry/, label: "审校" },
  { re: /^run_review_r\d+_/, label: "审校" },
  { re: /^run_integrate_r\d+/, label: "整合" },
  { re: /^run_revise_r\d+_entry/, label: "修订" },
  { re: /^run_revise_r\d+_/, label: "修订" },
  { re: /^run_beta_r\d+_entry/, label: "试读" },
  { re: /^run_beta_r\d+_/, label: "试读" },
  { re: /^run_quality_judge/, label: "质检" },
  { re: /^run_merge/, label: "合并成书" },
];

function phaseOf(uuid: string): string {
  for (const p of PHASE_LABEL) if (p.re.test(uuid)) return p.label;
  return "步骤";
}

/** 从 run_uuid 提取可读短标（轮次 / 节号） */
function shortId(uuid: string): string {
  const round = /_r(\d+)_/.exec(uuid);
  const sect = /_s(\d+)(?:_|$)/.exec(uuid);
  if (sect) return `节 ${Number(sect[1])}`;
  if (round) return `第 ${round[1]} 轮`;
  if (/merge/.test(uuid)) return "成书";
  return "";
}

/** agent_id → 中文角色 */
const AGENT_LABEL: { re: RegExp; label: string }[] = [
  { re: /planner/, label: "规划者" },
  { re: /writer/, label: "写作者" },
  { re: /reviewer/, label: "审校者" },
  { re: /beta_reader/, label: "试读者" },
];
function agentLabel(id: string): string {
  for (const a of AGENT_LABEL) if (a.re.test(id)) return `${a.label}(${id.replace(/^book_/, "").slice(0, 8)})`;
  return id;
}

/**
 * 推断"演示运行态"：导出无状态，按拓扑语义给一个合理的可视化态。
 * 仅用于演示，不代表真实运行结果；真实接入时用 ao_task_execution.run_status 覆盖。
 */
function inferStatus(n: ExportNode): RunStatus {
  const uuid = n.run_uuid;
  if (/merge/.test(uuid)) return "pending";
  if (/integrate_r3/.test(uuid)) return "running";
  if (/_s07_/.test(uuid) && /review/.test(uuid)) return "failed";
  return "succeeded";
}

/* ── 布局：主链分列 + 子任务下挂 ────────────────────────── */

interface LayoutResult {
  pos: Map<string, { x: number; y: number }>;
  /** 每个节点在它所在主链上的列号（0 起） */
  colOf: Map<string, number>;
}

/**
 * 找主链：从「既无 prev_task 又无 parent_run_uuid」的根出发，沿 next_task 一路走。
 * 对书籍管线就是 17 步主干（写作 → 审校R1 → 整合R1 → 修订R1 → 试读R1 → 质检R1 → … → 合并）。
 */
function layoutByChain(g: ExportGraph): LayoutResult {
  const byId = new Map(g.nodes.map((n) => [n.run_uuid, n]));
  const pos = new Map<string, { x: number; y: number }>();
  const colOf = new Map<string, number>();
  let chainStartX = 0;

  // 1. 抽取所有主链（多数情况只有一条）
  const starts = g.nodes.filter((n) => !n.prev_task && !n.parent_run_uuid);
  const chains: string[][] = [];
  const claimed = new Set<string>();

  for (const s of starts) {
    if (claimed.has(s.run_uuid)) continue;
    const chain: string[] = [];
    const guard = new Set<string>();
    let cur: ExportNode | undefined = s;
    while (cur && !guard.has(cur.run_uuid)) {
      guard.add(cur.run_uuid);
      chain.push(cur.run_uuid);
      claimed.add(cur.run_uuid);
      cur = cur.next_task ? byId.get(cur.next_task) : undefined;
    }
    if (chain.length) chains.push(chain);
  }

  // 2. 兜底：既不在主链、也不是别人子任务的孤立节点，各占一列追加到末尾
  const orphan = g.nodes
    .filter((n) => !claimed.has(n.run_uuid) && !(n.parent_run_uuid && byId.has(n.parent_run_uuid)))
    .map((n) => n.run_uuid);
  if (orphan.length) chains.push(orphan);

  // 3. 逐链铺列：主链节点在 y=0（顶部主行道），子任务在父右侧一列纵向排开。
  //    于是「主干横向走、子任务挂在下面」成为一个恒定结构：
  //    主链永远是一条平直的水平行，子任务像挂在它下方的批。
  for (const chain of chains) {
    let cursorX = chainStartX;
    for (const id of chain) {
      const n = byId.get(id);
      if (!n) continue;
      const col = colOf.size;
      pos.set(id, { x: cursorX, y: 0 });
      colOf.set(id, col);

      const kids = (n.children ?? []).filter((c) => byId.has(c) && !pos.has(c));
      if (kids.length) {
        const childX = cursorX + CHILD_DX;
        kids.forEach((k, ki) => {
          pos.set(k, { x: childX, y: (ki + 1) * ROW_GAP });
          colOf.set(k, col);
        });
        cursorX = childX + CHILD_W + 100;    // 660
      } else {
        cursorX = cursorX + NODE_W + 80;     // 320
      }
    }
    chainStartX = cursorX + 120;             // 链间留白
  }

  // 4. 完全没落位的节点（环 / 数据不一致），按顺序兜底排到最后
  let fallbackRow = 0;
  for (const n of g.nodes) {
    if (!pos.has(n.run_uuid)) {
      pos.set(n.run_uuid, { x: chainStartX, y: (fallbackRow + 1) * ROW_GAP });
      fallbackRow += 1;
    }
  }

  return { pos, colOf };
}

/* ── 主入口 ───────────────────────────────────────────────── */

export function exportToFlow(
  g: ExportGraph,
  instructionMap: Record<string, string> = {}
): { nodes: Node<StepNodeData>[]; edges: Edge[] } {
  const byId = new Map(g.nodes.map((n) => [n.run_uuid, n]));
  const { pos } = layoutByChain(g);

  const childSet = new Set<string>();
  for (const n of g.nodes) for (const c of n.children ?? []) childSet.add(c);

  const nodes: Node<StepNodeData>[] = g.nodes.map((n) => {
    const p = pos.get(n.run_uuid) ?? { x: 0, y: 0 };
    const status = inferStatus(n);
    const childCount = n.children?.length ?? n.n_children ?? 0;
    const isChild = childSet.has(n.run_uuid);

    // 父节点：阶段名 + 轮次（短、可区分）。子节点：只显示「节 N」
    const head = phaseOf(n.run_uuid);
    const sub = shortId(n.run_uuid);
    const label = childCount > 0 ? head : sub ? `${head} · ${sub}` : head;

    return {
      id: n.run_uuid,
      type: "step",
      position: { x: p.x, y: p.y },
      data: {
        step: {
          run_uuid: n.run_uuid,
          task_id: n.task_id,
          agent_id: agentLabel(n.agent_id),
          instruction: instructionMap[n.run_uuid] ?? "",
          status,
          label,
        },
        status,
        // ★ 层级判定改用真实 children 数量，不再靠正则猜 task_id
        isHierarchy: childCount > 0,
        childCount,
        childIds: childCount > 0 ? [...(n.children ?? [])] : undefined,
        isChild,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      width: isChild ? CHILD_W : NODE_W,
      height: NODE_H,
    };
  });

  const edges: Edge[] = g.edges
    .filter((e) => byId.has(e.from) && byId.has(e.to))
    .map((e, i) => {
      const isStruct = e.type === "children";
      return {
        id: `ee-${i}-${e.from}-${e.to}-${e.type}`,
        source: e.from,
        target: e.to,
        // ★ 空间正交：父子边走「下→上」通道，时序边走「右→左」通道，
        //   两类关系在物理方向上就分开，不再靠颜色猜。
        sourceHandle: isStruct ? "struct-out" : "next-out",
        targetHandle: isStruct ? "struct-in" : "next-in",
        // 父子边用正交折线：12 条边共用父节点下方一段「总线」，再各自横向分叉，
        // 视觉上就是标准的树状连接（└─），比直斜线更能一眼看出「这些都属于它」。
        type: "smoothstep",
        pathOptions: isStruct ? { borderRadius: 10, offset: 16 } : undefined,
        data: { kind: isStruct ? "struct" : "dep" },
        // ★ 父子边必须可见：--border 与画布同色（1.22:1）等于没画，
        //   改用 --border-strong。父子边要弱于时序边（它是"归属提示"不是"主流程"）。
        style: isStruct
          ? { stroke: "hsl(var(--muted-foreground) / 0.6)", strokeWidth: 1.5, opacity: 1 }
          : { stroke: "hsl(var(--muted-foreground))", strokeDasharray: "7 5", strokeWidth: 2.5, opacity: 1 },
        markerEnd: isStruct
          ? undefined
          : { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      } as Edge;
    });

  return { nodes, edges };
}
