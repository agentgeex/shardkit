/**
 * 产品编辑 Dialog（新建 / 编辑 共用）
 * ────────────────────────────────────────────────────────────────────────────
 * - mode="create"：空表单，ID 可留空（提交后系统生成）；
 * - mode="edit"  ：回填当前行，ID 只读；
 * - 提交前跑 validateProductForm；校验不过 → 就地显示字段错误，不关闭；
 * - 校验通过 → 调 onSubmit(values)，由页面调用 store 落库并关窗。
 *
 * 依赖：Dialog 底座 + 可复用 ProductForm。
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product } from "./productStore";
import {
  ProductForm,
  emptyProductForm,
  toFormValues,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "./ProductForm";

export type ProductDialogMode = "create" | "edit";

export interface ProductDialogProps {
  open: boolean;
  mode: ProductDialogMode;
  /** 编辑态：待编辑行 */
  product?: Product | null;
  onOpenChange: (open: boolean) => void;
  /** 校验通过后回调（页面负责落库 + toast + 关闭） */
  onSubmit: (values: ProductFormValues) => void;
}

export function ProductDialog({ open, mode, product, onOpenChange, onSubmit }: ProductDialogProps) {
  const { t } = useTranslation();
  const [values, setValues] = React.useState<ProductFormValues>(emptyProductForm);
  const [errors, setErrors] = React.useState<ProductFormErrors>({});

  // 每次打开（或目标行变化）时重置表单
  React.useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      mode === "edit" && product ? toFormValues(product) : { ...emptyProductForm() }
    );
  }, [open, mode, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateProductForm(values, t);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      // 聚焦到首个错误字段（若可定位）
      return;
    }
    onSubmit(values);
  };

  const isEdit = mode === "edit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent surface="canvas" className="max-w-2xl" data-testid="product-dialog">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("crud.editProduct") : t("crud.createProduct")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("productForm.dialogEditDesc") : t("productForm.dialogCreateDesc")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <form id="product-form" onSubmit={handleSubmit}>
            <ProductForm
              value={values}
              onChange={setValues}
              errors={errors}
              showId
              idDisabled={isEdit}
            />
          </form>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="product-dialog-cancel"
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="product-form" data-testid="product-dialog-submit">
            {isEdit ? t("common.save") : t("crud.createDesc")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
