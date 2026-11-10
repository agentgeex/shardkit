/**
 * 页面案例：表格 · 基础示例（Table / DefaultTable）
 * ──────────────────────────────────────────────────
 * 参考：vue-admin-tpl/src/views/Components/Table/DefaultTable.vue
 *   （左侧导航「表格 → 基础示例」，i18n `tableDemo.defaultTable`）
 *
 * 复刻要点：
 *   1. ContentWrap 标题「基础示例」+ 描述
 *   2. 表格列：标题 / 作者 / 显示时间（可排序，默认倒序）/ 重要度（Tag 着色）/ 浏览量 / 操作
 *   3. 重要度用 Badge 着色：重要=success、良好=warning、一般=destructive
 *   4. 操作列为按钮（真实应用里的行内操作）
 *   5. 底部翻页（Element 里由 Table 组件内置；此处用 ShardKit Pagination）
 *
 * 路由：/table
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Table2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  EXAMPLE_ROWS, IMPORTANCE_LABEL, IMPORTANCE_VARIANT, type ExampleRow,
} from "./mock";

type SortOrder = "asc" | "desc" | null;

export default function TableBasicCase() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rows] = React.useState<ExampleRow[]>(EXAMPLE_ROWS);
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");
  const [page, setPage] = React.useState(1);
  const [striped, setStriped] = React.useState(true);
  const pageSize = 10;

  // 排序：默认按 display_time 倒序（对齐 vue-admin-tpl :defaultSort）
  const sorted = React.useMemo(() => {
    if (!sortOrder) return rows;
    return [...rows].sort((a, b) => {
      const t = a.display_time.localeCompare(b.display_time);
      return sortOrder === "asc" ? t : -t;
    });
  }, [rows, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, totalPages);
  const pageRows = sorted.slice((cur - 1) * pageSize, cur * pageSize);
  const toggleSort = () =>
    setSortOrder((s) => (s === "desc" ? "asc" : s === "asc" ? null : "desc"));

  const SortIcon = sortOrder === "asc" ? ArrowUp : sortOrder === "desc" ? ArrowDown : ArrowUpDown;

  const onAction = (row: ExampleRow) =>
    toast({ title: "操作", description: `点击了「${row.title}」的操作按钮` });

  return (
    <div data-testid="table-basic-page" className="flex flex-col">
      <ContentFrame className="flex flex-col gap-5">
      <ContentFrameSection>
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-base">
            <Table2 className="h-4 w-4 text-emerald-500" /> 基础示例
          </h2>
          <p className="text-sm text-muted-foreground">
            表格基础用法：可排序列（默认按显示时间倒序）、状态标签、行内操作与分页。
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg" data-testid="table-basic-wrap">
            <Table
              data-testid="table-basic"
              className="[&_th]:border-r [&_th]:border-border [&_th:last-child]:border-r-0 [&_td]:border-r [&_td]:border-border [&_td:last-child]:border-r-0 [&_thead]:border-b [&_thead]:border-border"
            >
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead className="w-[120px]">作者</TableHead>
                  <TableHead className="w-[200px]">
                    <button
                      type="button"
                      onClick={toggleSort}
                      data-testid="sort-display-time"
                      className={cn(
                        "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
                        sortOrder && "text-foreground"
                      )}
                    >
                      显示时间
                      <SortIcon className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[110px]">重要度</TableHead>
                  <TableHead className="w-[110px] text-right">浏览量</TableHead>
                  <TableHead className="w-[110px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.title}</TableCell>
                    <TableCell className="text-muted-foreground">{row.author}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{row.display_time}</TableCell>
                    <TableCell>
                      <Badge variant={IMPORTANCE_VARIANT[row.importance]}>
                        {IMPORTANCE_LABEL[row.importance]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.pageviews}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => onAction(row)}>
                        操作
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              {t("pagination.rangeSummary", {
                total: sorted.length,
                from: (cur - 1) * pageSize + 1,
                to: Math.min(cur * pageSize, sorted.length),
              })}
            </p>
            <Pagination
              page={cur}
              pageSize={pageSize}
              total={sorted.length}
              onPageChange={setPage}
            />
          </div>
        </div>
      </ContentFrameSection>

      <ContentFrameSection>
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="flex items-center gap-2 text-base">
                <Table2 className="h-4 w-4 text-success" /> 斑马线（striped）
              </h2>
              <p className="text-sm text-muted-foreground">
                给 <code className="rounded bg-muted px-1 text-caption">TableBody</code> 加
                <code className="mx-1 rounded bg-muted px-1 text-caption">striped</code>
                即可；偶数行用语义令牌 <code className="rounded bg-muted px-1 text-caption">bg-muted/30</code>，
                悬停可覆盖，深色模式自动适配。
              </p>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={striped}
                onCheckedChange={setStriped}
                data-testid="toggle-striped"
              />
              启用
            </label>
          </div>
        </div>
        <div>
          <Table data-testid="table-striped">
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead className="w-[120px]">作者</TableHead>
                <TableHead className="w-[110px]">重要度</TableHead>
                <TableHead className="w-[110px] text-right">浏览量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody striped={striped} data-testid="striped-body">
              {EXAMPLE_ROWS.slice(0, 6).map((row) => (
                <TableRow key={row.id} data-testid={`striped-row-${row.id}`}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-muted-foreground">{row.author}</TableCell>
                  <TableCell>
                    <Badge variant={IMPORTANCE_VARIANT[row.importance]}>
                      {IMPORTANCE_LABEL[row.importance]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.pageviews}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
