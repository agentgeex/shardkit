/**
 * Toast · 轻量全局反馈
 * ────────────────────────────────────────────────────────────────────────────
 * 定位：页面案例的「操作反馈」原语（保存成功 / 删除成功 / 失败提示）。
 *
 * 用法：
 *   <ToastProvider> 包裹应用（App 层已挂载）</ToastProvider>
 *   const { toast } = useToast();
 *   toast({ title: "已保存", description: "P-1001 · 无线耳机", variant: "success" });
 *
 * 特性：
 *   - 无第三方依赖（自绘，z-index 高于 Dialog 的 z-50）；
 *   - 自动消失（duration 默认 3000ms，0 = 不自动关闭）；
 *   - role="status" + aria-live，无障碍友好；
 *   - data-testid="toast-viewport" / "toast" 便于自动化断言。
 */

import * as React from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "destructive";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** 自动关闭毫秒数，0 表示不自动关闭；默认 3000 */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const VARIANT_STYLE: Record<ToastVariant, string> = {
  default: "border-border bg-card text-card-foreground",
  success: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
  destructive: "border-destructive/40 bg-destructive/10 text-foreground",
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />;
  if (variant === "destructive") return <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />;
  return null;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: string) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (opts: ToastOptions) => {
      const id = `toast-${++idRef.current}`;
      const duration = opts.duration ?? 3000;
      setItems((list) => [...list, { ...opts, id }]);
      if (duration > 0) {
        timers.current.set(id, setTimeout(() => dismiss(id), duration));
      }
      return id;
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        data-testid="toast-viewport"
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            data-testid="toast"
            role="status"
            aria-live="polite"
            className={cn(
              "pointer-events-auto flex items-start gap-2 rounded-lg border p-3 shadow-lg",
              VARIANT_STYLE[t.variant ?? "default"]
            )}
          >
            <ToastIcon variant={t.variant ?? "default"} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              className="rounded-sm opacity-60 transition-opacity hover:opacity-100 focus:outline-none"
              aria-label="关闭提示"
              onClick={() => dismiss(t.id)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
