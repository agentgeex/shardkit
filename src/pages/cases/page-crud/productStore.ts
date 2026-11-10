/**
 * 产品集合 · 内存 mock store
 * ────────────────────────────────────────────────────────────────────────────
 * 定位：本案例（页面式 CRUD）**私有**的内存 mock 数据层（刷新重置）；与姊妹目录 dialog-crud 各自独立。
 *
 * 目标：
 *   - 把「产品集合的增删改查 + 分页 / 筛选 / 排序」收敛到一处，页面只负责渲染；
 *   - 对外暴露两套入口：
 *       ① 纯函数 API（可在事件回调 / 非 React 环境直接调用）：
 *          listProducts / getProduct / createProduct / updateProduct / deleteProduct /
 *          deleteProducts / resetProducts / getCategoryOptions / generateProductId
 *       ② React Hook（订阅 store，任何写操作自动触发重渲染）：
 *          useProducts(query) / useProduct(id) / useProductAll()
 *
 * 数据来源：@/mock/data 的 products 作为种子（seed），首次 import 时浅拷贝进内存，
 *          之后的读写都作用于内存副本，不污染 mock 常量。
 *
 * 注意：本文件为「基础设施」，不含任何 UI。
 */

import * as React from "react";
import { products as seedProducts, type Product } from "@/mock/data";

export type { Product };
export type ProductStatus = Product["status"];
export type ProductSortKey = keyof Pick<
  Product,
  "id" | "name" | "hs6" | "category" | "platform" | "price" | "status" | "updatedAt"
>;

export interface ProductSort {
  key: ProductSortKey;
  dir: "asc" | "desc";
}

export interface ProductQuery {
  /** 关键字：匹配名称 / HS6 / 类目 / ID（大小写不敏感） */
  keyword?: string;
  /** 类目筛选；"全部类目" 或留空 = 不过滤 */
  category?: string;
  /** 状态筛选；"all" 或留空 = 不过滤 */
  status?: ProductStatus | "all";
  /** 页码（1-based），默认 1 */
  page?: number;
  /** 每页条数，默认 10 */
  pageSize?: number;
  /** 排序，默认 { key: "id", dir: "asc" } */
  sort?: ProductSort;
}

export interface Paged<T> {
  rows: T[];
  /** 筛选后总数（未分页） */
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 新建入参（id / updatedAt 可缺省，由 store 生成） */
export interface ProductCreateInput {
  name: string;
  hs6: string;
  category: string;
  platform: string;
  price: number;
  status: ProductStatus;
  /** 不传则自动生成 P-xxxx */
  id?: string;
  /** 不传则取当天 YYYY-MM-DD */
  updatedAt?: string;
}

/** 更新入参（局部） */
export type ProductUpdateInput = Partial<ProductCreateInput>;

/** 类目筛选下拉的固定首项 */
export const CATEGORY_ALL = "全部类目";

/** 状态选项（列表页筛选 / 表单下拉共用） */
export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "在售 active" },
  { value: "draft", label: "草稿 draft" },
  { value: "offline", label: "下架 offline" },
];

export const DEFAULT_SORT: ProductSort = { key: "id", dir: "asc" };

/* ── 内部状态 ─────────────────────────────────────────────── */

/** 深拷贝种子，避免污染 @/mock/data 常量 */
function cloneSeed(): Product[] {
  return seedProducts.map((p) => ({ ...p }));
}

let state: Product[] = cloneSeed();

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

/* ── 订阅（供 useSyncExternalStore 使用） ─────────────────── */

/** 订阅 store 变更；返回取消订阅函数 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 当前快照（引用稳定：仅在写操作后更换引用） */
export function getSnapshot(): Product[] {
  return state;
}

/* ── 工具函数 ─────────────────────────────────────────────── */

/** 当天日期 YYYY-MM-DD */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 生成下一个产品 ID：扫描现有 P-#### 取最大序号 +1（不足 4 位补零） */
export function generateProductId(rows: Product[] = state): string {
  let max = 1000;
  for (const p of rows) {
    const m = /^P-(\d+)$/.exec(p.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `P-${String(max + 1).padStart(4, "0")}`;
}

/** 类目下拉选项：["全部类目", ...去重类目]（保持首次出现顺序） */
export function getCategoryOptions(rows: Product[] = state): string[] {
  const set = new Set<string>();
  for (const p of rows) set.add(p.category);
  return [CATEGORY_ALL, ...Array.from(set)];
}

/** 关键字命中判断（名称 / HS6 / 类目 / ID） */
function hitKeyword(p: Product, kw: string): boolean {
  const k = kw.trim().toLowerCase();
  if (!k) return true;
  return (
    p.name.toLowerCase().includes(k) ||
    p.hs6.toLowerCase().includes(k) ||
    p.category.toLowerCase().includes(k) ||
    p.id.toLowerCase().includes(k)
  );
}

/* ── 纯函数：筛选 / 排序 / 分页 ───────────────────────────── */

/** 按 query 过滤 + 排序（不分页），返回新数组 */
export function filterAndSort(rows: Product[], query: ProductQuery = {}): Product[] {
  const { keyword = "", category = CATEGORY_ALL, status = "all", sort = DEFAULT_SORT } = query;

  const filtered = rows.filter((p) => {
    const hitCat = !category || category === CATEGORY_ALL || p.category === category;
    const hitStatus = !status || status === "all" || p.status === status;
    return hitKeyword(p, keyword) && hitCat && hitStatus;
  });

  const dir = sort.dir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const va = a[sort.key];
    const vb = b[sort.key];
    if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });
}

