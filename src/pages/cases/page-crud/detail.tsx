/**
 * 页面案例：产品详情（Page 式 · 只读）
 * ────────────────────────────────────────────────────────────────────────────
 * 属于「列表页 · 页面式 CRUD 」（/list-page）的隐藏子路由（不进侧边栏菜单），
 * 与「列表页 · 弹窗式 CRUD 」（/list）的行内弹窗详情并存：
 *   - Dialog 式：/list 列表行内眼睛图标，弹窗只读；
 *   - Page 式：/list-page/:id，整页只读展示全部字段，带返回；页头「编辑」直达
 *     /list-page/:id/edit。
 *
 * 路由：/list-page/:id（只读）
 */
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { useProduct } from "./productStore";

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm"}>{value}</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = useProduct(id);

  const goBack = () => navigate("/list-page");

  if (!product) {
    return (
      <div data-testid="page-detail-missing" className="flex flex-col gap-2">
        <PageHeader title={t("crud.productDetail")} description={t("crud.missingProductDesc", { id: id ?? "" })} />
        <ContentFrame padding={5}>
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("crud.productMissing")}</p>
            <Button variant="back" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" /> {t("crud.backToList")}
            </Button>
          </div>
        </ContentFrame>
      </div>
    );
  }

  return (
    <div data-testid="page-detail" className="flex flex-col gap-2">
      <PageHeader
        title={t("crud.productDetail")}
        description={t("crud.detailDesc", { id: product.id })}
        actions={
          <>
            <Button
              variant="edit"
              size="sm"
              onClick={() => navigate(`/list-page/${product.id}/edit`)}
              data-testid="page-detail-edit"
            >
              <Pencil className="h-4 w-4" /> {t("common.edit")}
            </Button>
            {/* 返回永远是最后一个元素 */}
            <Button variant="back" size="sm" onClick={goBack} data-testid="page-detail-back">
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Button>
          </>
        }
      />

      <ContentFrame padding={5}>
        {/* 白框内不再套卡片：分区用横线，最后一块不画线 */}
        <ContentFrameSection>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="min-w-0 truncate text-base font-semibold">{product.name}</h2>
              <StatusBadge status={product.status} />
              <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{product.id}</span>
            </div>
            <Badge variant="outline" className="font-normal">{product.platform}</Badge>
          </div>
        </ContentFrameSection>

        <ContentFrameSection>
          <dl className="grid gap-x-8 sm:grid-cols-2" data-testid="page-detail-body">
            <Field label={t("field.productId")} value={product.id} mono />
            <Field label={t("field.productName")} value={product.name} />
            <Field label={t("field.hs6")} value={product.hs6} mono />
            <Field label={t("field.category")} value={product.category} />
            <Field label={t("field.platform")} value={<Badge variant="outline" className="font-normal">{product.platform}</Badge>} />
            <Field label={t("field.priceUsd")} value={<span className="tabular-nums">{product.price.toFixed(2)}</span>} />
            <Field label={t("field.status")} value={<StatusBadge status={product.status} />} />
            <Field label={t("field.updatedDate")} value={product.updatedAt} mono />
          </dl>
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
