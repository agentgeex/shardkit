import { useTranslation } from "react-i18next";
/**
 * 产品详情 Dialog（只读）
 * ────────────────────────────────────────────────────────────────────────────
 * - 只读展示全部字段，不含任何输入控件；
 * - 底部「关闭」+「编辑」：点编辑即切到编辑弹窗（由页面负责）。
 */
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Pencil } from "lucide-react";
import type { Product } from "./productStore";

export interface DetailDialogProps {
  open: boolean;
  product?: Product | null;
  onOpenChange: (open: boolean) => void;
  /** 点「编辑」时回调（页面切到编辑弹窗） */
  onEdit?: (product: Product) => void;
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-border/60 py-2 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`col-span-2 text-sm ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}

export function DetailDialog({ open, product, onOpenChange, onEdit }: DetailDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent surface="canvas" className="max-w-xl" data-testid="detail-dialog">
        <DialogHeader>
          <DialogTitle>{t("crud.productDetail")}</DialogTitle>
          <DialogDescription>{t("crud.detailReadonly")}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {product ? (
            <dl data-testid="detail-body">
              <Row label={t("field.productId")} value={product.id} mono />
              <Row label={t("field.productName")} value={product.name} />
              <Row label={t("field.hs6")} value={product.hs6} mono />
              <Row label={t("field.category")} value={product.category} />
              <Row label={t("field.platform")} value={<Badge variant="outline" className="font-normal">{product.platform}</Badge>} />
              <Row label={t("field.priceUsd")} value={<span className="tabular-nums">{product.price.toFixed(2)}</span>} />
              <Row label={t("field.status")} value={<StatusBadge status={product.status} />} />
              <Row label={t("field.updatedDate")} value={product.updatedAt} mono />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{t("crud.notSelected")}</p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="detail-dialog-close"
          >
            {t("common.close")}
          </Button>
          {product && onEdit && (
            <Button type="button" onClick={() => onEdit(product)} data-testid="detail-dialog-edit">
              <Pencil className="h-4 w-4" /> {t("common.edit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
