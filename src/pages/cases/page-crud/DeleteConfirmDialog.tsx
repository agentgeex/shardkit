import { useTranslation } from "react-i18next";
/**
 * 删除确认 Dialog（单条 / 批量 共用）
 * ────────────────────────────────────────────────────────────────────────────
 * - 二次确认：明确列出将删除的记录（单条显示名称，批量显示数量 + 前若干名称）；
 * - 确认按钮为 destructive；点击后调 onConfirm() 由页面落库 + toast。
 */
import { AlertTriangle } from "lucide-react";
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

export interface DeleteConfirmDialogProps {
  open: boolean;
  /** 待删除记录的名称列表（单条 1 个；批量 N 个） */
  names: string[];
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ open, names, onOpenChange, onConfirm }: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const count = names.length;
  const isBatch = count > 1;
  const preview = names.slice(0, 5).join("、");
  const more = count > 5 ? t("crud.moreItems", { count }) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="delete-confirm-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {isBatch ? t("crud.deleteTitleBatch", { count }) : t("crud.deleteTitleSingle")}
          </DialogTitle>
          <DialogDescription>
            {isBatch ? t("crud.deleteDescBatch") : t("crud.deleteDescSingle")}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t("crud.willDelete")}</span>
            <span className="font-medium">
              {isBatch ? `${preview}${more}` : names[0]}
            </span>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="delete-confirm-cancel"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            data-testid="delete-confirm-submit"
          >
            {t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
