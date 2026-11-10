import * as React from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { resolveTabMeta } from "@/components/tabs/tab-meta";

/**
 * 标签页标题（document.title）= 「<页面名> · ShardKit」
 *
 * 为什么要它：refine 的 `DocumentTitleHandler` 在 `<Refine>` 未传 title 时，
 * 会把标题写成默认兜底值 "Refine"（内页）或 "案例索引 | Refine"（首页），
 * 直接盖掉 index.html 里的静态标题。
 *
 * 页面名从哪来：**复用标签栏的同一份映射** `resolveTabMeta`（它本来就是
 * 「路径 → 标题」的唯一实现，标签栏在用）。这里不新建第二份路由→标题表，
 * 也不会与标签栏文案漂移。
 *
 * 语言：跟随 i18n.language，切语言会重算（DocumentTitleHandler 只在路由变化时跑，
 * 切语言不会更新标题，这也是换掉它的原因之一）。
 */
export function AppDocumentTitle() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  React.useLayoutEffect(() => {
    const { title } = resolveTabMeta(pathname, lang, t);
    // 未命中任何已知路由时 resolveTabMeta 兜底返回路径本身 —— 那种情况只显示品牌名
    const page = title && title !== pathname ? title : "";
    document.title = page ? `${page} · ShardKit` : "ShardKit";
  }, [pathname, lang, t]);

  return null;
}
