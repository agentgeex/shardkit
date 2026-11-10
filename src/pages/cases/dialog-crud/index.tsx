/**
 * ██ 案例目录：列表页 · 弹窗式 CRUD（dialog-crud/）
 * ────────────────────────────────────────────────────────────────────────
 * 本目录 = 一套**完全自洽、零共享**的弹窗式 CRUD 范例（对齐参照项目
 * vue-admin-tpl 的 src/views/Example/Dialog/ 语义）。
 *
 * 本目录范式：所有增删改查动作都在**列表页内以 Dialog 弹窗**完成，从不离开列表页。
 *   新建 → ProductDialog(create)  编辑 → ProductDialog(edit)（回填当前行）
 *   详情 → DetailDialog（只读）    删除 → DeleteConfirmDialog（二次确认，单条/批量共用）
 *
 * 与姊妹目录 page-crud/ 的区别（两者刻意不共享任何文件，重复也在所不惜）：
 *   - dialog-crud/（本目录，入口 /list）      ：动作在列表内弹窗完成；
 *   - page-crud/  （入口 /list-page）        ：新建/编辑/详情跳到独立页面完成。
 *   两套各自的 ProductForm / productStore / 弹窗组件都是**本目录私有的副本**，
 *   互不 import，数据也各自独立（不同 store 实例）。
 *
 * 入口路由：/list   （侧边栏「列表页 · 弹窗式 CRUD」）
 *
 * 本目录文件：
 *   index.tsx               列表页（含全部弹窗入口 + 行内工具条 + 批量操作）
 *   ProductForm.tsx         本案例私有的受控表单（+ 校验 / 与 store 的双向转换）
 *   productStore.ts         本案例私有的内存 mock 数据层（增删改查 / 分页 / 筛选 / 排序）
 *   ProductDialog.tsx       新建 / 编辑弹窗（共用外壳）
 *   DetailDialog.tsx        详情弹窗（只读）
 *   DeleteConfirmDialog.tsx 删除二次确认弹窗（单条 / 批量共用）
 *
 * 一个「和真实应用一样完整」的后台列表页：
 *   - 工具条：关键字搜索、类目下拉筛选、状态筛选、列排序
 *   - 表格：勾选行、状态徽标、行内 详情 / 编辑 / 删除
 *   - 批量操作条：选中行后出现「批量删除 / 导出选中」
 *   - 分页：上一页 / 下一页 + 页码 + 每页条数
 *   - CRUD（弹窗式，全部在列表页内完成）：
 *       新建   → ProductDialog(create)
 *       编辑   → ProductDialog(edit)（回填当前行）
 *       详情   → DetailDialog（只读全字段）
 *       删除   → DeleteConfirmDialog（二次确认；单条 / 批量共用）
 *     保存 / 删除后列表即时刷新，并弹 toast 反馈。
 *
 * 数据层：本目录 productStore.ts（内存 mock，刷新重置；与 page-crud 各自独立）
 * 表单层：本目录 ProductForm.tsx（本案例私有副本，不外借）
 *
 * 依赖：shadcn {table,input,button,badge,card,select,checkbox,separator,dialog}
 *       + page-header / status-badge + useToast
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Plus, Search, Download, Pencil, Trash2, Eye, ChevronUp, ChevronDown, X, FilePlus2, List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentFrame } from "@/components/ui/content-frame";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/ui/toast";
import type { Product } from "@/mock/data";
import {
  CATEGORY_ALL,
  PRODUCT_STATUS_OPTIONS,
  productStore,
  useProductAll,
  type ProductSortKey,
} from "./productStore";
import { toCreateInput, toPatch, type ProductFormValues } from "./ProductForm";
import { ProductDialog, type ProductDialogMode } from "./ProductDialog";
import { DetailDialog } from "./DetailDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

type SortKey = Extract<ProductSortKey, "id" | "name" | "price" | "updatedAt">;

const STATUS: { value: string; label: string }[] = [
  { value: "all", label: "全部状态" },
  ...PRODUCT_STATUS_OPTIONS,
];

export default function ListCase() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState(CATEGORY_ALL);
  const [status, setStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [selected, setSelected] = React.useState<string[]>([]);

  // 订阅 store：任何写操作（增删改）都会换引用 → 触发重算
  const storeRows = useProductAll();

  // Dialog 状态机
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState<ProductDialogMode>("create");
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [viewing, setViewing] = React.useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);

  const categories = React.useMemo(() => productStore.categories(storeRows), [storeRows]);

  React.useEffect(() => setPage(1), [q, category, status, pageSize]);

  const paged = React.useMemo(
    () =>
      productStore.list({
        keyword: q,
        category,
        status: status as Product["status"] | "all",
        page,
        pageSize,
        sort,
      }),
    [storeRows, q, category, status, page, pageSize, sort]
  );

  const { rows: current, total, totalPages } = paged;

  // 删除后页码可能越界：钳制到最后一页
  React.useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const allOnPageSelected = current.length > 0 && current.every((p) => selected.includes(p.id));
  const someOnPageSelected = current.some((p) => selected.includes(p.id));
  const headerChecked: boolean | "indeterminate" =
    allOnPageSelected ? true : someOnPageSelected ? "indeterminate" : false;

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const toggleRow = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const toggleAllOnPage = () =>
    setSelected((s) =>
      allOnPageSelected
        ? s.filter((id) => !current.some((p) => p.id === id))
        : Array.from(new Set([...s, ...current.map((p) => p.id)]))
    );

  const resetFilters = () => {
    setQ("");
    setCategory(CATEGORY_ALL);
    setStatus("all");
  };

  const hasFilters = q !== "" || category !== CATEGORY_ALL || status !== "all";

  /* ── CRUD 动作（弹窗式：全部在列表页内完成） ───────────── */

  // 弹窗式新增（列表页内）
  const openCreateDialog = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setFormMode("edit");
    setEditing(product);
    setDetailOpen(false);
    setFormOpen(true);
  };

  const openDetail = (product: Product) => {
    setViewing(product);
    setDetailOpen(true);
  };

  const handleSubmit = (values: ProductFormValues) => {
    if (formMode === "edit" && editing) {
      const updated = productStore.update(editing.id, toPatch(values));
      if (updated) {
        toast({ title: t("crud.saved"), description: `${updated.id} · ${updated.name}`, variant: "success" });
      } else {
        toast({ title: t("crud.saveFailed"), description: t("crud.recordMissing"), variant: "destructive" });
      }
    } else {
      const created = productStore.create(toCreateInput(values));
      toast({ title: t("crud.created"), description: `${created.id} · ${created.name}`, variant: "success" });
    }
    setFormOpen(false);
  };

  const openDeleteSingle = (product: Product) => {
    setDeleteIds([product.id]);
    setDeleteOpen(true);
  };

  const openDeleteBatch = () => {
    setDeleteIds(selected);
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    const ids = deleteIds;
    const removed = ids.length === 1 ? (productStore.remove(ids[0]) ? 1 : 0) : productStore.removeMany(ids);
    setDeleteOpen(false);
    setDeleteIds([]);
    setSelected((s) => s.filter((id) => !ids.includes(id)));
    toast(
      removed > 0
        ? { title: t("crud.deleted"), description: t("crud.deletedDesc", { count: removed }), variant: "success" }
        : { title: t("crud.deleteFailed"), description: t("crud.deleteFailedDesc"), variant: "destructive" }
    );
  };

  const deleteNames = deleteIds
    .map((id) => productStore.get(id)?.name)
    .filter((n): n is string => Boolean(n));

  const SortHead = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(k)}>
        {children}
        {sort.key === k ? (
          sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-20" />
        )}
      </button>
    </TableHead>
  );

  return (
    <div data-testid="list-case">

      <ContentFrame>
        {/* 工具条：搜索 + 筛选 */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("crud.searchPlaceholder")}
              className="pl-8"
              data-testid="list-search"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[160px]" data-testid="list-category"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (<SelectItem key={c} value={c}>{c === CATEGORY_ALL ? t("crud.allCategories") : c}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]" data-testid="list-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.value === "all" ? t("crud.allStatus") : s.label}</SelectItem>))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} data-testid="list-reset">
              <X className="h-3.5 w-3.5" /> {t("crud.clearFilters")}
            </Button>
          )}
          <Badge variant="secondary" className="ml-auto font-normal" data-testid="list-total">{t("crud.total", { count: total })}</Badge>
          {/* ↓ 原页头里的动作，去页头后必须搬到这里（否则功能凭空消失） */}
          <div className="flex items-center gap-2">
            <Link to="/list-page">
              <Button variant="secondary" size="sm" data-testid="goto-list-page" title={t("crud.switchToPage")}>
                <List className="h-4 w-4" /> {t("crud.pageCrud")}
              </Button>
            </Link>
            <Button variant="secondary" size="sm" data-testid="list-export">
              <Download className="h-4 w-4" /> {t("crud.export")}
            </Button>
            <Button size="sm" onClick={openCreateDialog} data-testid="create-product" title={t("crud.createInDialog")}>
              <Plus className="h-4 w-4" /> {t("crud.createProduct")}
            </Button>
          </div>
        </div>

        {/* 批量操作条 */}
        {selected.length > 0 && (
          <>
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm" data-testid="batch-bar">
              <span>{t("crud.selected")} <b className="tabular-nums">{selected.length}</b> {t("crud.items", { count: selected.length })}</span>
              <Separator orientation="vertical" className="h-4" />
              <Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /> {t("crud.exportSelected")}</Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={openDeleteBatch}
                data-testid="batch-delete"
              >
                <Trash2 className="h-3.5 w-3.5" /> {t("crud.batchDelete")}
              </Button>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSelected([])}>
                <X className="h-3.5 w-3.5" /> {t("crud.clearSelection")}
              </Button>
            </div>
          </>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]">
                <Checkbox checked={headerChecked} onCheckedChange={toggleAllOnPage} aria-label={t("crud.selectAllPage")} />
              </TableHead>
              <SortHead k="id">{t("field.productId")}</SortHead>
              <SortHead k="name">{t("field.name")}</SortHead>
              <TableHead>HS6</TableHead>
              <TableHead>{t("field.category")}</TableHead>
              <TableHead>{t("field.platform")}</TableHead>
              <SortHead k="price" className="text-right">{t("field.priceUsd")}</SortHead>
              <TableHead>{t("field.status")}</TableHead>
              <TableHead className="text-right">{t("field.actionsDialog")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody striped>
            {current.map((p) => (
              <TableRow key={p.id} data-state={selected.includes(p.id) ? "selected" : undefined} data-testid={`row-${p.id}`}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onCheckedChange={() => toggleRow(p.id)}
                    aria-label={t("crud.selectRow", { name: p.name })}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.hs6}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell><Badge variant="outline" className="font-normal">{p.platform}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{p.price.toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="view"
                      size="icon"
                      aria-label={t("common.detail")}
                      data-testid={`detail-${p.id}`}
                      onClick={() => openDetail(p)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="edit"
                      size="icon"
                      aria-label={t("common.edit")}
                      data-testid={`edit-${p.id}`}
                      onClick={() => openEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      aria-label={t("common.delete")}
                      data-testid={`delete-${p.id}`}
                      onClick={() => openDeleteSingle(p)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {current.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground" data-testid="list-empty">
                  {hasFilters ? t("crud.emptyFiltered") : t("crud.emptyPlain")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* 分页（统一采用 Pagination 组件 · 表单页同款） */}
        <Pagination
          className="mt-4"
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 30, 50, 100, 500]}
        />
      </ContentFrame>

      {/* 新建 / 编辑 */}
      <ProductDialog
        open={formOpen}
        mode={formMode}
        product={editing}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
      />

      {/* 详情（只读） */}
      <DetailDialog
        open={detailOpen}
        product={viewing}
        onOpenChange={setDetailOpen}
        onEdit={openEdit}
      />

      {/* 删除二次确认（单条 / 批量共用） */}
      <DeleteConfirmDialog
        open={deleteOpen}
        names={deleteNames}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
