/**
 * 页面案例：计划任务流程图（Plan Flow）
 * ──────────────────────────────────────────────────────────────
 * 技术栈：@xyflow/react（React Flow v12）+ @dagrejs/dagre（自动布局）
 *
 * 数据源：
 *   A. 内置演示（mock.ts）—— 覆盖 6 种拓扑的小例子
 *   B. 真实导出（plan_exports/*.graph.json）—— 真实 plan 的完整 DAG
 *
 * 四个可视化能力（2026-10-08 需求）：
 *   1. 当前执行节点高亮（红色加粗描边 + 发光 + 呼吸）
 *   2. 执行路径线染色（当前=红实线流动、已走过=绿、未走=灰）
 *   3. 点击节点弹详情（Dialog：instruction / agent / 耗时 / 上下游）
 *   4. 画布浮层显示"当前执行内容" + 自动追踪居中（大屏演示模式）
 *
 * 数据契约：见 docs/PROJECT_MANAGEMENT.md §3.2 与 export-adapter.ts 头部说明。
 * 路由：/plan-flow
 */
import * as React from "react";
import {
  ReactFlow, Background, MiniMap,
  useNodesState, useEdgesState, useReactFlow, useNodesInitialized, ReactFlowProvider, Panel,
  type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Play, Pause, RotateCcw, Crosshair, ChevronLeft, ChevronRight, FoldVertical, UnfoldVertical, Maximize2, Minimize2, ZoomIn, ZoomOut, Scan, LocateFixed, Map as MapIcon, ChevronDown } from "lucide-react";
import { ContentFrame } from "@/components/ui/content-frame";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PLAN_PRESETS, STATUS_LABEL, type RunStatus, type Plan, type PlanStep } from "./plan-flow/mock";
import { planToFlow, STATUS_COLOR, type StepNodeData } from "./plan-flow/adapter";
import { getDataVersion } from "@/lib/page-refresh-data";
import { exportToFlow, type ExportGraph } from "./plan-flow/export-adapter";
import { StepNode } from "./plan-flow/step-node";
import { computeExecutionOrder, usePlayback, applyPlayback } from "./plan-flow/playback";
// 自适应网格算法（与实验页 /plan-flow-fit 共用同一份实现，别在本页另写一套）
import { buildColumns, optimalSplit, placeColumns, GAP_X, GAP_Y, READABLE_ZOOM, type Container, type Pack } from "@/lib/plan-grid";

const nodeTypes = { step: StepNode };
const LEGEND: RunStatus[] = ["pending", "running", "succeeded", "failed", "cancelled"];

const REAL_PLANS = [
  { key: "plan_119dfdc4ce44", name: "书籍创作 · 137 步", file: "/plan_exports/plan_119dfdc4ce44.graph.json", steps: "/plan_exports/plan_119dfdc4ce44.steps_json.json" },
  { key: "plan_4c2187220435", name: "书籍创作 · 47 步", file: "/plan_exports/plan_4c2187220435.graph.json", steps: "/plan_exports/plan_4c2187220435.steps_json.json" },
];

type Source = { kind: "mock"; idx: number } | { kind: "real"; idx: number };

export default function PlanFlowCase() {
  return (
    <ReactFlowProvider>
      <PlanFlowInner />
    </ReactFlowProvider>
  );
}

