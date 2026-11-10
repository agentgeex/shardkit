/**
 * 页面案例：产品编辑（Page 式）
 * ────────────────────────────────────────────────────────────────────────────
 * 属于「列表页 · 页面式 CRUD 」（/list-page）的隐藏子路由（不进侧边栏菜单），
 * 与「列表页 · 弹窗式 CRUD 」（/list）的行内弹窗编辑并存：
 *   - Dialog 式：/list 列表行内铅笔图标，弹窗回填；
 *   - Page 式：/list-page/:id/edit，整页回填，产品 ID 只读，保存后跳回 /list-page 并 toast。
 *
 * 路由：/list-page/:id/edit
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, SearchX } from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/components/ui/toast";
import { productStore, useProduct } from "./productStore";
import {
  ProductForm,
  toFormValues,
  toPatch,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from "./ProductForm";

export default function ProductEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 订阅单条：store 中不存在（如手输错误 ID）时为 undefined
  const product = useProduct(id);

  const [values, setValues] = React.useState<ProductFormValues | null>(null);
  const [errors, setErrors] = React.useState<ProductFormErrors>({});

  // 记录本页加载时的目标 ID：切换路由后重置表单
  const loadedId = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (!product) return;
    if (loadedId.current === product.id) return;
    loadedId.current = product.id;
    setValues(toFormValues(product));
    setErrors({});
  }, [product]);

  const goBack = () => navigate("/list-page");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    const errs = validateProductForm(values, t);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const updated = productStore.update(id as string, toPatch(values));
    if (updated) {
      toast({ title: t("crud.saved"), description: `${updated.id} · ${updated.name}`, variant: "success" });
    } else {
      toast({ title: t("crud.saveFailed"), description: t("crud.recordMissing"), variant: "destructive" });
    }
    navigate("/list-page");
  };

  if (!product) {
    return (
      <div data-testid="page-edit-missing" className="flex flex-col gap-2">
        <PageHeader title={t("crud.editProduct")} description={t("crud.missingProductDesc", { id: id ?? "" })} />
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
    <div data-testid="page-edit" className="flex flex-col gap-2">
      <PageHeader
        title={t("crud.editProduct")}
        description={t("crud.editDesc", { id: product.id })}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={goBack} data-testid="page-edit-back">
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </Button>
            <Button variant="ghost" size="sm" onClick={goBack} data-testid="page-edit-cancel">
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="product-page-form" size="sm" data-testid="page-edit-submit">
              <Save className="h-4 w-4" /> {t("common.save")}
            </Button>
          </>
        }
      />

      <ContentFrame padding={5}>
        <ContentFrameSection>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{t("crud.productInfo")}</h2>
            <p className="text-sm text-muted-foreground">{t("crud.productIdReadonly")}</p>
          </div>
          {values ? (
            <form id="product-page-form" onSubmit={handleSubmit} data-testid="page-form">
              <ProductForm value={values} onChange={setValues} errors={errors} showId idDisabled />
            </form>
          ) : null}
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
