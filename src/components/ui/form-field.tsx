import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * 全站统一表单排布原语（shardkit 规范）
 * ─────────────────────────────────────────────────────────────
 * 规范（2026-09-29 维护者定，参考 vue-admin-tpl「组件→表单→全部示例」）：
 *   ① 标签与输入框一律【左右排列】（span 水平：label 左、control 右）
 *   ② 标签【右对齐】：同一列所有标签右边界对齐成一条竖线
 *      → 不同字数标签也能对齐，所有输入框左边界一致
 *   ③ 标签列宽固定 8em（≈128px，可容纳约 8 个汉字，长标签不换行）
 *   ④ 标签↔输入框间距统一 gap-3（12px）
 *   ⑤ 必填红星 * 内联在标签文字【左侧】（::before），右对齐下不影响成列
 *
 * 用法：
 *   // 行式（每行一个字段）
 *   <FormRow label="文本输入" htmlFor="f-text" hint="基础文本">
 *     <Input id="f-text" />
 *   </FormRow>
 *
 *   // 多列栅格（一行 1/2/3 个字段）
 *   <FormGrid cols={2}>
 *     <FormField label="公司全称" htmlFor="c-name"><Input id="c-name" /></FormField>
 *     <FormField label="企业简称" htmlFor="c-code" required><Input id="c-code" /></FormField>
 *   </FormGrid>
 *
 * 窄屏（< sm）自动降级为标签在上、控件在下（同 vue-admin-tpl 移动端 top 布局）。
 */

const LABEL_COL = "8em";
const FIELD_GRID = `grid gap-3 sm:grid-cols-[${LABEL_COL}_1fr] sm:items-start`;

/** 标签本体：右对齐 + 必填 * 在左（::before） */
function FieldLabel({
  label, htmlFor, required, className,
}: {
  label: string; htmlFor?: string; required?: boolean; className?: string;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      data-field-label
      className={cn(
        "flex items-center justify-end gap-0.5",
        required && "before:text-destructive before:content-['*']",
        className
      )}
    >
      {label}
    </Label>
  );
}

/** 行式字段：每行 「标签 左 + 控件 右」 */
export function FormRow({
  label, htmlFor, required, hint, error, children, className, ...rest
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(FIELD_GRID, className)} data-testid={`row-${label}`} {...rest}>
      <div className="space-y-0.5 pt-1.5 sm:text-right">
        <FieldLabel label={label} htmlFor={htmlFor} required={required} />
        {hint ? <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="space-y-1.5">
        {children}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}

/** 多列栅格容器：一行放几个字段（cols=1/2/3/4，响应式降级） */
export function FormGrid({
  cols = 1, gap = "md", children, className, ...rest
}: {
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const colsCls = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols];
  const gapCls = { sm: "gap-3", md: "gap-4", lg: "gap-6" }[gap];
  return (
    <div className={cn("grid items-start", colsCls, gapCls, className)} data-cols={cols} {...rest}>
      {children}
    </div>
  );
}

/** 栅格单元：栅格中的一个字段 = 「标签 左 + 控件 右」 */
export function FormField({
  label, htmlFor, required, hint, error, children, className, ...rest
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(FIELD_GRID, className)} data-testid={`field-${label}`} {...rest}>
      <FieldLabel label={label} htmlFor={htmlFor} required={required} className="pt-1.5 text-sm" />
      <div className="space-y-1.5">
        {children}
        {hint ? <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}

export { FieldLabel };