/** 通用分页：page 会被钳制到 [1, totalPages] */
export function paginate<T>(rows: T[], page = 1, pageSize = 10): Paged<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page)), totalPages);
  return {
    rows: rows.slice((current - 1) * size, current * size),
    total,
    page: current,
    pageSize: size,
    totalPages,
  };
}

/* ── 纯函数 API：CRUD ─────────────────────────────────────── */

/** 查询（筛选 + 排序 + 分页一步到位） */
export function listProducts(query: ProductQuery = {}): Paged<Product> {
  return paginate(filterAndSort(state, query), query.page ?? 1, query.pageSize ?? 10);
}

/** 按 ID 取单条 */
export function getProduct(id: string): Product | undefined {
  return state.find((p) => p.id === id);
}

/** 新增产品（不传 id 自动生成；不传 updatedAt 取当天）——返回新增后的记录 */
export function createProduct(input: ProductCreateInput): Product {
  const product: Product = {
    id: input.id?.trim() || generateProductId(),
    name: input.name.trim(),
    hs6: input.hs6.trim(),
    category: input.category.trim(),
    platform: input.platform.trim(),
    price: Number(input.price) || 0,
    status: input.status,
    updatedAt: input.updatedAt || todayISO(),
  };
  state = [product, ...state];
  emit();
  return product;
}

/** 更新产品（局部字段）——返回更新后的记录；找不到返回 undefined */
export function updateProduct(id: string, patch: ProductUpdateInput): Product | undefined {
  let updated: Product | undefined;
  state = state.map((p) => {
    if (p.id !== id) return p;
    updated = {
      ...p,
      ...patch,
      id: p.id, // ID 不允许被 patch 改写
      name: patch.name !== undefined ? patch.name.trim() : p.name,
      hs6: patch.hs6 !== undefined ? patch.hs6.trim() : p.hs6,
      category: patch.category !== undefined ? patch.category.trim() : p.category,
      platform: patch.platform !== undefined ? patch.platform.trim() : p.platform,
      price: patch.price !== undefined ? Number(patch.price) || 0 : p.price,
      updatedAt: patch.updatedAt || todayISO(),
    };
    return updated;
  });
  if (updated) emit();
  return updated;
}

/** 删除单条——返回是否命中 */
export function deleteProduct(id: string): boolean {
  const before = state.length;
  state = state.filter((p) => p.id !== id);
  const changed = state.length !== before;
  if (changed) emit();
  return changed;
}

/** 批量删除——返回实际删除条数 */
export function deleteProducts(ids: string[]): number {
  if (!ids.length) return 0;
  const set = new Set(ids);
  const before = state.length;
  state = state.filter((p) => !set.has(p.id));
  const removed = before - state.length;
  if (removed > 0) emit();
  return removed;
}

/** 重置为种子数据（用于演示「刷新重置」或测试） */
export function resetProducts(): void {
  state = cloneSeed();
  emit();
}

/* ── React Hooks ──────────────────────────────────────────── */

/** 订阅完整集合（极少用；多数场景用 useProducts 直接拿分页结果） */
export function useProductAll(): Product[] {
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 订阅「筛选 + 排序 + 分页」后的结果。
 * 任何写操作（增删改）都会触发重渲染。
 */
export function useProducts(query: ProductQuery = {}): Paged<Product> {
  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const {
    keyword = "",
    category = CATEGORY_ALL,
    status = "all",
    page = 1,
    pageSize = 10,
    sort = DEFAULT_SORT,
  } = query;

  const sortKey = sort.key;
  const sortDir = sort.dir;

  return React.useMemo(
    () =>
      listProducts({
        keyword,
        category,
        status,
        page,
        pageSize,
        sort: { key: sortKey, dir: sortDir },
      }),
    // snapshot 变化（写操作）即需要重算
    [snapshot, keyword, category, status, page, pageSize, sortKey, sortDir]
  );
}

/** 订阅单条记录 */
export function useProduct(id: string | undefined | null): Product | undefined {
  const snapshot = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return React.useMemo(
    () => (id ? snapshot.find((p) => p.id === id) : undefined),
    [snapshot, id]
  );
}

/** 便捷聚合：一次拿到全部操作 + 选择态无关（纯 store API） */
export const productStore = {
  subscribe,
  getSnapshot,
  list: listProducts,
  get: getProduct,
  create: createProduct,
  update: updateProduct,
  remove: deleteProduct,
  removeMany: deleteProducts,
  reset: resetProducts,
  categories: getCategoryOptions,
  nextId: generateProductId,
  today: todayISO,
};
