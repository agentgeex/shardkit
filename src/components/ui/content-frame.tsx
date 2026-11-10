import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ██ ContentFrame —— 内容白框（页面排版模式的基元）
 * ────────────────────────────────────────────────────────────────────────
 * 2026-10-28 采纳（来源：webtools/client 全站 24 页改版的《页面排版模式》规范，
 * 详见 agent_doc/页面排版-白框模式.md）。
 *
 * 排版三规则：
 *   ① 列表页**去掉页头标题** —— 左侧导航已高亮页名，页面里再写一遍是冗余；
 *   ② 内容**装进白框**   —— 灰画布上浮起一块白卡，工具栏/表格/卡片群/图表全在框内；
 *   ③ 详情页**保留页头** —— 它不是重复导航，而是「实体身份」（名字/状态/返回）。
 *
 * 一句话：**导航说明「这是哪一页」，白框说明「内容在哪」，页头只留给「这是哪一个对象」。**
 *
 * 为什么不用 Card：
 *   Card 是 `rounded-lg + border`，在白底 + 阴影下边框几乎看不见；
 *   白框是大块面，需要 `rounded-xl`（8px 显生硬）+ `border-strong`（深一档；
 *   **不要再叠 `/70`** —— 那会混回接近默认色，等于白改，见规范 §4.3）。
 *
 * ⚠️ 三个必须遵守的点：
 *   1. 不要加 `overflow-hidden` —— 会裁掉 sticky 表头与下拉菜单；
 *   2. `data-testid="content-frame"` 是**跨项目验收探针**，移植时保留原名别改；
 *   3. 白框内部**不要再用卡片**（框中框），分区改用 `ContentFrameSection` 的横线。
 */
export interface ContentFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 内边距档位：
   * - 4 = 列表页（16px，默认）
   * - 5 = 详情页（20px）
   * - 0 = 画布/工作区页（白框内零内距，内容自己管 —— 工具栏贴边 + 画布撑满，
   *       否则「框内再留一圈白」会让画布看起来还是浮在框里）
   */
  padding?: 0 | 4 | 5;
  /**
   * 工作区撑满型（如流程图 / 单页内部滚动）：
   * 加 `flex min-h-0 flex-1 flex-col gap-3`。
   * `min-h-0` 必须写 —— 否则 flex 子项不肯收缩，内部 `overflow-y-auto` 会塌掉。
   */
  fill?: boolean;
}

export const ContentFrame = React.forwardRef<HTMLDivElement, ContentFrameProps>(
  ({ className, padding = 4, fill = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-strong bg-card shadow-surface",
        padding === 5 ? "p-5" : padding === 0 ? "p-0" : "p-4",
        fill && "flex min-h-0 flex-1 flex-col gap-3",
        padding === 0 && fill && "gap-0 overflow-hidden",
        className
      )}
      {...props}
      // 验收探针：固定在最后，禁止被调用方的 data-testid 覆盖（规范 §9）
      data-testid="content-frame"
    />
  )
);
ContentFrame.displayName = "ContentFrame";

/**
 * 白框内的分区（详情页专用）。
 *
 * ❌ 错：每块还是卡片 → 白框里套一堆小框 = 框中框
 *    <section className="rounded-lg border bg-card p-4">
 * ✅ 对：横线分区，最后一块不画线
 */
export function ContentFrameSection({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-3 border-b border-border pb-5 last:border-b-0 last:pb-0",
        className
      )}
      {...props}
    />
  );
}
