/**
 * 页面案例：查询 —「订单查询」（产品化）
 * ──────────────────────────────────────────────────────────────
 * 对齐 vue-admin-tpl「组件 → 查询」的**产品化用法**：
 *   查询面板（多字段筛选 + 查询/重置 + 展开收起） + 结果表格（排序 / 标签 / 行内操作 / 分页）
 *
 * 与 /search（演示页）的分工：
 *   - /search    = 形态演示（切换栅格/布局/按钮位置/动态增删字段）
 *   - /search/orders = 真实业务查询页（客户可直接照抄的成品）
 *
 * 路由：/search/orders
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Search as SearchIcon, RotateCcw, ChevronDown, ChevronUp, Download,
  FileSearch, ArrowUpDown, ArrowUp, ArrowDown, Filter,
} from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { ORDERS, STATUS_LABEL, STATUS_VARIANT, type Order } from "./orders/mock";

type SortOrder = "asc" | "desc" | null;
type FilterKey = "no" | "customer" | "status" | "channel" | "dateFrom" | "dateTo";

/* 日期格式化：Date -> YYYY-MM-DD */
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const CHANNELS = [
  { value: "web", label: "官网" },
  { value: "app", label: "App" },
  { value: "agent", label: "代理" },
];

const STATUS_OPTS = Object.keys(STATUS_LABEL).map((k) => ({ value: k, label: STATUS_LABEL[k as Order["status"]] }));

