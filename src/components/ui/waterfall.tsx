/**
 * ui/waterfall.tsx — 瀑布流（对齐 vue-admin-tpl「组件 → 瀑布流」）
 * ────────────────────────────────────────────────────────────────────────────
 * 两种布局：
 *   - javascript：绝对定位，按「最矮列优先」逐个安放（真·瀑布流，列高均衡）
 *   - flex      ：按列数把数据轮流分到各列，CSS flex 自适应（实现简单、顺序稳定）
 *
 * 能力：
 *   - 响应式列数：cols 不传时按容器宽 / (itemWidth + gap) 自动算
 *   - 无限滚动：滚动到底部触发 onLoadMore（IntersectionObserver）
 *   - 加载态 / 结束态文案
 *   - 窗口 resize 自动重排（debounce）
 *
 * 纯前端：数据由调用方提供；图片 src/height 字段名可配（props）。
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export interface WaterfallProps<T = Record<string, unknown>> {
  /** 数据数组 */
  data: T[];
  /** 每项宽度（px），JS 布局与自动列数计算用 */
  width?: number;
  /** 列间距（px） */
  gap?: number;
  /** 固定列数；不传则按容器宽度自动计算 */
  cols?: number;
  /** 布局方式 */
  layout?: "javascript" | "flex";
  /** 数据字段映射：图片地址 / 项高度 */
  props?: { src: string; height: string };
  /** 加载中 */
  loading?: boolean;
  /** 已到底 */
  end?: boolean;
  loadingText?: string;
  endText?: string;
  /** 居中容器 */
  autoCenter?: boolean;
  /** 是否监听 resize 重排，默认 true */
  reset?: boolean;
  /** 触底回调 */
  onLoadMore?: () => void;
  /** 自定义渲染每一项 */
  renderItem?: (item: T, index: number) => React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

function useDebouncedCallback(fn: () => void, delay: number) {
  const ref = React.useRef(fn);
  ref.current = fn;
  const timer = React.useRef<number | undefined>(undefined);
  return React.useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => ref.current(), delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay]);
}

export function Waterfall<T extends Record<string, unknown>>({
  data,
  width = 200,
  gap = 20,
  cols,
  layout = "flex",
  props = { src: "src", height: "height" },
  loading = false,
  end = false,
  loadingText = "加载中...",
  endText = "没有更多了",
  autoCenter = true,
  reset = true,
  onLoadMore,
  renderItem,
  className,
  "data-testid": testid,
}: WaterfallProps<T>) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  const [innerCols, setInnerCols] = React.useState(1);

  const computeCols = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const c = cols ?? Math.max(1, Math.floor(el.clientWidth / (width + gap)));
    setInnerCols(c);
  }, [cols, width, gap]);

  const debouncedCompute = useDebouncedCallback(computeCols, 300);

  React.useEffect(() => {
    computeCols();
    if (!reset) return;
    window.addEventListener("resize", debouncedCompute);
    return () => window.removeEventListener("resize", debouncedCompute);
  }, [computeCols, debouncedCompute, reset]);

  // 数据 / 列数变化时重排
  React.useEffect(() => {
    computeCols();
  }, [data, cols, computeCols]);

  // 无限滚动（layout 切换会重建 sentinel 节点，须一并重挂 observer）
  React.useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !onLoadMore) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && !end) onLoadMore();
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onLoadMore, loading, end, layout, innerCols]);

  // ── JS 绝对定位布局：算每项 top/left + 容器高度 ──
  const jsLayout = React.useMemo(() => {
    if (layout !== "javascript") return null;
    const heights: number[] = [];
    const items: { item: T; index: number; top: number; left: number }[] = [];
    const n = Math.max(1, innerCols);
    data.forEach((item, i) => {
      const h = Number(item[props.height as keyof T]) || 0;
      if (i < n) {
        heights[i] = h;
        items.push({ item, index: i, top: 0, left: i * (width + gap) });
      } else {
        let minH = heights[0];
        let idx = 0;
        for (let j = 1; j < n; j++) {
          if (heights[j] < minH) {
            minH = heights[j];
            idx = j;
          }
        }
        heights[idx] += h + gap;
        items.push({ item, index: i, top: minH + gap, left: idx * (width + gap) });
      }
    });
    const wrapHeight = heights.length ? Math.max(...heights) : 0;
    const wrapWidth = n * (width + gap) - gap;
    return { items, wrapHeight, wrapWidth };
  }, [layout, data, innerCols, width, gap, props.height]);

  // ── flex 布局：按列轮流分桶 ──
  const flexColumns = React.useMemo(() => {
    if (layout !== "flex") return null;
    const n = Math.max(1, innerCols);
    const arr: { item: T; index: number }[][] = Array.from({ length: n }, () => []);
    data.forEach((item, i) => arr[i % n].push({ item, index: i }));
    return arr;
  }, [layout, data, innerCols]);

  const defaultRender = (item: T) => {
    const src = String(item[props.src as keyof T] ?? "");
    return <img src={src} alt="" className="block h-full w-full object-cover" loading="lazy" />;
  };

  return (
    <div
      ref={wrapRef}
      className={cn("flex items-center", autoCenter && "justify-center", className)}
      data-testid={testid}
      style={layout === "javascript" ? { height: (jsLayout?.wrapHeight ?? 0) + 40 } : undefined}
    >
      {layout === "javascript" && jsLayout && (
        <div className="relative" style={{ width: jsLayout.wrapWidth, height: jsLayout.wrapHeight + 40 }}>
          {jsLayout.items.map(({ item, index, top, left }) => (
            <div
              key={index}
              className="absolute overflow-hidden rounded-md"
              style={{ width, height: Number(item[props.height as keyof T]) || 0, top, left }}
            >
              {renderItem ? renderItem(item, index) : defaultRender(item)}
            </div>
          ))}
          <div
            ref={loadMoreRef}
            className="absolute flex w-full items-center justify-center text-sm text-muted-foreground"
            style={{ height: 40, top: jsLayout.wrapHeight + gap }}
          >
            {end ? endText : loadingText}
          </div>
        </div>
      )}

      {layout === "flex" && flexColumns && (
        <div className="relative flex w-full pb-10" style={{ width: cols ? "100%" : "auto" }}>
          {flexColumns.map((col, ci) => (
            <div
              key={ci}
              className="flex-1"
              style={{ marginRight: ci === flexColumns.length - 1 ? 0 : gap }}
            >
              {col.map(({ item, index }) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-md"
                  style={{
                    marginBottom: gap,
                    width: cols ? "100%" : width,
                    height: cols ? "auto" : Number(item[props.height as keyof T]) || 0,
                  }}
                >
                  {renderItem ? renderItem(item, index) : defaultRender(item)}
                </div>
              ))}
            </div>
          ))}
          <div
            ref={loadMoreRef}
            className="absolute bottom-0 flex h-10 w-full items-center justify-center text-sm text-muted-foreground"
          >
            {end ? endText : loadingText}
          </div>
        </div>
      )}
    </div>
  );
}
