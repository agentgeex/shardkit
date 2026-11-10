import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 弹窗「内容面」上下文（2026-10-29 加）
 * ────────────────────────────────────────────────────────────────
 * 弹窗有两种用法，靠 DialogContent 的 surface 一个开关决定，正文自动跟随：
 *
 *   surface="card"   （默认）浮层本身就是那张纸 —— 白底，正文直接铺在上面。
 *                    适合「删除确认」这类只有一两行字的轻浮层。
 *
 *   surface="canvas" 把弹窗当「一个小页面」—— 外壳走画布底色，
 *                    正文由 DialogBody 自动套一层白框（card 面 + border-strong
 *                    + shadow-surface）。层次与页面完全同构：
 *                    画布底 → 白框 → 框内容。适合表单/详情这类有实体的弹窗。
 *
 * 用 context 而不是给 DialogBody 再开一个 prop：开关只允许有一个，
 * 「外壳是灰的、正文却没框」这种半吊子状态从 API 上就构造不出来。
 */
type DialogSurface = "card" | "canvas";
const DialogSurfaceContext = React.createContext<DialogSurface>("card");

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { surface?: DialogSurface }
>(({ className, children, surface = "card", ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-surface={surface}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-strong p-0 shadow-overlay duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        surface === "canvas" ? "bg-background" : "bg-card",
        className
      )}
      {...props}
    >
      <DialogSurfaceContext.Provider value={surface}>{children}</DialogSurfaceContext.Provider>
      <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-sm p-1 opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex shrink-0 flex-col gap-1.5 border-b border-strong px-6 py-4 pr-12 text-left", className)}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/** 可滚动的主体区：
 *  Dialog 采用「头/体/尾」三段式 —— 头部（标题+关闭）与底部（操作按钮）固定，
 *  只有 DialogBody 内部滚动。内容较长时务必把正文包进来，否则会被窗口裁切。
 */
const DialogBody = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const surface = React.useContext(DialogSurfaceContext);
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-4", className)} {...props}>
      {surface === "canvas" ? (
        // 白框：与页面里的 ContentFrame 同一套观感（card 面 + border-strong + 轻投影）
        <div data-dialog-frame className="rounded-lg border border-strong bg-card p-4 shadow-surface">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};
DialogBody.displayName = "DialogBody";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex shrink-0 flex-col-reverse gap-2 border-t border-strong px-6 py-3 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
