/**
 * 产品表单 · 可复用受控组件
 * ────────────────────────────────────────────────────────────────────────────
 * 定位：本案例（弹窗式 CRUD）**私有**的受控表单副本；姊妹目录 page-crud 另有一份，二者互不 import。
 *       Dialog 与 Page 两种外壳只负责容器/页脚，字段与校验全部收敛在此。
 *
 * 设计：
 *   - 纯受控：字段值由外部 value 提供，改动经 onChange 回传（受控 = 单一数据源）；
 *   - 校验独立可测：validateProductForm(values) 返回字段错误表，页面据此显示；
 *   - 与 store 解耦：表单用字符串承载输入（price 为字符串利于编辑），
 *     通过 toFormValues / toCreateInput / toPatch 与 Product 双向转换。
 *
 * 无 UI 外壳依赖：仅用 shadcn {input,select,label} + lucide 图标。
 */

import * as React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Product, ProductCreateInput, ProductStatus, ProductUpdateInput } from "./productStore";
import { PRODUCT_STATUS_OPTIONS, todayISO } from "./productStore";

/* ── 类型 ─────────────────────────────────────────────────── */

/** 表单值（全部以字符串承载，便于受控编辑；提交时再转换） */
export interface ProductFormValues {
  id: string;
  name: string;
  hs6: string;
  category: string;
  platform: string;
  price: string;
  status: ProductStatus;
  updatedAt: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export interface ProductFormProps {
  value: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  /** 校验错误表（由页面调用 validateProductForm 后回填） */
  errors?: ProductFormErrors;
  disabled?: boolean;
  /** 是否展示只读 ID 字段（编辑态常见）；默认 true */
  showId?: boolean;
  /** 单独禁用 ID 输入（编辑态：ID 只读，其余字段仍可编辑） */
  idDisabled?: boolean;
  className?: string;
}

/* ── 常量与转换 ───────────────────────────────────────────── */

/** 平台下拉选项（与 mock 数据保持一致，另补常见平台） */
export const PLATFORM_OPTIONS = [
  "Amazon",
  "Shopee",
  "TikTok Shop",
  "eBay",
  "Temu",
  "SHEIN",
] as const;

/** 新建时的空表单 */
export function emptyProductForm(): ProductFormValues {
  return {
    id: "",
    name: "",
    hs6: "",
    category: "",
    platform: "",
    price: "",
    status: "draft",
    updatedAt: todayISO(),
  };
}

/** Product → 表单值（编辑态预填） */
export function toFormValues(product: Product): ProductFormValues {
  return {
    id: product.id,
    name: product.name,
    hs6: product.hs6,
    category: product.category,
    platform: product.platform,
    price: String(product.price),
    status: product.status,
    updatedAt: product.updatedAt,
  };
}

/** 表单值 → 新建入参（含 price 数值化） */
export function toCreateInput(values: ProductFormValues): ProductCreateInput {
  return {
    id: values.id.trim() || undefined,
    name: values.name,
    hs6: values.hs6,
    category: values.category,
    platform: values.platform,
    price: Number(values.price) || 0,
    status: values.status,
    updatedAt: values.updatedAt || todayISO(),
  };
}

/** 表单值 → 更新入参（不含 id） */
export function toPatch(values: ProductFormValues): ProductUpdateInput {
  return {
    name: values.name,
    hs6: values.hs6,
    category: values.category,
    platform: values.platform,
    price: Number(values.price) || 0,
    status: values.status,
    updatedAt: values.updatedAt || todayISO(),
  };
}

/* ── 校验 ─────────────────────────────────────────────────── */

const HS6_RE = /^\d{4}\.\d{2}$/;

/** 表单校验：返回字段错误表（空对象 = 通过） */
export function validateProductForm(
  values: ProductFormValues,
  t: (key: string) => string
): ProductFormErrors {
  const e: ProductFormErrors = {};

  if (!values.name.trim()) e.name = t("productForm.nameRequired");
  else if (values.name.trim().length < 2) e.name = t("productForm.nameMin");

  if (!values.hs6.trim()) e.hs6 = t("productForm.hs6Required");
  else if (!HS6_RE.test(values.hs6.trim())) e.hs6 = t("productForm.hs6Format");

  if (!values.category.trim()) e.category = t("productForm.categoryRequired");
  if (!values.platform.trim()) e.platform = t("productForm.platformRequired");

  const priceRaw = values.price.trim();
  if (!priceRaw) e.price = t("productForm.priceRequired");
  else if (Number.isNaN(Number(priceRaw))) e.price = t("productForm.priceNumeric");
  else if (Number(priceRaw) < 0) e.price = t("productForm.priceNegative");

  if (!values.status) e.status = t("productForm.statusRequired");
  if (!values.updatedAt) e.updatedAt = t("productForm.updatedRequired");

  return e;
}

/* ── 字段小wrapper ────────────────────────────────────────── */

function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-[8em_1fr] sm:items-start", className)}>
      <Label
        htmlFor={htmlFor}
        className={cn(
          "flex items-center justify-end gap-0.5 pt-1.5 sm:text-right",
          required && "before:text-destructive before:content-['*']"
        )}
      >
        {label}
      </Label>
      <div className="space-y-1.5">
        {children}
        {error ? (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        ) : hint ? (
          <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/* ── 组件 ─────────────────────────────────────────────────── */

/**
 * 产品表单（受控）。
 * 用法：
 *   const [values, setValues] = React.useState(emptyProductForm());
 *   const [errors, setErrors] = React.useState<ProductFormErrors>({});
 *   <ProductForm value={values} onChange={setValues} errors={errors} />
 */
export function ProductForm({
  value,
  onChange,
  errors = {},
  disabled = false,
  showId = true,
  idDisabled = false,
  className,
}: ProductFormProps) {
  const { t } = useTranslation();
  const set = <K extends keyof ProductFormValues>(key: K, v: ProductFormValues[K]) =>
    onChange({ ...value, [key]: v });

  const idPrefix = React.useId();

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {showId && (
          <Field
            label={t("field.productId")}
            htmlFor={`${idPrefix}-id`}
            hint={t("productForm.hintId")}
            error={errors.id}
          >
            <Input
              id={`${idPrefix}-id`}
              value={value.id}
              placeholder={t("productForm.phAuto")}
              onChange={(e) => set("id", e.target.value)}
              disabled={disabled || idDisabled}
              className="font-mono"
            />
          </Field>
        )}

        <Field label={t("field.productName")} htmlFor={`${idPrefix}-name`} required error={errors.name}>
          <Input
            id={`${idPrefix}-name`}
            value={value.name}
            placeholder={t("productForm.phName")}
            onChange={(e) => set("name", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("field.hs6")}
          htmlFor={`${idPrefix}-hs6`}
          required
          hint={t("productForm.hintHs6")}
          error={errors.hs6}
        >
          <Input
            id={`${idPrefix}-hs6`}
            value={value.hs6}
            placeholder="8517.12"
            onChange={(e) => set("hs6", e.target.value)}
            disabled={disabled}
            className="font-mono"
          />
        </Field>

        <Field label={t("field.category")} htmlFor={`${idPrefix}-category`} required error={errors.category}>
          <Input
            id={`${idPrefix}-category`}
            value={value.category}
            placeholder={t("productForm.phCategory")}
            onChange={(e) => set("category", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("field.platform")} required error={errors.platform}>
          <Select
            value={value.platform}
            onValueChange={(v) => set("platform", v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("productForm.phPlatform")} />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("field.status")} required error={errors.status}>
          <Select
            value={value.status}
            onValueChange={(v) => set("status", v as ProductStatus)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("productForm.phStatus")} />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("field.priceUsd")} htmlFor={`${idPrefix}-price`} required error={errors.price}>
          <Input
            id={`${idPrefix}-price`}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={value.price}
            placeholder="0.00"
            onChange={(e) => set("price", e.target.value)}
            disabled={disabled}
            className="tabular-nums"
          />
        </Field>

        <Field
          label={t("field.updatedDate")}
          htmlFor={`${idPrefix}-updatedAt`}
          required
          error={errors.updatedAt}
        >
          <Input
            id={`${idPrefix}-updatedAt`}
            type="date"
            value={value.updatedAt}
            onChange={(e) => set("updatedAt", e.target.value)}
            disabled={disabled}
          />
        </Field>
      </div>
    </div>
  );
}
