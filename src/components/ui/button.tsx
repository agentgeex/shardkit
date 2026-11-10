import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // 基础：所有按钮统一加一层边框（维护者验收反馈 2026-09-28：每个按钮都要有边框）
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "border-destructive/30 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "border-input bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        // ── 按钮用途分色（2026-10-28 采纳《页面排版-白框模式》§6）──────────────
        // 白底页面上 ghost/outline 描边按钮基本看不见（对向项目返工三次）→ 可见按钮
        // 一律实底 + 白字，靠**色相**区分用途。对比度：按钮 ≥3:1、正文 ≥4.5:1，必须实测。
        //   default 蓝 = 新建/保存/确认/提交   run 绿 = 运行/重跑/重试
        //   view    青 = 详情/打开/流程图       edit 橙 = 编辑/修改/配置
        //   back    紫 = 返回/后退             destructive 红 = 删除/归档
        run: "border-action-run/40 bg-action-run text-action-run-foreground shadow-sm hover:bg-action-run/90",
        view: "border-action-view/40 bg-action-view text-action-view-foreground shadow-sm hover:bg-action-view/90",
        edit: "border-warning/50 bg-warning text-warning-foreground shadow-sm hover:bg-warning/90",
        back: "border-action-back/60 bg-action-back text-action-back-foreground shadow-sm hover:bg-action-back/90",
        ghost: "border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
        link: "border-input bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
