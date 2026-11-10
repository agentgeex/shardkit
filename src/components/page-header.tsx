import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ██ PageHeader —— 页头
 * ────────────────────────────────────────────────────────────────────────
 * 2026-10-28 采纳《页面排版-白框模式》规范 §4，新增 `layout` 两档：
 *
 *   inline（默认，新写法）  标题 + 说明**同行紧跟**（gap-x-3 = 12px），底对齐。
 *                          页头不设下边距（mb-0），间距交给页面容器 `gap-2`（8px）。
 *                          用于**详情页 / 表单页**（它们必须保留页头 = 实体身份）。
 *
 *   stacked（旧写法，兼容） 标题与说明上下堆叠、左右两端对齐、`mb-6`。
 *                          只为未迁移的存量页面保留；新页面不要用。
 *
 * ⚠️ 实测调出来的三个数，别改：
 *   1. `items-end` 不能省 —— 少了它，20px 标题与 14px 说明会变成"中间对齐"，说明会"飘"；
 *   2. 说明必须**紧跟标题右侧 12px** —— 曾用 `justify-between` 推到最右，被否：
 *      「放右边就没效果了」；
 *   3. 说明字号锁 `text-sm`（14px），不要为了配合标题缩小。
 *
 * ⚠️ 列表页**不要用本组件**：列表页去掉页头，内容装 `ContentFrame`。
 *    页头里的按钮（视图切换 / 新建 / 统计计数）要搬到内容区顶部工具行的**最右侧**，
 *    否则"去页头"会把功能一起删掉（这是最容易翻车的一步）。
 */
export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** 排版：inline = 标题与说明同行（详情/表单页默认）｜stacked = 上下堆叠（存量兼容） */
  layout?: "inline" | "stacked";
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  layout = "inline",
  className,
}: PageHeaderProps) {
  if (layout === "stacked") {
    return (
      <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    );
  }

  return (
    <div
      data-testid="page-header"
      className={cn("mb-0 flex flex-wrap items-end gap-x-3 gap-y-1", className)}
    >
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}
