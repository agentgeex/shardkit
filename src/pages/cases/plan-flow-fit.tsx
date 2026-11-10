/**
 * 页面案例：计划流程图 · 自适应网格（实验）
 * ──────────────────────────────────────────────────────────────
 * 路由：/plan-flow-fit     侧栏：计划流程图 · 自适应网格（实验）
 *
 * 研究原型（2026-10-30）。研究的问题：
 *   「流程图能不能按容器大小自动求最优行列，把小图撑满一屏、大图自动换行？」
 *
 * 结论（实测，详见 workspace `outputs/plan-fit-research/report.md`）：
 *   · 折叠到阶段级（真实数据 17 列）→ zoom 0.197 → **0.694**（3.5×），正文 8.3px ✅
 *   · 展开态（137 步）→ 主链列高实测 **1676px**，任何分行只到 0.144 ❌ 救不回来
 *
 * ⚠️ 边界：`../plan-flow/*` 与 `../plan-flow.tsx` **只读引用，一个字符都没改**。
 *    布局算法统一在 `@/lib/plan-grid`（生产页与本页共用一份，2026-10-30 定稿）。
 */
import * as React from "react";
import {
  ReactFlow, Background, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider,
  type Node, type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertTriangle, CheckCircle2, LayoutGrid, Scan, UnfoldVertical, FoldVertical, Waves, AlignStartVertical } from "lucide-react";
import { ContentFrame } from "@/components/ui/content-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { PLAN_PRESETS } from "./plan-flow/mock";
import { planToFlow, type StepNodeData } from "./plan-flow/adapter";
import { exportToFlow, type ExportGraph } from "./plan-flow/export-adapter";
import { StepNode } from "./plan-flow/step-node";
import { getDataVersion } from "@/lib/page-refresh-data";
import {
  buildColumns, optimalSplit, uniformSplit, manualSplit, placeColumns, edgeStats,
  PAD, MAX_ZOOM, READABLE_ZOOM, BODY_BASE, GAP_X,
  type Col, type Container, type Pack, type WrapMode,
} from "@/lib/plan-grid";

const nodeTypes = { step: StepNode };

const REAL_PLANS = [
  { key: "plan_119dfdc4ce44", name: "书籍创作 · 137 步", file: "/plan_exports/plan_119dfdc4ce44.graph.json", steps: "/plan_exports/plan_119dfdc4ce44.steps_json.json" },
  { key: "plan_4c2187220435", name: "书籍创作 · 47 步", file: "/plan_exports/plan_4c2187220435.graph.json", steps: "/plan_exports/plan_4c2187220435.steps_json.json" },
];

type Source = { kind: "mock"; idx: number } | { kind: "real"; idx: number };

export default function PlanFlowFitCase() {
  return (
    <ReactFlowProvider>
      <PlanFlowFitInner />
    </ReactFlowProvider>
  );
}