function PlanFlowInner() {
  const { fitView, setViewport, getZoom, getViewport, getNode, zoomIn, zoomOut } = useReactFlow();
  const rootRef = React.useRef<HTMLDivElement>(null);
  // 全屏演示模式：先尝试浏览器原生全屏（隐藏地址栏，适合投屏），失败则降级为 CSS 覆盖层
  const [fs, setFs] = React.useState(false);
  const [source, setSource] = React.useState<Source>({ kind: "real", idx: 0 });
  const [realGraph, setRealGraph] = React.useState<ExportGraph | null>(null);
  // realGraph 属于哪个数据源：不加这个，切源瞬间会用**上一份** realGraph 重算布局
  // （137→47 的既有 bug 真正根因：拿到 137 的图 + 47 的 key，先折了 137 的父 id）。
  const [realGraphKey, setRealGraphKey] = React.useState("");
  const [instructionMap, setInstructionMap] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // 基础图（布局后，不含播放态）
  const [baseNodes, setBaseNodes] = React.useState<Node<StepNodeData>[]>([]);
  // baseNodes 当前属于哪个数据源（`kind:idx`）。自动折叠必须等它对齐再判 ——
  // 否则切源瞬间还在用上一份图的 baseNodes 算 zoom（137→47 的老 bug 就出在这）。
  const [graphKey, setGraphKey] = React.useState("");
  const [baseEdges, setBaseEdges] = React.useState<Edge[]>([]);

  // 播放器
  // ★ 默认不自动播放（2026-10-28）：原来一进页面就开跑，每步都把视口居中到当前节点，
  //   刚 fitView 好的全局视图立刻被拽走 —— 页面永远"构图不定"，怎么调都觉得乱。
  //   现在进来先给一张稳定的全局图，要看演示自己点「播放」。
  const [playing, setPlaying] = React.useState(false);
  const [speedMs, setSpeedMs] = React.useState(3000);
  const [follow, setFollow] = React.useState(true); // 自动追踪居中
  const [detail, setDetail] = React.useState<PlanStep | null>(null);

  // 折叠：存「已折叠的父节点 id」。默认空集合 = 全部展开（维护者 2026-10-27 明确要求）
  // ★ 2026-10-30：状态改名为 raw，对外只暴露「派生后的 collapsed」——
  //   派生时丢弃不属于当前图的 id。这样「137→47 切源残留旧父 id」不再是状态竞态，
  //   而是**读时过滤**：残留 id 不可能让按钮显示"全部展开"却一个节点都没隐藏。
  const [collapsedRaw, setCollapsedRaw] = React.useState<Set<string>>(new Set());
  // hover 追踪：密集图里 12 条父子边互相交叠，光看线分不出谁连谁。
  // 鼠标停在任一点上 → 高亮它的直连边与对端节点，其余淡化。
  const [hovered, setHovered] = React.useState<string | null>(null);

  // ── P0-1（2026-10-29）小图可读化状态 ────────────────────────────
  // 缩略图默认收起：展开态 160×110 的小地图在 1182×622 画布上压住 3 个节点
  const [miniMapOpen, setMiniMapOpen] = React.useState(false);
  // A6：折叠态信息条默认只占一行，「详情」按需展开全卡（全卡会盖住首列节点）
  const [infoOpen, setInfoOpen] = React.useState(false);
  // 「正在执行」载荷卡：展开态默认不挂载，只在播放中或鼠标停在工具栏徽标上时出现
  const [loadHover, setLoadHover] = React.useState(false);
  // 真实尺度：当前视野内节点数 + 缩放比（现算，不写死）
  const [viewInfo, setViewInfo] = React.useState({ visible: 0, zoom: 1 });

  // ── 画布尺寸（实测，不估算）──────────────────────────────────
  // 网格分行必须知道真实可用空间：窄屏要自动改行数，全屏演示要重算。
  // 用 ResizeObserver 跟 `.react-flow` 走，别用 clientWidth 一次性读（切全屏就不准了）。
  const [canvas, setCanvas] = React.useState<Container>({ w: 0, h: 0 });
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const read = () => {
      const rf = el.querySelector(".react-flow") as HTMLElement | null;
      if (!rf) return;
      const next = { w: rf.clientWidth, h: rf.clientHeight };
      setCanvas((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    const t = window.setTimeout(read, 300); // 首帧 .react-flow 可能还没挂上
    return () => { ro.disconnect(); window.clearTimeout(t); };
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    if (!fs) {
      setFs(true);
      try {
        await rootRef.current?.requestFullscreen?.();
      } catch {
        /* 浏览器拒绝（无手势/Safari 限制）→ 靠 CSS 覆盖层兜底 */
      }
    } else {
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch { /* ignore */ }
      }
      setFs(false);
    }
  }, [fs]);

  // 用户按 ESC 退出原生全屏 → 同步关掉覆盖层
  React.useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFs(false); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // CSS 覆盖层模式下 ESC 退出
  React.useEffect(() => {
    if (!fs) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFs(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fs]);

  // 全局「刷新」：本页由 RefreshableRoutes 重挂来重取 JSON（与其它页同一套机制）。
  // 不加 usePageRefreshed 订阅 —— 重挂已经会触发下面的 effect，
  // 再订阅一次 = 同一次刷新打两遍请求（实测 plan_exports +4 而不是 +2）。
  // 只有「绝对不能重挂」的页（会丢图表/画布内部状态）才用 usePageRefreshed 替代。

  // 载入真实图（graph.json 结构 + steps_json.json 指令全文）
  React.useEffect(() => {
    if (source.kind !== "real") return;
    const meta = REAL_PLANS[source.idx];
    // v = 刷新穿透号：不加的话第二次 fetch 直接吃 HTTP 缓存，数据其实没重取
    const bust = `?v=${getDataVersion()}`;
    setLoading(true);
    setErr(null);
    Promise.all([
      fetch(meta.file + bust).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      fetch(meta.steps + bust).then((r) => (r.ok ? r.json() : { steps: [] })).catch(() => ({ steps: [] })),
    ])
      .then(([g, s]: [ExportGraph, { steps?: { run_uuid: string; instruction?: string }[] }]) => {
        setRealGraph(g);
        setRealGraphKey(`real:${source.idx}`);
        const m: Record<string, string> = {};
        (s.steps ?? []).forEach((x) => { if (x.instruction) m[x.run_uuid] = x.instruction; });
        setInstructionMap(m);
      })
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [source]);

  // 换数据源 → 清空折叠（否则上一张图的父 id 会残留）
  React.useEffect(() => { setCollapsedRaw(new Set()); }, [source]);

  // 布局基础图
  React.useEffect(() => {
    if (source.kind === "mock") {
      const plan: Plan = PLAN_PRESETS[source.idx].plan;
      const { nodes: n, edges: e } = planToFlow(plan);
      setBaseNodes(n);
      setBaseEdges(e);
      setGraphKey(`mock:${source.idx}`);
    } else if (realGraph && realGraphKey === `real:${source.idx}`) {
      const { nodes: n, edges: e } = exportToFlow(realGraph, instructionMap);
      setBaseNodes(n);
      setBaseEdges(e);
      setGraphKey(`real:${source.idx}`);
    }
  }, [source, realGraph, realGraphKey, instructionMap]);

  // 当前图的节点 id 集合 + 派生折叠集（过滤跨源残留 id）
  const nodeIds = React.useMemo(() => new Set(baseNodes.map((n) => n.id)), [baseNodes]);
  const collapsed = React.useMemo(() => {
    if (!collapsedRaw.size) return collapsedRaw;
    let dropped = false;
    const next = new Set<string>();
    for (const id of collapsedRaw) {
      if (nodeIds.has(id)) next.add(id);
      else dropped = true;
    }
    return dropped ? next : collapsedRaw;
  }, [collapsedRaw, nodeIds]);
  const setCollapsed = setCollapsedRaw;

  // ── 折叠 → 算出要隐藏的整棵子树（含孙代，通用）──────────────────
  const hidden = React.useMemo(() => {
    const h = new Set<string>();
    const byId = new Map(baseNodes.map((n) => [n.id, n]));
    const walk = (id: string) => {
      const kids = (byId.get(id)?.data?.childIds as string[] | undefined) ?? [];
      for (const k of kids) {
        if (h.has(k)) continue;
        h.add(k);
        walk(k);
      }
    };
    collapsed.forEach(walk);
    return h;
  }, [baseNodes, collapsed]);

  const toggleCollapse = React.useCallback((id: string) => {
    setCollapsedRaw((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // 所有可折叠的父节点 id（工具栏「全部折叠」用）
  const parentIds = React.useMemo(
    () => baseNodes.filter((n) => (n.data.childIds?.length ?? 0) > 0).map((n) => n.id),
    [baseNodes]
  );


  // ── 展开态网格最优 zoom（决策 4 的唯一闸门输入）─────────────
  // 用真实列 bbox（buildColumns 现算）而不是节点数阈值：137 步与 47 步的差别不在"多少节点"，
  // 而在"这么排还看不看得清"。所有「要不要折叠 / 要不要退可读落点」都由这一个数决定。
  const expandedPack = React.useMemo<Pack | null>(() => {
    if (!baseNodes.length || !canvas.w) return null;
    return optimalSplit(buildColumns(baseNodes), canvas, GAP_X, GAP_Y);
  }, [baseNodes, canvas]);

  // 大图自动折叠（每个数据源只自动做一次）：
  //   ★ 2026-10-30 决策 4：判据从「baseNodes.length > 60」换成「展开态网格 zoom < 0.55」。
  //     · 1440 / 137 步：展开最优 0.133 < 0.55 → 折叠
  //     · 1440 / 47 步：展开最优 0.334 < 0.55 → 折叠（旧版不折，zoom 0.334 很难看）
  //     · 小 mock（4 列）：0.9+ ≥ 0.55 → 不折
  //   用户手动「全部展开」后不再干预（autoFoldKey 已置）—— 语义与旧版一致。
  const autoFoldKey = React.useRef("");
  React.useEffect(() => {
    const key = `${source.kind}:${source.idx}`;
    if (autoFoldKey.current === key) return;
    if (graphKey !== key) return;   // ★ 等 baseNodes 换成当前数据源的那一份，再判
    if (!parentIds.length) return;
    if (!expandedPack) return;      // 等画布量出来再判，别用 0 宽容器算
    autoFoldKey.current = key;
    if (expandedPack.zoom < READABLE_ZOOM) setCollapsedRaw(new Set(parentIds));
  }, [source.kind, source.idx, parentIds, expandedPack, graphKey]);

  // 把折叠态 + 回调注入节点 data（React Flow 的自定义节点只能从 data 拿外部能力）
  // 同时做一次「折叠重排」：
  //   · 折叠的父不再占子任务那一列的宽度 → 主干自动收紧（否则 17 步仍是 8120px，被压成 20px 小方块）
  //   · 全部折叠时按画布求**最优行列**（齐左换行），把阶段列铺满一屏
  //     ★ 2026-10-30 决策 1+2：列间距 80→48（pitch 320→288）、行距 68→36（rowPitch 160→128）；
  //       换行一律**齐左**，禁止蛇形（蛇形省 7% 线长，但会产生反向边 = 语义上的流程倒退）。
  //       算法不写常量：列 bbox 由 buildColumns 现算，行数由 optimalSplit 按 canvas 求。
  const visNodes = React.useMemo(() => {
    const visible = baseNodes
      .filter((n) => !hidden.has(n.id))
      .map((n) =>
        (n.data.childIds?.length ?? 0) > 0
          ? { ...n, data: { ...n.data, collapsed: collapsed.has(n.id), onToggleCollapse: toggleCollapse } }
          : n
      );

    const mainline = visible
      .filter((n) => n.position.y === 0)
      .sort((a, b) => a.position.x - b.position.x);

    const allFolded = parentIds.length > 0 && collapsed.size >= parentIds.length;

    // ── 列间距压到 48（决策 1）；展开列对外步距 = 列 bbox(500) + 48 = 548 ──
    // 注意：展开列 bbox 是「父 240 + 300 偏移 + 子 200」= 500，不是 300+240。
    // 子卡实测宽 200（step-node.tsx: isChild ? w-[200px]），所以对外步距 548 而非 588。
    const STEP_PLAIN = 240 + GAP_X;   // 288
    const STEP_WITH_KIDS = 300 + 200 + GAP_X; // 548
    const ROW_STEP = 92 + GAP_Y;      // 128

    const newPos = new Map<string, { x: number; y: number }>();

    // 全部折叠 → 交给算法按画布求最优行列（齐左），而不是写死 PER_ROW=5 蛇形
    const grid = allFolded && canvas.w ? (() => {
      const cols = buildColumns(visible);
      const pack = optimalSplit(cols, canvas, GAP_X, GAP_Y);
      return { pack, origin: placeColumns(cols, pack, "left", GAP_X, GAP_Y) };
    })() : null;

    let cursorX = 0;

    mainline.forEach((n) => {
      const isCollapsed = collapsed.has(n.id);
      const kids = visible.filter((k) => (n.data.childIds ?? []).includes(k.id));
      const expanded = kids.length > 0 && !isCollapsed;
      const step = expanded ? STEP_WITH_KIDS : STEP_PLAIN;

      if (grid) {
        // 网格态：列下标 i 的原点由算法给；节点按列内相对偏移刚性平移
        const i = mainline.indexOf(n);
        const o = grid.origin.get(i);
        if (o) {
          const dx = o.x - n.position.x;
          const dy = o.y - n.position.y;
          newPos.set(n.id, { x: o.x, y: o.y });
          if (expanded) kids.forEach((k) => newPos.set(k.id, { x: k.position.x + dx, y: k.position.y + dy }));
          return;
        }
      }

      // 非折叠态（或算法未就绪）：保持单行横排，只把间距压到 48
      newPos.set(n.id, { x: cursorX, y: 0 });
      if (expanded) {
        kids.forEach((k) => newPos.set(k.id, { x: cursorX + 300, y: k.position.y }));
      }
      cursorX += step;
    });

    return visible.map((n) => {
      const p = newPos.get(n.id);
      return p ? { ...n, position: p } : n;
    });
  }, [baseNodes, hidden, collapsed, toggleCollapse, parentIds, canvas]);

  // 当前可见态的网格最优 zoom —— 定位策略的唯一判据（决策 4 第 2 条）：
  //   ≥ 0.55 → 整图 fitView（一屏可读）；< 0.55 → 退「可读落点」（首列 + zoom 0.8）。
  // 取代原来的 `visible > 80` 拍脑袋阈值：137 展开 0.14 / 47 展开 0.33 都 < 0.55 → 走落点；
  // 折叠态 0.80 ≥ 0.55 → 整图铺满一屏。
  const currentZoom = React.useMemo(() => {
    if (!canvas.w || !canvas.h || !visNodes.length) return 1;
    return optimalSplit(buildColumns(visNodes), canvas, GAP_X, GAP_Y).zoom;
  }, [visNodes, canvas]);

  // 主链分列：每列 = 一个主链节点 + 它的子任务。A1 可读落点 / A5 阶段聚焦 / A6 回到入口 共用。
  const columns = React.useMemo(() => {
    const mainline = visNodes
      .filter((n) => n.position.y === 0)
      .sort((a, b) => a.position.x - b.position.x);
    return mainline.map((m) => {
      const kids = visNodes.filter((k) => (m.data.childIds ?? []).includes(k.id));
      const head = (m.data.step.label ?? "").split(" · ")[0];
      // 同阶段多轮（审校 R1/R2/R3）名称会重复 → 从 run_uuid 抽出轮次做区分
      const rnd = /_r(\d+)_/.exec(m.id)?.[1];
      return { id: m.id, label: rnd ? `${head} R${rnd}` : head, ids: [m.id, ...kids.map((k) => k.id)] };
    });
  }, [visNodes]);

  // 全展开态（默认空集合 = 全部展开）
  const expandedAll = parentIds.length > 0 && collapsed.size === 0;

  // visNodes 的最新引用：定时器 / 回调里读，避免把 visNodes 塞进 effect 依赖导致每次折叠都重定视口
  const visNodesRef = React.useRef(visNodes);
  React.useEffect(() => { visNodesRef.current = visNodes; }, [visNodes]);
  const columnsRef = React.useRef(columns);
  React.useEffect(() => { columnsRef.current = columns; }, [columns]);

  /** 把一组节点框进视口。topLeft=true 时把块的左上角钉在画布左上（留 offset），否则居中。 */
  const focusNodes = React.useCallback(
    (ids: string[], zoom = 0.8, opts?: { topLeft?: boolean; offset?: { x: number; y: number } }) => {
      const el = document.querySelector(".react-flow") as HTMLElement | null;
      const vw = el?.clientWidth ?? 1200;
      const vh = el?.clientHeight ?? 800;
      const ns = visNodesRef.current.filter((n) => ids.includes(n.id));
      if (!ns.length) return;
      const minX = Math.min(...ns.map((n) => n.position.x));
      const maxX = Math.max(...ns.map((n) => n.position.x + (n.width ?? 240)));
      const minY = Math.min(...ns.map((n) => n.position.y));
      const maxY = Math.max(...ns.map((n) => n.position.y + (n.height ?? 92)));
      const ox = opts?.offset?.x ?? 24;
      const oy = opts?.offset?.y ?? 24;
      const x = opts?.topLeft ? ox - minX * zoom : vw / 2 - ((minX + maxX) / 2) * zoom;
      const y = opts?.topLeft ? oy - minY * zoom : vh / 2 - ((minY + maxY) / 2) * zoom;
      setViewport({ x, y, zoom }, { duration: 300 });
    },
    [setViewport]
  );

  /** A6：量「左上浮层底边」与「内容顶边」的屏幕像素重叠，返回需要下推的量（0 = 不用动）。
   *  fitView 只按 padding 均匀收边，它不知道画布左上角挂着浮层 —— 这是遮挡的真正根因。
   *  只在「确实重叠」且「下方仍有余量」时下推，**不动 zoom**（动 zoom 会把 0.8013 抵掉）。 */
  const avoidTopLeftOverlay = React.useCallback(() => {
    const canvasEl = document.querySelector(".react-flow") as HTMLElement | null;
    const panelEl = document.querySelector(".react-flow__panel.top.left") as HTMLElement | null;
    if (!canvasEl || !panelEl) return 0;
    const cRect = canvasEl.getBoundingClientRect();
    const pRect = panelEl.getBoundingClientRect();
    if (pRect.height <= 0) return 0;
    const ns = [...document.querySelectorAll(".react-flow__node")] as HTMLElement[];
    if (!ns.length) return 0;
    let minTop = Infinity;
    let maxBottom = -Infinity;
    for (const n of ns) {
      const r = n.getBoundingClientRect();
      if (r.top < minTop) minTop = r.top;
      if (r.bottom > maxBottom) maxBottom = r.bottom;
    }
    // needTop = 刚好不重叠的下限（0 间隙）；再加 6px 呼吸，但底部至少留 10px，别把内容顶到底边
    const needTop = Math.ceil(pRect.bottom - minTop);
    if (needTop <= 0) return 0;
    const slack = Math.floor(cRect.bottom - maxBottom); // 下方还剩多少余量可借
    if (slack < needTop) return Math.max(0, slack);     // 余量不够 → 尽力而为，不额外裁切
    return Math.max(0, Math.min(needTop + 6, Math.max(slack - 8, needTop)));
  }, []);

  // 入口列（第一列）：左上留 72px 竖向余量。实测信息条底边在画布内 y≈41.5（panel margin 15 + 条高 26.5），
  // 72 够用；若信息条改成多行需同步上调（历史注释按「高约 26px 的徽标」算，已随实测更新）
  const focusEntry = React.useCallback(() => {
    const first = columns[0];
    if (first) focusNodes(first.ids, 0.8, { topLeft: true, offset: { x: 24, y: 72 } });
  }, [columns, focusNodes]);

  /** 现算「当前视野内节点数」+ 缩放比（A2）。 */
  const updateViewInfo = React.useCallback(() => {
    const el = document.querySelector(".react-flow") as HTMLElement | null;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const visible = [...el.querySelectorAll(".react-flow__node")].filter((n) => {
      const b = n.getBoundingClientRect();
      return b.bottom > box.top && b.top < box.bottom && b.right > box.left && b.left < box.right;
    }).length;
    const zoom = getViewport().zoom;
    setViewInfo((prev) => (prev.visible === visible && Math.abs(prev.zoom - zoom) < 0.001 ? prev : { visible, zoom }));
  }, [getViewport]);

  React.useEffect(() => {
    const t = setTimeout(updateViewInfo, 900);
    return () => clearTimeout(t);
  }, [updateViewInfo, visNodes.length, collapsed.size, fs]);

  const visEdges = React.useMemo(
    () => baseEdges.filter((e) => !hidden.has(e.source) && !hidden.has(e.target)),
    [baseEdges, hidden]
  );

  // 执行顺序（拓扑，按可见图算 → 折叠掉的子树自动跳过）
  const order = React.useMemo(
    () => computeExecutionOrder(visNodes, visEdges),
    [visNodes, visEdges]
  );

  // 播放器状态。resetKey 只在「换图」时变：折叠/展开不重置进度
  const resetKey = `${source.kind}-${source.idx}-${baseNodes.length}`;
  const { state, idx, total, reset, stepTo } = usePlayback(order, visEdges, playing, speedMs, resetKey);

  // 合并播放态 → 渲染用 nodes/edges
  const view = React.useMemo(
    () => applyPlayback(visNodes, visEdges, state),
    [visNodes, visEdges, state]
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StepNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  React.useEffect(() => { setNodes(view.nodes); setEdges(view.edges); }, [view, setNodes, setEdges]);

  // 数据/折叠变化后重新定位
  // playing 用 ref 读，避免把它放进 fitView 的依赖里（每步都会重排视口）
  const playingRef = React.useRef(playing);
  React.useEffect(() => { playingRef.current = playing; }, [playing]);

  // ★ 必须等节点量完尺寸再 fitView：折叠/蛇形换行会整体换一批节点，
  //   提前 fit 用的是更换前的 bbox → 内容被顶到画布下半部、右边大量留白。
  const nodesInitialized = useNodesInitialized();
  let snapT: ReturnType<typeof setTimeout> | undefined;
  React.useEffect(() => {
    if (!nodesInitialized) return;
    // ★ 2026-11-06 根因修复：播放中禁止整图 fitView。
    //   每一步 setNodes(view.nodes) 都会换掉节点对象 → React Flow 重新量尺寸 →
    //   useNodesInitialized() 翻一次 true → 本效果重跑 → fitView() 把「跟随居中」
    //   刚做的位移立刻盖掉。实测每步 fitView 与 follow 各执行一次，视口最终停在
    //   fit 值 translate(149px,48px)，当前节点始终偏离画布中心 345×186px。
    if (playingRef.current) return;
    const t = setTimeout(() => {
      if (fs) {
        // 全屏演示是投屏看全局 → 必须整图 fit（此时可读性让位于「一眼看全」）
        fitView({ padding: 0.12, duration: 300, minZoom: 0.12, maxZoom: 1.1 });
      } else if (currentZoom < READABLE_ZOOM) {
        // ★ 2026-10-30 决策 4：判据从 `visible > 80` 换成「网格最优 zoom < 0.55（正文 < 6.6px）」。
        //   一屏装不下可读的内容时，退「可读落点」：第一列入口左上角 + zoom 0.8；看全图点「适配全图」。
        const first = columnsRef.current[0];
        if (first) focusNodes(first.ids, 0.8, { topLeft: true, offset: { x: 24, y: 72 } });
      } else {
        fitView({ padding: 0.12, duration: 300, minZoom: 0.12, maxZoom: 1.1 });
      }
      // fitView 算出的位移是小数（实测 120.208），亚像素渲染会让每次截图的抗锯齿噪点不同，
      // 视觉基线哈希永远对不上。动画结束后把位移吸附到整数，让渲染确定化。
      snapT = setTimeout(() => {
        const v = getViewport();
        const x = Math.round(v.x);
        let y = Math.round(v.y);
        // A6：先吸附整数（亚像素渲染会让视觉基线哈希不稳），再按浮层做一次最小下推。
        //      fitView 后内容顶边可能落在左上信息条底下（实测 1440 折叠态顶边 29px < 条底 41.5px）。
        const avoid = avoidTopLeftOverlay();
        if (avoid > 0) y += avoid;
        if (x !== v.x || y !== v.y) setViewport({ ...v, x, y });
      }, 380);
    }, 60);
    return () => {
      clearTimeout(t);
      clearTimeout(snapT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodesInitialized, baseNodes.length, hidden.size, fs, currentZoom]);

  // 自动追踪：每步把「当前执行节点」平滑移到画布正中
  // ★ 2026-11-06 三处修正（原实现视口始终不动，实测节点偏离中心 345×186px）：
  //   1. 尺寸读 measured：v12 量完的尺寸在 node.measured，node.width 常为 undefined；
  //      旧代码 240/92 的兜底对子任务（200×92）会横向偏 20×zoom。
  //   2. 用 getNode() 取 RF 自己的内部节点，而不是在 nodes 数组里 find ——
  //      播放态下 nodes 是每步新建的副本，位置可能与内部 store 短暂不同步。
  //   3. 位移吸附整数 + 4px 死区：亚像素位移会让渲染抖动，且节点已在中心时不应再动。
  //   时长跟速度联动（快播时动画必须短，否则永远追不上）。
  React.useEffect(() => {
    // 只在「播放中」跟随：state.current 在暂停态就已等于 order[0]，
    // 不加 playing 这一条，进页面时会先把首节点拽到中心、60ms 后又被 fitView 拉回来，
    // 首屏平白闪一下（且可能破坏视觉基线的首帧）。
    if (!follow || !playing || !state.current) return;
    const n = getNode(state.current);
    if (!n) return;
    // 尺寸优先取 DOM 实测（offsetWidth 不受 transform 缩放影响）：measured 在
    // 「刚换过节点对象」的那一帧可能还没回填，届时回落 240 常量会让子任务
    // （200 宽）横向偏 20×zoom = 16px。实测本改动前后稳态偏差都是 ≤0.3px，
    // 这条是防御未来节点尺寸变化，不是修当前可见问题。
    const nodeEl = rootRef.current?.querySelector<HTMLElement>(`.react-flow__node[data-id="${state.current}"]`);
    const W = nodeEl?.offsetWidth || n.measured?.width || n.width || 240;
    const H = nodeEl?.offsetHeight || n.measured?.height || n.height || 92;
    const z = getZoom();
    const vw = canvas.w || 1200;
    const vh = canvas.h || 800;
    const tx = Math.round(vw / 2 - (n.position.x + W / 2) * z);
    const ty = Math.round(vh / 2 - (n.position.y + H / 2) * z);
    const v = getViewport();
    if (Math.abs(v.x - tx) < 4 && Math.abs(v.y - ty) < 4) return; // 已在中心：别抖
    setViewport({ x: tx, y: ty, zoom: z }, { duration: Math.min(520, Math.max(180, speedMs * 0.55)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // playing 入依赖：点「播放」时 state.current 早在暂停态就等于 order[0]，不会"变化"，
    // 不把 playing 拉进来，第一步就永远不居中（实测播放后前两秒仍偏 345×186px）。
  }, [state.current, follow, playing, speedMs, canvas.w, canvas.h]);

  // 点击节点 → 详情
  const onNodeClick = React.useCallback((_: React.MouseEvent, n: Node<StepNodeData>) => {
    setDetail(n.data.step);
  }, []);

  // 概览统计（播放态：done/current 覆盖展示）
  const stat = React.useMemo(() => {
    const totalN = nodes.length;
    const done = nodes.filter((n) => n.data.done).length;
    const failed = nodes.filter((n) => n.data.status === "failed").length;
    return { totalN, done, failed, cur: state.current };
  }, [nodes, state.current]);

  const curReal = source.kind === "real" ? REAL_PLANS[source.idx] : null;
  const curPlan = source.kind === "mock" ? PLAN_PRESETS[source.idx].plan : null;
  const curStep = state.current ? nodes.find((n) => n.id === state.current)?.data.step : null;
  // 「正在执行」载荷卡：整卡 264×130.5 压画布左下 —— 历史注释称「折叠态与节点相交 0」，
  // 2026-11-03 用 getBoundingClientRect 复测为**假**：折叠态实测盖住首列末节点 61.2%（1440）、
  // 100%（1280），节点中心 elementFromPoint 命中的是面板 → 点不到。故折叠/展开一视同仁：
  // 未播放且未悬停 → 一行条；播放中 / 悬停工具栏徽标 → 整卡（演示时看指令正文）。
  // 图例：折叠态「一行条」与展开态复用同一份，避免两处漂移
  const legendItems = (
    <>
      {LEGEND.map((st) => (
        <span key={st} className="flex items-center gap-1">
          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_COLOR[st].dot)} />
          {STATUS_LABEL[st]}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <span className="inline-block h-0 w-3.5 border-t-[3px] border-red-500" />
        当前路径
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-0 w-3.5 border-t-2 border-emerald-500" />
        已执行路径
      </span>
    </>
  );

  const showLoadCard = !!curStep;
  // A6（2026-11-03）：不再只在展开态降级 —— 折叠态整卡 264×130.5 实测盖住首列末节点 61.2%（中心点
  // 被面板吃掉、点不到）。统一为「未播放且未悬停 → 一行」；播放中 / 悬停工具栏徽标时仍出整卡（那是用户主动要看）。
  const compactLoadCard = !playing && !loadHover;

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex flex-col",
        // 用 h-full 撑满 main 的内容区，不再用 h-[calc(100vh-8rem)] 估算
        // —— 8rem 是拍脑袋的，实际 header+tabbar+footer+padding 会超过它，
        //    多出来的高度跑到 footer 后面，浮层下半截被切掉。
        fs ? "fixed inset-0 z-modal bg-background p-4" : "h-full"
      )}
    >
      {/* 整页 = 一个白框（画布页 padding=0）：工具栏在框内顶部，横线之下是画布。
          之前工具栏在框外 → 页面成了「工具条 + 一块画布」两段式，与其它页不一致。 */}
      <ContentFrame fill padding={0}>
      {/* 工具区（框内第一分区） */}
      <div className="flex flex-col gap-2 border-b border-strong p-3">
      {/* 数据源选择 + 概览 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted-foreground">真实导出</span>
          {REAL_PLANS.map((p, i) => (
            <button
              key={p.key}
              title={i === 0 ? `${p.name}（节点最多，默认折叠到阶段级）` : p.name}
              onClick={() => setSource({ kind: "real", idx: i })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                source.kind === "real" && source.idx === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              {p.name}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          <span className="mr-1 text-xs font-semibold text-muted-foreground">演示</span>
          {PLAN_PRESETS.map((p, i) => (
            <button
              key={p.key}
              onClick={() => setSource({ kind: "mock", idx: i })}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                source.kind === "mock" && source.idx === i
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <Badge variant="outline">{stat.totalN} 步</Badge>
          {hidden.size > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              已折叠 {hidden.size} 步
            </Badge>
          )}
          <Badge variant="outline" className="text-emerald-600">完成 {stat.done}</Badge>
          {stat.failed > 0 && <Badge variant="outline" className="text-red-600">失败 {stat.failed}</Badge>}
        </div>
      </div>

      {/* 播放控制条 */}
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" className="h-8 gap-1.5" onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {playing ? "暂停" : "播放"}
        </Button>
        <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />重置
        </Button>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => stepTo(idx - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => stepTo(idx + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex min-w-[180px] flex-1 items-center gap-2">
          <Progress value={total ? (idx / total) * 100 : 0} className="h-1.5" />
          <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
            {Math.min(idx + 1, total)}/{total}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>速度</span>
          <Slider
            value={[speedMs]}
            min={500}
            max={6000}
            step={250}
            onValueChange={(v) => setSpeedMs(v[0])}
            className="w-24"
          />
          <span className="tabular-nums">{speedMs}ms</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5"
          disabled={parentIds.length === 0}
          onClick={() => setCollapsedRaw(collapsed.size ? new Set() : new Set(parentIds))}
          title={collapsed.size ? "展开全部子任务" : "折叠全部子任务（默认展开）"}
        >
          {collapsed.size ? <UnfoldVertical className="h-3.5 w-3.5" /> : <FoldVertical className="h-3.5 w-3.5" />}
          {collapsed.size ? "全部展开" : "全部折叠"}
        </Button>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Switch checked={follow} onCheckedChange={setFollow} />
          <Crosshair className="h-3.5 w-3.5" />
          自动追踪
        </label>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={toggleFullscreen}
          title={fs ? "退出全屏（ESC）" : "全屏演示（隐藏页面外壳）"}
        >
          {fs ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {fs ? "退出全屏" : "全屏"}
        </Button>

        {/* A4：视口控件搬到工具栏（原来是 React Flow 的 Controls 浮在画布右上角，
            26×104 的竖条会压住 24% 的 run_beta_r1_entry_ch10 节点） */}
        <div className="ml-1 flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5" data-testid="plan-zoom">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => zoomOut({ duration: 200 })} title="缩小">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => zoomIn({ duration: 200 })} title="放大">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-1.5 text-xs"
            onClick={() => fitView({ padding: 0.12, duration: 300, minZoom: 0.12, maxZoom: 1.1 })}
            title="适配全图（137 节点时必然缩小到不可读，仅看结构）"
          >
            <Scan className="h-3.5 w-3.5" />适配全图
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-1.5 text-xs"
            onClick={focusEntry}
            title="回到第一列入口（可读落点）"
          >
            <LocateFixed className="h-3.5 w-3.5" />回到入口
          </Button>
          <Button
            size="sm"
            variant={miniMapOpen ? "secondary" : "ghost"}
            className="h-7 gap-1 px-1.5 text-xs"
            onClick={() => setMiniMapOpen((v) => !v)}
            title="缩略图（默认收起，避免压住节点）"
            data-testid="plan-minimap-toggle"
          >
            <MapIcon className="h-3.5 w-3.5" />缩略图
          </Button>
        </div>

      </div>

      {/* A2 + A5：真实尺度 / 阶段聚焦（只在全展开态出现，折叠态看主干不需要） */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {expandedAll && columns.length > 0 && (
          <>
            <span className="mr-1 font-semibold text-muted-foreground">聚焦</span>
            {columns.map((c) => (
              <button
                key={c.id}
                onClick={() => focusNodes(c.ids, 0.8, { topLeft: true, offset: { x: 24, y: 72 } })}
                title={`聚焦到「${c.label}」这一列（${c.ids.length} 个节点）`}
                className="rounded-md border border-border bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent"
              >
                {c.label || "步骤"}
              </button>
            ))}
          </>
        )}
        <span className="ml-auto flex items-center gap-2">
          {curStep && (
            <span
              className="shrink-0 cursor-help rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 text-[11px] tabular-nums text-destructive"
              onMouseEnter={() => setLoadHover(true)}
              onMouseLeave={() => setLoadHover(false)}
              title="鼠标悬停查看当前执行内容卡（展开态默认不占画布）"
              data-testid="plan-load-chip"
            >
              当前执行 {idx + 1}/{total}
            </span>
          )}
          <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground" data-testid="plan-scale">
            已展开 {visNodes.length} · 当前视野 {viewInfo.visible} · 缩放 {Math.round(viewInfo.zoom * 100)}%
          </span>
        </span>
      </div>

      </div>

      {/* 画布区（框内第二分区）
          ⚠️ 这里不能给底色 —— 曾用 bg-background(=页面底色) → 白框下半截与页面融为一体，
             整页看起来就是「一条白工具栏 + 一块画布」，白框等于不存在。
          现在整块都是 --card 白，靠上面的强横线 + 点阵网格分区，白框四边都读得出来。 */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">加载中…</div>
          ) : err ? (
            <div className="flex h-full items-center justify-center text-sm text-red-500">加载失败：{err}</div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onNodeMouseEnter={(_, n) => setHovered(n.id)}
              onNodeMouseLeave={() => setHovered(null)}
              onMoveEnd={updateViewInfo}
              nodeTypes={nodeTypes}
              minZoom={0.05}
              maxZoom={2}
            >
              <Background gap={16} size={1} />
              {!fs && miniMapOpen && <MiniMap pannable zoomable style={{ width: 160, height: 110 }} />}

              {!fs && (expandedAll ? (
                /* A3：展开态信息卡收成一行徽标（原 384×117 的卡 100% 盖住主干入口 run_quality_write_ch10） */
                <Panel position="top-left" data-testid="plan-info-compact">
                  <div className="rounded-md border border-border bg-card/90 px-2.5 py-1 text-[11px] backdrop-blur">
                    <span className="font-semibold">{curReal ? REAL_PLANS[source.idx].key : curPlan?.plan_id}</span>
                    <span className="text-muted-foreground">
                      {curReal
                        ? ` · ${realGraph?.n_nodes_expanded ?? 0} 节点 · 章节 ${realGraph?.chapter ?? "-"}`
                        : ` · ${visNodes.length} 节点`}
                    </span>
                  </div>
                </Panel>
              ) : (
              /* A6（2026-11-03）：折叠态信息卡也收成「一行条」，图例内联 → 不丢信息；
                 详情（含运行态提示）改为点「详情」按需展开。
                 依据：原 384×117 整卡与首列首节点**实测重叠 100%**、节点中心 elementFromPoint
                 命中的是面板（点不到，Playwright 报 element intercepts pointer events）；
                 条高实测 26.5px，配合视口避让即可完全让开。 */
              <Panel position="top-left" data-testid="plan-info-compact" className="max-w-[min(94vw,780px)]">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-md border border-border bg-card/90 px-2.5 py-1 text-[11px] backdrop-blur">
                    <span className="font-semibold">{curReal ? REAL_PLANS[source.idx].key : curPlan?.plan_id}</span>
                    <span className="text-muted-foreground">
                      {curReal
                        ? ` · ${realGraph?.n_nodes_expanded ?? 0} 节点 · 章节 ${realGraph?.chapter ?? "-"}`
                        : ` · ${visNodes.length} 节点`}
                    </span>
                    {/* 窄屏（<640）藏图例：341px 画布放不下，会折成 3–4 行把首节点盖住 */}
                    <span className="hidden flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:flex">
                      {legendItems}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInfoOpen((v) => !v)}
                      className="flex items-center gap-0.5 rounded px-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                      title={infoOpen ? "收起计划详情" : "展开计划详情（会盖住画布左上角）"}
                      data-testid="plan-info-toggle"
                    >
                      {infoOpen ? "收起" : "详情"}
                      <ChevronDown className={cn("h-3 w-3 transition-transform", infoOpen && "rotate-180")} />
                    </button>
                  </div>
                  {infoOpen && (
                    <div className="max-w-sm rounded-md border bg-card/95 px-3 py-2 text-xs shadow-raised backdrop-blur">
                      <div className="font-semibold">{curReal ? REAL_PLANS[source.idx].key : curPlan?.plan_id}</div>
                      <div className="text-muted-foreground">
                        {curReal
                          ? `${realGraph?.n_nodes_expanded ?? 0} 节点 · 章节 ${realGraph?.chapter ?? "-"} · 模式 ${realGraph?.mode ?? "-"}`
                          : curPlan?.description}
                      </div>
                      <div className="mt-0.5 text-[11px] text-amber-600">⚠ 运行态为演示播放（拓扑序），真实状态接 ao_task_execution</div>
                    </div>
                  )}
                </div>
              </Panel>
              ))}

              {/* 需求 4：当前执行内容（大屏自动展示）—— 放底部，避免压住主干与父节点。
                  A3（2026-10-29）：展开态默认不挂载（271×131 会盖住 run_w_ch10_s08 98%），
                  只在「播放中」或鼠标停在工具栏「当前执行」徽标上时出现。 */}
              {!fs && showLoadCard && (
              <Panel position="bottom-left" className="max-w-[264px]">
                {compactLoadCard ? (
                  /* 展开态且未播放：降级为一行（整卡会盖住 run_w_ch10_s08 98%） */
                  <div className="rounded-md border border-destructive/40 bg-card/95 px-2 py-1 text-[11px] tabular-nums text-destructive backdrop-blur">
                    正在执行 {idx + 1}/{total} · {curStep?.label ?? "—"}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-red-500 bg-card/95 px-2.5 py-2 shadow-raised backdrop-blur">
                    <div className="flex items-center gap-2 text-xs text-red-500">
                      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      正在执行 {idx + 1}/{total}
                    </div>
                    <div className="mt-1 text-sm font-semibold">{curStep.label ?? "—"}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{curStep.run_uuid}</div>
                    <div className="mt-1 line-clamp-3 text-xs text-muted-foreground">
                      {curStep.instruction || `Agent: ${curStep.agent_id}`}
                    </div>
                  </div>
                )}
              </Panel>
              )}

            </ReactFlow>
          )}
        </div>
      </ContentFrame>

      {/* 需求 3：节点详情 */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6 text-base">
              {detail?.label ?? detail?.run_uuid}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">{detail?.run_uuid}</DialogDescription>
          </DialogHeader>
          {detail && (
            <DialogBody>
              <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">执行 Agent</div>
                  <div className="font-medium">{detail.agent_id}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">状态</div>
                  <div className="font-medium">{STATUS_LABEL[(detail.status ?? "pending") as RunStatus]}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">task_id</div>
                  <div className="truncate font-mono text-xs">{detail.task_id ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">超时</div>
                  <div>{detail.timeout_seconds ? `${detail.timeout_seconds}s` : "—"}</div>
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">执行指令 (instruction)</div>
                <div className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/60 p-2 text-xs">
                  {detail.instruction || "（无）"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">前置 (prev_task)</div>
                  <div className="truncate font-mono">{detail.prev_task ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">后置 (next_task)</div>
                  <div className="truncate font-mono">{detail.next_task ?? "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-muted-foreground">子步骤 (children)</div>
                  <div className="font-mono">
                    {detail.children?.length ? `${detail.children.length} 个：${detail.children.slice(0, 6).join(", ")}${detail.children.length > 6 ? " …" : ""}` : "—"}
                  </div>
                </div>
              </div>
              </div>
            </DialogBody>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
