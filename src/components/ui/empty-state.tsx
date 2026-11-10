import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * EmptyState —— 统一空态组件
 *
 * 设计约束（与 baseline-ui 对齐）：
 *  - 每个空态必须有「明确下一步」（action 或 description 指引），杜绝纯"暂无数据"裸文案。
 *  - 图标走 lucide，尺寸收敛（常规 size-6 / 紧凑 size-4）。
 *  - compact 用于下拉、弹层、小组件内部；常规用于整页 / 表格 / 卡片区。
 */
export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** 图标：lucide 组件（推荐）或任意 ReactNode */
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  /** 主文案 */
  title?: React.ReactNode;
  /** 说明 / 下一步指引 */
  description?: React.ReactNode;
  /** 明确的操作入口（按钮等） */
  action?: React.ReactNode;
  /** 紧凑模式：用于下拉 / 弹层 / 小容器 */
  compact?: boolean;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { icon, title = "暂无数据", description, action, compact = false, className, children, ...props },
    ref
  ) => {
    const renderedIcon = React.isValidElement(icon)
      ? icon
      : icon
        ? React.createElement(icon as React.ComponentType<{ className?: string }>, {
            className: cn(compact ? "h-4 w-4" : "h-6 w-6", "text-muted-foreground"),
          })
        : null;

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center text-center",
          compact ? "gap-1 py-6" : "gap-1 py-10",
          className
        )}
        {...props}
      >
        {renderedIcon ? (
          <div
            className={cn(
              "mb-2 flex items-center justify-center rounded-full bg-muted",
              compact ? "h-8 w-8" : "h-12 w-12"
            )}
          >
            {renderedIcon}
          </div>
        ) : null}
        <p className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{title}</p>
        {description ? (
          <p className="mt-0.5 max-w-sm text-xs text-muted-foreground text-pretty">{description}</p>
        ) : null}
        {action ? <div className={cn(compact ? "mt-2" : "mt-4")}>{action}</div> : null}
        {children}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