function PlanFlowFitInner() {
  const { fitView, getZoom } = useReactFlow();
  const canvasRef = React.useRef<HTMLDivElement>(null);

  const [source, setSource] = React.useState<Source>({ kind: "real", idx: 0 });
  const [realGraph, setRealGraph] = React.useState<ExportGraph | null>(null);
  const [instructionMap, setInstructionMap] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [baseNodes, setBaseNodes] = React.useState<Node<StepNodeData>[]>([]);
  const [baseEdges, setBaseEdges] = React.useState<Edge[]>([]);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  // 网格参数
  const [auto, setAuto] = React.useState(true);          // 自动求最优 / 手动指定列数
  const [manualCols, setManualCols] = React.useState(5);
  const [mode, setMode] = React.useState<WrapMode>("left");
  const [gapY, setGapY] = React.useState(36);
  const [zoomFloor, setZoomFloor] = React.useState(READABLE_ZOOM);

  const [cont, setCont] = React.useState<Container>({ w: 0, h: 0 });
  const [viewZoom, setViewZoom] = React.useState(1);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<StepNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  /* ── 载入数据源（与 /plan-flow 同一套 loader）────────────── */
  React.useEffect(() => {
    if (source.kind !== "real") return;
    const meta = REAL_PLANS[source.idx];
    const bust = `?v=${getDataVersion()}`;
    setLoading(true);
    setErr(null);
    Promise.all([
      fetch(meta.file + bust).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
      fetch(meta.steps + bust).then((r) => (r.ok ? r.json() : { steps: [] })).catch(() => ({ steps: [] })),
    ])
      .then(([g, s]: [ExportGraph, { steps?: { run_uuid: string; instruction?: string }[] }]) => {
        setRealGraph(g);
        const m: Record<string, string> = {};
        (s.steps ?? []).forEach((x) => { if (x.instruction) m[x.run_uuid] = x.instruction; });
        setInstructionMap(m);
      })
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [source]);

  React.useEffect(() => { setCollapsed(new Set()); }, [source]);

  React.useEffect(() => {
    if (source.kind === "mock") {
      const { nodes: n, edges: e } = planToFlow(PLAN_PRESETS[source.idx].plan);
      setBaseNodes(n);
      setBaseEdges(e);
    } else if (realGraph) {
      const { nodes: n, edges: e } = exportToFlow(realGraph, instructionMap);
      setBaseNodes(n);
      setBaseEdges(e);
    }
  }, [source, realGraph, instructionMap]);

  /* ── 折叠 ─────────────────────────────────────────────── */
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

  const parentIds = React.useMemo(
    () => baseNodes.filter((n) => (n.data.childIds?.length ?? 0) > 0).map((n) => n.id),
    [baseNodes]
  );

  const toggleCollapse = React.useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const visible = React.useMemo(
    () =>
      baseNodes
        .filter((n) => !hidden.has(n.id))
        .map((n) =>
          (n.data.childIds?.length ?? 0) > 0
            ? { ...n, data: { ...n.data, collapsed: collapsed.has(n.id), onToggleCollapse: toggleCollapse } }
            : n
        ),
    [baseNodes, hidden, collapsed, toggleCollapse]
  );

  /* ── 列 + 网格方案 ─────────────────────────────────────── */
  const columns: Col[] = React.useMemo(() => buildColumns(visible), [visible]);

  const pack: Pack | null = React.useMemo(() => {
    if (!columns.length || !cont.w || !cont.h) return null;
    if (!auto) return manualSplit(columns, cont, manualCols, GAP_X, gapY);
    // 自动：先精确最优；若与「均分」等价则展示时标注（差异见指标条 dpVsGreedy）
    return optimalSplit(columns, cont, GAP_X, gapY);
  }, [columns, cont, auto, manualCols, gapY]);

  const uniform: Pack | null = React.useMemo(
    () => (columns.length && cont.w && cont.h ? uniformSplit(columns, cont, GAP_X, gapY) : null),
    [columns, cont, gapY]
  );

  const laid = React.useMemo(() => {
    if (!pack) return [];
    const pos = placeColumns(columns, pack, mode, GAP_X, gapY);
    const flat = new Map<string, { x: number; y: number }>();
    columns.forEach((c, i) => {
      const p = pos.get(i);
      if (!p) return;
      for (const n of c.nodes) flat.set(n.id, { x: p.x + n.dx, y: p.y + n.dy });
    });
    return visible.map((n) => {
      const p = flat.get(n.id);
      return p ? { ...n, position: p } : n;
    });
  }, [pack, columns, mode, gapY, visible]);

  React.useEffect(() => {
    setNodes(laid);
    const visIds = new Set(laid.map((n) => n.id));
    setEdges(baseEdges.filter((e) => visIds.has(e.source) && visIds.has(e.target)));
  }, [laid, baseEdges, setNodes, setEdges]);

  /* ── 容器尺寸（真实测量，不用估算）─────────────────────── */
  React.useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const read = () => setCont({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── 布局变化 → fitView（padding 与 /plan-flow 一致）──── */
  React.useEffect(() => {
    if (!laid.length || !cont.w) return;
    // 两拍再读 zoom：fitView 之后 React Flow 还要一帧把 viewport transform 落到 DOM，
    // 立刻 getZoom() 会读到「上一态」的值（实测过：显示 0.151、DOM 实际 0.705）。
    let t2 = 0;
    const id = window.setTimeout(() => {
      fitView({ padding: PAD, duration: 0, minZoom: 0.05, maxZoom: MAX_ZOOM });
      requestAnimationFrame(() => {
        t2 = window.setTimeout(() => setViewZoom(getZoom()), 180);
      });
    }, 80);
    return () => { window.clearTimeout(id); window.clearTimeout(t2); };
  }, [laid, cont.w, fitView, getZoom]);

  /* ── 指标 ─────────────────────────────────────────────── */
  const es = React.useMemo(() => {
    if (!pack || columns.length < 2) return null;
    return { left: edgeStats(columns, pack, "left", GAP_X, gapY), snake: edgeStats(columns, pack, "snake", GAP_X, gapY) };
  }, [pack, columns, gapY]);

  const ok = viewZoom >= zoomFloor;
  const bodyPx = Math.round(BODY_BASE * viewZoom * 10) / 10;

  const selectSource = (s: Source) => setSource(s);
  const btnCls = (active: boolean) =>
    cn(
      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-accent"
    );

  return (
    <div className="flex h-full flex-col">
      <ContentFrame fill padding={0}>
        {/* ── 框内第一分区：控制面板 ───────────────────────── */}
        <div className="flex flex-col gap-2 border-b border-strong p-3" data-testid="fit-controls">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold text-muted-foreground">真实导出</span>
              {REAL_PLANS.map((p, i) => (
                <button key={p.key} onClick={() => selectSource({ kind: "real", idx: i })} className={btnCls(source.kind === "real" && source.idx === i)}>
                  {p.name}
                </button>
              ))}
              <span className="mx-1 h-4 w-px bg-border" />
              <span className="mr-1 text-xs font-semibold text-muted-foreground">演示</span>
              {PLAN_PRESETS.map((p, i) => (
                <button key={p.key} onClick={() => selectSource({ kind: "mock", idx: i })} className={btnCls(source.kind === "mock" && source.idx === i)}>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs">
              {loading && <Badge variant="outline">载入中…</Badge>}
              {err && <Badge variant="outline" className="border-strong">载入失败</Badge>}
              <Badge variant="outline">{visible.length} 节点</Badge>
              {hidden.size > 0 && <Badge variant="outline" className="text-muted-foreground">已折叠 {hidden.size}</Badge>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Switch checked={auto} onCheckedChange={setAuto} />
              <LayoutGrid className="h-3.5 w-3.5" />
              自动求最优行列
            </label>
            <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", auto && "opacity-40")}>
              <span>手动列数</span>
              <Slider value={[manualCols]} min={1} max={12} step={1} onValueChange={(v) => setManualCols(v[0])} className="w-24" disabled={auto} />
              <span className="tabular-nums">{manualCols}</span>
            </div>
            <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
              <Button size="sm" variant={mode === "left" ? "secondary" : "ghost"} className="h-7 gap-1 px-1.5 text-xs" onClick={() => setMode("left")} title="每行都从左起（边从右端回跳左端）">
                <AlignStartVertical className="h-3.5 w-3.5" />齐左
              </Button>
              <Button size="sm" variant={mode === "snake" ? "secondary" : "ghost"} className="h-7 gap-1 px-1.5 text-xs" onClick={() => setMode("snake")} title="行尾接下一行行尾（边更短，但阅读方向 zigzag）">
                <Waves className="h-3.5 w-3.5" />蛇形
              </Button>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>行距</span>
              <Slider value={[gapY]} min={20} max={140} step={4} onValueChange={(v) => setGapY(v[0])} className="w-24" />
              <span className="tabular-nums">{gapY}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>zoom 下限</span>
              <Slider value={[zoomFloor]} min={0.3} max={1} step={0.05} onValueChange={(v) => setZoomFloor(v[0])} className="w-24" />
              <span className="tabular-nums">{zoomFloor.toFixed(2)}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5"
              disabled={!parentIds.length}
              onClick={() => setCollapsed(collapsed.size ? new Set() : new Set(parentIds))}
              title={collapsed.size ? "展开全部子任务" : "折叠全部子任务"}
            >
              {collapsed.size ? <UnfoldVertical className="h-3.5 w-3.5" /> : <FoldVertical className="h-3.5 w-3.5" />}
              {collapsed.size ? "全部展开" : "全部折叠"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5"
              onClick={() => { fitView({ padding: PAD, duration: 200, minZoom: 0.05, maxZoom: MAX_ZOOM }); window.setTimeout(() => setViewZoom(getZoom()), 260); }}
              title="按当前布局适配全图"
            >
              <Scan className="h-3.5 w-3.5" />适配全图
            </Button>
          </div>

          {/* ── 实时指标条 ──────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5" data-testid="fit-metrics">
            <Badge variant="outline" className="border-strong tabular-nums">{columns.length} 列</Badge>
            <Badge variant="outline" className="border-strong tabular-nums">{pack ? pack.rows.length : 0} 行</Badge>
            <Badge variant="outline" className="border-strong tabular-nums">zoom {viewZoom.toFixed(3)}</Badge>
            <Badge variant="outline" className="border-strong tabular-nums">正文 {bodyPx}px</Badge>
            <Badge variant="outline" className="border-strong tabular-nums">填充率 {pack ? pack.fill : 0}%</Badge>
            {pack && <Badge variant="outline" className="border-strong tabular-nums">包围盒 {pack.bboxW}×{pack.bboxH}</Badge>}
            {pack && uniform && (
              <Badge variant="outline" className="border-strong tabular-nums" title="精确 DP 与均分贪心的 zoom 差">
                DP {pack.zoom.toFixed(3)} / 均分 {uniform.zoom.toFixed(3)}
              </Badge>
            )}
            {es && (
              <Badge variant="outline" className="border-strong tabular-nums" title={`齐左 总${es.left.totalPx}px 最长${es.left.maxPx}px 跨行${es.left.crossRow} / 蛇形 总${es.snake.totalPx}px 最长${es.snake.maxPx}px 跨行${es.snake.crossRow}`}>
                边：齐左 最长 {es.left.maxPx}px · 蛇形 最长 {es.snake.maxPx}px
              </Badge>
            )}
            {ok ? (
              <Badge variant="outline" className="border-strong gap-1"><CheckCircle2 className="h-3 w-3" />可达可读下限</Badge>
            ) : (
              <Badge variant="outline" className="border-strong gap-1"><AlertTriangle className="h-3 w-3" />未达下限 {zoomFloor.toFixed(2)}（正文 {bodyPx}px）</Badge>
            )}
          </div>
        </div>

        {/* ── 框内第二分区：画布 ───────────────────────────── */}
        <div ref={canvasRef} className="min-h-0 flex-1" data-testid="fit-canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: false }}
            minZoom={0.05}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: PAD, maxZoom: MAX_ZOOM }}
          >
            <Background gap={16} size={1} />
          </ReactFlow>
        </div>
      </ContentFrame>
    </div>
  );
}
