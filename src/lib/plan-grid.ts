/**
 * 自适应网格布局 —— 计划流程图「一屏撑满」的算法**单一实现**
 * ──────────────────────────────────────────────────────────────
 * 2026-10-30 由研究原型 `plan-flow-fit/grid.ts` 提升而来（PM 决策：生产页与实验页共用一份，
 * 避免两份漂移）。生产页 `/plan-flow` 与实验页 `/plan-flow-fit` 都 import 本文件。
 *
 * ★ 参数口径（2026-10-30 定稿，改前先问）：
 *   列间距 48 / 行间距 36 / 卡片尺寸 240×92 不变；
 *   展开列内部「父→子」偏移仍是 300（那是卡内关系，不是列间距）。
 *
 * 输入：React Flow 节点（已带 dagre/导出的原始布局坐标）+ 容器尺寸
 * 输出：把「列」重新分行为网格后的节点坐标 + 指标（zoom / 正文 px / 填充率）
 *
 * ── 三个定义（研究结论，改前先读）─────────────────────────────
 * 1. **列** = 必须纵向堆叠在一起的一组节点（主链节点 + 其子任务）。
 *    网格算法排的是「列」，不是「单个节点」——子卡与父卡的相对位置必须保持。
 * 2. **zoom 口径**：React Flow v12 的 `fitView({padding})` = `avail = size / (1+p)`。
 *    实测校验：mock 单行 1380 宽 → 1182/1.12/1380 = 0.765，与实测 0.765 一致。
 *    用 `size*(1-2p)` 会差 22%，据此算出的"提升倍数"全是假的。
 * 3. **最优 = 按顺序切段**：阶段顺序不许打乱，所以只能把 0..N-1 切成若干**连续段**，
 *    每段一行。这是「切段」不是自由装箱，DP 因此可以精确求解（二分 zoom + O(N²) 最小总高）。
 */
import type { Node } from "@xyflow/react";
import type { StepNodeData } from "@/pages/cases/plan-flow/adapter";

/** fitView 的 padding 与 zoom 上限：与 /plan-flow 一致，便于横向对比 */
export const PAD = 0.12;
export const MAX_ZOOM = 1.1;
/** 可读闸：zoom ≥ 0.55 ⇒ 正文（12px 基准）≥ 6.6px */
export const READABLE_ZOOM = 0.55;
export const BODY_BASE = 12;
/** 列间净空（2026-10-30 决策：80 → 48，压间距提升 zoom） */
export const GAP_X = 48;
/** 行间净空（2026-10-30 决策：68 → 36，rowPitch 160 → 128） */
export const GAP_Y = 36;

export interface ColNode {
  id: string;
  dx: number;
  dy: number;
  w: number;
  h: number;
}
export interface Col {
  /** 代表节点 id（列内第一个节点） */
  id: string;
  w: number;
  h: number;
  nodes: ColNode[];
}
export interface Pack {
  /** 每行放哪些列（列下标，按阅读顺序） */
  rows: number[][];
  /** 理论 zoom（与 fitView 实测对照用） */
  zoom: number;
  bboxW: number;
  bboxH: number;
  rowW: number[];
  rowH: number[];
  /** 填充率 = Σ列面积 / 包围盒面积（%）*/
  fill: number;
}

const nw = (n: Node<StepNodeData>) => n.width ?? (n.data.isChild ? 200 : 240);
const nh = (n: Node<StepNodeData>) => n.height ?? 92;

/**
 * 由节点推出「列」。
 * - 有子节点（真实导出）：主链节点按执行顺序，列 = 主链 + 其 childIds
 * - 无子节点（mock/dagre 布局）：按 x 分秩（±1px 容差），列内按 y 排序
 */
