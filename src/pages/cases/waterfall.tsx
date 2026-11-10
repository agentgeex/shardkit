/**
 * 页面案例：瀑布流 Waterfall（对齐 vue-admin-tpl「组件 → 瀑布流」）
 * ────────────────────────────────────────────────────────────────────────────
 * 演示：
 *   - 图片瀑布流（不等高卡片）· 两种布局（flex / javascript）
 *   - 无限滚动加载（触底自动追加）
 *   - 响应式列数（随容器宽度自适应）
 *
 * 说明：为保持工程「零外网依赖」约定，图片用**内联 SVG data-URI 占位**
 *      （带渐变色 + 序号），不依赖任何在线图床。
 */
import * as React from "react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ContentFrame } from "@/components/ui/content-frame";
import { Waterfall } from "@/components/ui/waterfall";
import { cn } from "@/lib/utils";

/* ── 占位图：内联 SVG data-URI（零外网） ── */
const PALETTE = [
  ["#6366f1", "#8b5cf6"], ["#0ea5e9", "#22d3ee"], ["#10b981", "#34d399"],
  ["#f59e0b", "#fbbf24"], ["#ef4444", "#f87171"], ["#ec4899", "#f472b6"],
  ["#14b8a6", "#2dd4bf"], ["#8b5cf6", "#a78bfa"],
];

function makeSvg(w: number, h: number, i: number, label: string) {
  const [c1, c2] = PALETTE[i % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
<text x="50%" y="46%" fill="rgba(255,255,255,.95)" font-size="${Math.round(Math.min(w, h) / 4)}"
 font-family="system-ui,sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="middle">${label}</text>
<text x="50%" y="62%" fill="rgba(255,255,255,.75)" font-size="${Math.round(Math.min(w, h) / 9)}"
 font-family="system-ui,sans-serif" text-anchor="middle" dominant-baseline="middle">${w}×${h}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

type Pic = { id: number; src: string; height: number; title: string; tag: string };

const TAGS = ["周报", "选品", "投放", "合规", "分析", "客服", "采集", "生成"];

/** 伪随机（可复现），保证每次渲染布局稳定、便于校验 */
function makePics(startId: number, n: number): Pic[] {
  return Array.from({ length: n }, (_, k) => {
    const id = startId + k;
    // 用 id 派生高度，制造不等高瀑布效果（120~320）
    const height = 120 + ((id * 137) % 200);
    const width = 240;
    const tag = TAGS[id % TAGS.length];
    return {
      id,
      height,
      width,
      tag,
      title: `素材 #${id} · ${tag}图`,
      src: makeSvg(width, height, id, `#${id}`),
    } as Pic & { width: number };
  });
}

export default function WaterfallCase() {
  const [layout, setLayout] = React.useState<"flex" | "javascript">("flex");
  const [pics, setPics] = React.useState<Pic[]>(() => makePics(1, 24));
  const [loading, setLoading] = React.useState(false);
  const [end, setEnd] = React.useState(false);

  const loadMore = React.useCallback(() => {
    setLoading(true);
    // 模拟异步加载（纯前端）：800ms 后追加 12 张
    window.setTimeout(() => {
      setPics((prev) => {
        const next = [...prev, ...makePics(prev.length + 1, 12)];
        if (next.length >= 72) setEnd(true);
        return next;
      });
      setLoading(false);
    }, 800);
  }, []);

  return (
    <div data-testid="waterfall-page" className="flex flex-col">
      <ContentFrame>
      {/* 页头已去（导航高亮即页名）；说明降为框内首行 */}
      <p className="mb-4 text-sm text-muted-foreground">
        不等高卡片流式排布 + 无限滚动（对齐 vue-admin-tpl「组件 → 瀑布流」）
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="text-cyan-500" /> 图片瀑布流
            <Badge variant="secondary">{pics.length} 张</Badge>
            {end && <Badge variant="success">已加载全部</Badge>}
          </CardTitle>
          <CardDescription>
            列数随容器宽度自适应（响应式）；滚动到底部自动加载更多；可切换两种布局算法。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 布局切换 */}
          <div className="flex flex-wrap items-center gap-3">
            <Label className="text-sm text-muted-foreground">布局算法</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={layout === "flex" ? "default" : "outline"}
                onClick={() => setLayout("flex")}
                data-testid="wf-layout-flex"
              >
                flex（分列）
              </Button>
              <Button
                size="sm"
                variant={layout === "javascript" ? "default" : "outline"}
                onClick={() => setLayout("javascript")}
                data-testid="wf-layout-js"
              >
                javascript（绝对定位 · 最矮列优先）
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-3" data-testid="wf-container">
            <Waterfall
              data={pics as unknown as Record<string, unknown>[]}
              layout={layout}
              width={220}
              gap={16}
              loading={loading}
              end={end}
              props={{ src: "src", height: "height" }}
              onLoadMore={loadMore}
              data-testid="waterfall"
              renderItem={(raw) => {
                const p = raw as unknown as Pic;
                return (
                  <div className="group relative h-full w-full">
                    <img src={p.src} alt={p.title} className="block h-full w-full object-cover" loading="lazy" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-xs font-medium text-white">{p.title}</p>
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {/* 底部加载态提示（无限滚动可视反馈） */}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground" data-testid="wf-footer">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 加载中…
              </>
            ) : end ? (
              "没有更多了"
            ) : (
              "向下滚动查看更多"
            )}
          </div>
        </CardContent>
      </Card>

      {/* 说明卡 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">说明</CardTitle>
        </CardHeader>
        <CardContent className={cn("space-y-2 text-sm text-muted-foreground")}>
          <p>· <b>零外网</b>：示例图片为内联 SVG data-URI 占位，不依赖任何在线图床（符合工程「图标/资源零联网」约定）。</p>
          <p>· <b>响应式</b>：列数 = 容器宽度 / (卡片宽 + 间距)，窗口缩放自动重排。</p>
          <p>· <b>两种算法</b>：flex 分列（简单、顺序稳定）；javascript 绝对定位（真·最矮列优先，列高更均衡）。</p>
          <p>· <b>无限滚动</b>：基于 IntersectionObserver，触底触发 onLoadMore。</p>
        </CardContent>
      </Card>
      </ContentFrame>
    </div>
  );
}
