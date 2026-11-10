/**
 * 页面案例：产品新建（Page 式）
 * ────────────────────────────────────────────────────────────────────────────
 * 属于「列表页 · 页面式 CRUD 」（/list-page）的隐藏子路由（不进侧边栏菜单），
 * 与「列表页 · 弹窗式 CRUD 」（/list）的弹窗新建并存，二者行为清晰区分：
 *   - Dialog 式（/list 列表页头部主按钮）：弹窗就地完成，不离开列表页；
 *   - Page 式（/list-page 头部主按钮 → /list-page/new）：独立路由页面，
 *     含页面标题 / 返回 / 保存 / 取消，保存成功后跳回 /list-page 并弹 toast 提示。
 *
 * 复用：本目录 ProductForm.tsx（本案例私有）+ productStore.ts（本案例私有）。
 * 路由：/list-page/new
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/ui/toast";
import { productStore } from "./productStore";
import {
  ProductForm,
  emptyProductForm,
  toCreateInput,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "./ProductForm";

export default function ProductNewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [values, setValues] = React.useState<ProductFormValues>(emptyProductForm);
  const [errors, setErrors] = React.useState<ProductFormErrors>({});

  const goBack = () => navigate("/list-page");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateProductForm(values, t);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const created = productStore.create(toCreateInput(values));
    toast({ title: t("crud.created"), description: `${created.id} · ${created.name}`, variant: "success" });
    navigate("/list-page");
  };

  return (
    <div data-testid="page-new" className="flex flex-col gap-2">
      <PageHeader
        title={t("crud.createProduct")}
        description={t("crud.newDesc")}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={goBack} data-testid="page-new-back">
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Button>
            <Button variant="ghost" size="sm" onClick={goBack} data-testid="page-new-cancel">
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="product-page-form" size="sm" data-testid="page-new-submit">
              <Save className="h-4 w-4" /> {t("common.save")}
            </Button>
          </>
        }
      />

      <ContentFrame padding={5}>
        <ContentFrameSection>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{t("crud.productInfo")}</h2>
            <p className="text-sm text-muted-foreground">{t("crud.newHint")}</p>
          </div>
          <form id="product-page-form" onSubmit={handleSubmit} data-testid="page-form">
            <ProductForm value={values} onChange={setValues} errors={errors} showId />
          </form>
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