export function buildColumns(nodes: Node<StepNodeData>[]): Col[] {
  if (!nodes.length) return [];
  const hasChild = nodes.some((n) => n.data.isChild);
  let groups: Node<StepNodeData>[][];

  if (hasChild) {
    const mains = nodes
      .filter((n) => !n.data.isChild)
      .sort((a, b) => a.position.x - b.position.x);
    const used = new Set<string>();
    groups = mains.map((m) => {
      used.add(m.id);
      const kids = nodes.filter((n) => (m.data.childIds ?? []).includes(n.id));
      kids.forEach((k) => used.add(k.id));
      return [m, ...kids];
    });
    for (const n of nodes) if (!used.has(n.id)) groups.push([n]);
  } else {
    const byX = new Map<number, Node<StepNodeData>[]>();
    for (const n of nodes) {
      const x = Math.round(n.position.x);
      const key = [...byX.keys()].find((k) => Math.abs(k - x) <= 1) ?? x;
      if (!byX.has(key)) byX.set(key, []);
      byX.get(key)!.push(n);
    }
    groups = [...byX.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => [...v].sort((a, b) => a.position.y - b.position.y));
  }

  return groups.map((g) => {
    const minX = Math.min(...g.map((n) => n.position.x));
    const minY = Math.min(...g.map((n) => n.position.y));
    const maxX = Math.max(...g.map((n) => n.position.x + nw(n)));
    const maxY = Math.max(...g.map((n) => n.position.y + nh(n)));
    return {
      id: g[0].id,
      w: Math.round(maxX - minX),
      h: Math.round(maxY - minY),
      nodes: g.map((n) => ({
        id: n.id,
        dx: n.position.x - minX,
        dy: n.position.y - minY,
        w: nw(n),
        h: nh(n),
      })),
    };
  });
}

export interface Container {
  w: number;
  h: number;
}

/** 评估一个切分 → 布局指标（与 fitView 的算法同构） */
export function evalSplit(cols: Col[], rows: number[][], c: Container, gapX = GAP_X, gapY = GAP_Y): Pack {
  const availW = c.w / (1 + PAD);
  const availH = c.h / (1 + PAD);
  const rowW = rows.map((r) => r.reduce((s, i) => s + cols[i].w, 0) + gapX * Math.max(0, r.length - 1));
  const rowH = rows.map((r) => Math.max(...r.map((i) => cols[i].h)));
  const bboxW = Math.max(...rowW);
  const bboxH = rowH.reduce((a, b) => a + b, 0) + gapY * Math.max(0, rows.length - 1);
  const zoom = Math.min(availW / bboxW, availH / bboxH, MAX_ZOOM);
  const colArea = cols.reduce((s, x) => s + x.w * x.h, 0);
  return {
    rows,
    zoom: Math.round(zoom * 1000) / 1000,
    bboxW: Math.round(bboxW),
    bboxH: Math.round(bboxH),
    rowW,
    rowH,
    fill: Math.round((colArea / (bboxW * bboxH)) * 1000) / 10,
  };
}

/** 精确最优：二分 zoom + O(N²)「最小总高」DP。N > 60 自动退化均分贪心。 */
export function optimalSplit(cols: Col[], c: Container, gapX = GAP_X, gapY = GAP_Y): Pack {
  const n = cols.length;
  if (n <= 1) return evalSplit(cols, [cols.map((_, i) => i)], c, gapX, gapY);
  if (n > 60) return uniformSplit(cols, c, gapX, gapY);

  const availW = c.w / (1 + PAD);
  const availH = c.h / (1 + PAD);
  const feasible = (Z: number): number[][] | null => {
    const capW = availW / Z;
    const capH = availH / Z;
    const INF = Number.POSITIVE_INFINITY;
    const dp = new Array(n + 1).fill(INF);
    const pre = new Array(n + 1).fill(-1);
    dp[0] = 0;
    for (let i = 1; i <= n; i++) {
      let w = 0;
      let h = 0;
      for (let j = i; j >= 1; j--) {
        w = w === 0 ? cols[j - 1].w : w + gapX + cols[j - 1].w;
        if (w > capW) break;
        h = Math.max(h, cols[j - 1].h);
        if (dp[j - 1] === INF) continue;
        const cand = dp[j - 1] + (j - 1 > 0 ? gapY : 0) + h;
        if (cand <= capH && cand < dp[i]) {
          dp[i] = cand;
          pre[i] = j - 1;
        }
      }
    }
    if (dp[n] === INF) return null;
    const rows: number[][] = [];
    let i = n;
    while (i > 0) {
      const j = pre[i];
      rows.unshift(Array.from({ length: i - j }, (_, k) => j + k));
      i = j;
    }
    return rows;
  };

  let lo = 0.02;
  let hi = MAX_ZOOM;
  let best: number[][] | null = null;
  for (let it = 0; it < 50; it++) {
    const mid = (lo + hi) / 2;
    const r = feasible(mid);
    if (r) {
      best = r;
      lo = mid;
    } else hi = mid;
  }
  return evalSplit(cols, best ?? [cols.map((_, i) => i)], c, gapX, gapY);
}