export default function OrderSearchCase() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [filters, setFilters] = React.useState<Partial<Record<FilterKey, string>>>({});
  const [expanded, setExpanded] = React.useState(false);
  const [applied, setApplied] = React.useState<Partial<Record<FilterKey, string>>>({});
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("desc");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const set = (k: FilterKey, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const doSearch = () => {
    setApplied(filters);
    setPage(1);
    const n = Object.values(filters).filter(Boolean).length;
    toast({ title: t("query.done"), description: t("query.doneDesc", { count: n }) });
  };
  const doReset = () => {
    setFilters({});
    setApplied({});
    setPage(1);
  };

  // 过滤 + 排序（对齐 removeNoValueItem：空值不参与）
  const rows = React.useMemo(() => {
    let r = ORDERS.filter((o) => {
      if (applied.no && !o.no.includes(applied.no)) return false;
      if (applied.customer && !o.customer.includes(applied.customer)) return false;
      if (applied.status && o.status !== applied.status) return false;
      if (applied.channel && o.channel !== applied.channel) return false;
      if (applied.dateFrom && o.date < applied.dateFrom) return false;
      if (applied.dateTo && o.date > applied.dateTo) return false;
      return true;
    });
    if (sortOrder) {
      r = [...r].sort((a, b) => (sortOrder === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
    }
    return r;
  }, [applied, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, totalPages);
  const pageRows = rows.slice((cur - 1) * pageSize, cur * pageSize);
  const SortIcon = sortOrder === "asc" ? ArrowUp : sortOrder === "desc" ? ArrowDown : ArrowUpDown;
  const toggleSort = () => setSortOrder((s) => (s === "desc" ? "asc" : s === "asc" ? null : "desc"));

  return (
    <div data-testid="order-search-page" className="flex flex-col gap-4">
      {/* ── 查询面板 ── */}
      <ContentFrame>
        <ContentFrameSection data-testid="order-search-panel">
          <div className="mb-3 flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-sky-500" /> {t("query.ordersTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("query.ordersDesc")}</p>
          </div>
          <div className="flex flex-col gap-4">
            {/* 主筛选项：一行两列（统一表单页样式） */}
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                <Label className="text-right text-muted-foreground">{t("field.orderNo")}</Label>
                <Input placeholder={t("query.phOrderNo")} data-testid="f-no" value={filters.no ?? ""} onChange={(e) => set("no", e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                <Label className="text-right text-muted-foreground">{t("field.customer")}</Label>
                <Input placeholder={t("query.phCustomer")} data-testid="f-customer" value={filters.customer ?? ""} onChange={(e) => set("customer", e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                <Label className="text-right text-muted-foreground">{t("field.status")}</Label>
                <Select value={filters.status ?? ""} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger data-testid="f-status"><SelectValue placeholder={t("query.phAll")} /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                <Label className="text-right text-muted-foreground">{t("field.channel")}</Label>
                <Select value={filters.channel ?? ""} onValueChange={(v) => set("channel", v)}>
                  <SelectTrigger data-testid="f-channel"><SelectValue placeholder={t("query.phAll")} /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 展开项 */}
            {expanded && (
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2" data-testid="advanced-fields">
                <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                  <Label className="text-right text-muted-foreground">{t("query.startDate")}</Label>
                  <DatePicker
                    value={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                    onChange={(d) => set("dateFrom", d ? toYmd(d) : "")}
                    placeholder={t("query.phPickDate")}
                    className="w-full"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                  <Label className="text-right text-muted-foreground">{t("query.endDate")}</Label>
                  <DatePicker
                    value={filters.dateTo ? new Date(filters.dateTo) : undefined}
                    onChange={(d) => set("dateTo", d ? toYmd(d) : "")}
                    placeholder={t("query.phPickDate")}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* 按钮行 */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-muted-foreground" data-testid="order-expand" onClick={() => setExpanded((v) => !v)}>
                {expanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                {expanded ? t("query.collapse") : t("query.expand")}
              </Button>
              <div className="flex gap-2">
                <Button data-testid="order-search-btn" onClick={doSearch}>
                  <SearchIcon className="mr-1 h-4 w-4" /> {t("query.submit")}
                </Button>
                <Button variant="outline" data-testid="order-reset-btn" onClick={doReset}>
                  <RotateCcw className="mr-1 h-4 w-4" /> {t("common.reset")}
                </Button>
              </div>
            </div>
          </div>
        </ContentFrameSection>

        {/* ── 结果表格 ── */}
        <ContentFrameSection>
          <div className="mb-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base">
                  <FileSearch className="h-4 w-4 text-emerald-500" /> {t("query.resultTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("query.resultCount", { count: rows.length })}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast({ title: t("crud.export"), description: t("query.exported") })}>
                <Download className="mr-1 h-4 w-4" /> {t("crud.export")}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-lg border">
              <Table
                data-testid="order-table"
                className="[&_th]:border-r [&_th]:border-border [&_th:last-child]:border-r-0 [&_td]:border-r [&_td]:border-border [&_td:last-child]:border-r-0 [&_thead]:border-b [&_thead]:border-border"
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">{t("field.orderNo")}</TableHead>
                    <TableHead>{t("field.customer")}</TableHead>
                    <TableHead className="w-[110px]">{t("field.channel")}</TableHead>
                    <TableHead className="w-[110px]">
                      <button type="button" onClick={toggleSort} data-testid="order-sort-date" className={cn("inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground", sortOrder && "text-foreground")}>
                        {t("field.orderDate")} <SortIcon className="h-3.5 w-3.5" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[120px] text-right">{t("field.amount")}</TableHead>
                    <TableHead className="w-[110px]">{t("field.status")}</TableHead>
                    <TableHead className="w-[100px] text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t("query.emptyResult")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    pageRows.map((o) => (
                      <TableRow key={o.id} data-testid={`order-row-${o.no}`}>
                        <TableCell className="font-mono text-xs">{o.no}</TableCell>
                        <TableCell className="font-medium">{o.customer}</TableCell>
                        <TableCell className="text-muted-foreground">{o.channelLabel}</TableCell>
                        <TableCell className="tabular-nums text-muted-foreground">{o.date}</TableCell>
                        <TableCell className="text-right tabular-nums">¥{o.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={STATUS_VARIANT[o.status]}>{STATUS_LABEL[o.status]}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => toast({ title: t("common.detail"), description: t("query.viewDesc", { no: o.no }) })}>{t("common.detail")}</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-muted-foreground">
                {t("pagination.rangeSummary", {
                  total: rows.length,
                  from: rows.length === 0 ? 0 : (cur - 1) * pageSize + 1,
                  to: Math.min(cur * pageSize, rows.length),
                })}
              </p>
              <Pagination page={cur} pageSize={pageSize} total={rows.length} onPageChange={setPage} />
            </div>
          </div>
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
