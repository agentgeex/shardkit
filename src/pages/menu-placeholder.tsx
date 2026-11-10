/**
 * pages/menu-placeholder.tsx — 多级菜单的「空白占位页」（统一骨架，批量复用）
 *
 * 说明（维护者需求：「每个菜单对应一个空的页面」）：
 *   - 所有叶子菜单共用这一个组件 —— 批量生成，不各写各的
 *   - 内容 = 面包屑（体现层级） + 标题（菜单名） + 一句占位说明
 *   - 不做任何业务内容，目的只是把「多级菜单的层级结构与路由」跑通
 */
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, FileQuestion } from "lucide-react";
import { ContentFrame } from "@/components/ui/content-frame";
import { Badge } from "@/components/ui/badge";
import { menuTrailKeys } from "@/lib/menu-tree";
import { useTranslation } from "react-i18next";

export default function MenuPlaceholderPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const trailKeys = menuTrailKeys(pathname);
  const title = trailKeys.length ? t(trailKeys[trailKeys.length - 1]) : t("menu.placeholderTitle");

  return (
    <div data-testid="menu-placeholder" className="flex flex-col">
      <ContentFrame>
      {/* 面包屑：直观体现当前页所处的菜单层级（页头已去，标题由导航高亮承担） */}
      <nav
        className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        data-testid="menu-breadcrumb"
      >
        {trailKeys.map((key, i) => (
          <span key={`${key}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
            <span className={i === trailKeys.length - 1 ? "font-medium text-foreground" : ""}>
              {t(key)}
            </span>
          </span>
        ))}
      </nav>

      <div
        className="flex flex-col items-center justify-center gap-3 border-t border-border pt-16 pb-16 text-center"
        data-testid="menu-placeholder-body"
      >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-base font-medium">{t("menu.placeholderHeading", { title })}</div>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("menu.placeholderDesc")}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {t("menu.levelCount", { count: trailKeys.length })}
            </Badge>
            <Badge variant="outline" className="font-mono font-normal">
              {pathname}
            </Badge>
          </div>
          <Link
            to="/menu"
            className="mt-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("menu.backToMenu")}
          </Link>
      </div>
      </ContentFrame>
    </div>
  );
}
