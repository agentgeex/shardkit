/**
 * ui/pagination.tsx — 分页（对齐 vue-admin-tpl「全部示例」的 Pagination）
 * ────────────────────────────────────────────────────────────────────────────
 * 页码 + 上一页/下一页 + 每页条数选择 + 总数显示；省略号折叠。
 */
import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const pages: (number | "…")[] = React.useMemo(() => {
    if (pageCount <= 7) return range(1, pageCount);
    const left = Math.max(2, page - 1);
    const right = Math.min(pageCount - 1, page + 1);
    const out: (number | "…")[] = [1];
    if (left > 2) out.push("…");
    out.push(...range(left, right));
    if (right < pageCount - 1) out.push("…");
    out.push(pageCount);
    return out;
  }, [page, pageCount]);

  const btn =
    "flex h-8 min-w-8 items-center justify-center rounded-md border border-input px-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)} data-testid="pagination">
      <div className="text-xs text-muted-foreground">
        {t("pagination.total", { count: total })}
        {onPageSizeChange && (
          <span className="ml-3 inline-flex items-center gap-1.5">
            {t("pagination.perPage")}
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {pageSizeOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {t("pagination.unit")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={t("pagination.prev")}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(btn, p === page && "border-primary bg-primary text-primary-foreground hover:bg-primary/90")}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className={btn} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label={t("pagination.next")}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