/** 贪心/均分：枚举行数 k，各行列数尽量相等，取代价最小者（= 维护者表格里的 4×5 那类方案） */
export function uniformSplit(cols: Col[], c: Container, gapX = GAP_X, gapY = GAP_Y): Pack {
  const n = cols.length;
  let best: Pack | null = null;
  for (let k = 1; k <= n; k++) {
    const base = Math.floor(n / k);
    const extra = n % k;
    const rows: number[][] = [];
    let p = 0;
    for (let r = 0; r < k; r++) {
      const len = base + (r < extra ? 1 : 0);
      rows.push(Array.from({ length: len }, (_, i) => p + i));
      p += len;
    }
    const ev = evalSplit(cols, rows, c, gapX, gapY);
    if (!best || ev.zoom > best.zoom + 1e-9) best = ev;
  }
  return best!;
}

/** 手动列数：每行固定 N 列（最后一行可能不满） */
export function manualSplit(cols: Col[], c: Container, perRow: number, gapX = GAP_X, gapY = GAP_Y): Pack {
  const rows: number[][] = [];
  for (let i = 0; i < cols.length; i += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, cols.length - i) }, (_, k) => i + k));
  }
  return evalSplit(cols, rows, c, gapX, gapY);
}

export type WrapMode = "left" | "snake";

/** 按切分把列摆进网格：返回每列的左上角坐标（flow 坐标） */
export function placeColumns(
  cols: Col[],
  pack: Pack,
  mode: WrapMode,
  gapX = GAP_X,
  gapY = GAP_Y
): Map<number, { x: number; y: number }> {
  const pos = new Map<number, { x: number; y: number }>();
  let y = 0;
  pack.rows.forEach((row, ri) => {
    const h = Math.max(...row.map((i) => cols[i].h));
    const order = mode === "snake" && ri % 2 === 1 ? [...row].reverse() : row;
    let x = 0;
    for (const i of order) {
      pos.set(i, { x, y });
      x += cols[i].w + gapX;
    }
    y += h + gapY;
  });
  return pos;
}

/**
 * 换行后的「边可读性」统计（dep 边 = 相邻列之间的时序边）。
 * 端点口径：主链卡右中 → 下一列主链卡左中（主链卡统一 240×92）。
 */
export function edgeStats(cols: Col[], pack: Pack, mode: WrapMode, gapX = GAP_X, gapY = GAP_Y) {
  const pos = placeColumns(cols, pack, mode, gapX, gapY);
  const Z = pack.zoom;
  const items = [];
  for (let i = 0; i + 1 < cols.length; i++) {
    const a = pos.get(i)!;
    const b = pos.get(i + 1)!;
    const ax = a.x + 240;
    const ay = a.y + 46;
    const bx = b.x;
    const by = b.y + 46;
    const dx = bx - ax;
    const dy = by - ay;
    items.push({ dx: Math.round(dx), dy: Math.round(dy), len: Math.round(Math.hypot(dx, dy)) });
  }
  const screen = items.map((e) => e.len * Z);
  return {
    count: items.length,
    totalPx: Math.round(screen.reduce((a, b) => a + b, 0)),
    maxPx: items.length ? Math.round(Math.max(...screen)) : 0,
    crossRow: items.filter((e) => Math.abs(e.dy) > 1).length,
    backward: items.filter((e) => e.dx < 0).length,
  };
}


/**
 * 一步到位：把节点按「列 → 最优网格（齐左）」重新摆好。
 * 生产页 `/plan-flow` 的折叠态换行直接用它；实验页也用它。
 *
 * 返回 `positions`（nodeId → 新坐标）与 `pack`（行切分 + zoom 指标）。
 * 列内相对位置刚性保留（`newOrigin + 列内偏移`），不动父子卡的 300px 关系。
 */
export function layoutGrid(
  nodes: Node<StepNodeData>[],
  c: Container,
  opts?: { mode?: WrapMode; gapX?: number; gapY?: number; perRow?: number | null }
): { positions: Map<string, { x: number; y: number }>; pack: Pack; cols: Col[] } | null {
  if (!nodes.length || !c.w || !c.h) return null;
  const gapX = opts?.gapX ?? GAP_X;
  const gapY = opts?.gapY ?? GAP_Y;
  const cols = buildColumns(nodes);
  const pack =
    opts?.perRow && opts.perRow > 0
      ? manualSplit(cols, c, opts.perRow, gapX, gapY)
      : optimalSplit(cols, c, gapX, gapY);
  const origin = placeColumns(cols, pack, opts?.mode ?? "left", gapX, gapY);
  const positions = new Map<string, { x: number; y: number }>();
  cols.forEach((col, i) => {
    const o = origin.get(i);
    if (!o) return;
    for (const n of col.nodes) positions.set(n.id, { x: o.x + n.dx, y: o.y + n.dy });
  });
  return { positions, pack, cols };
}
