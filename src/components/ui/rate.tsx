/**
 * ui/rate.tsx — 评分（对齐 vue-admin-tpl「全部示例」的 Rate）
 * ────────────────────────────────────────────────────────────────────────────
 * 星级评分：支持 allowHalf、只读、自定义图标数、清除。
 */
import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: number;
  onChange?: (value: number) => void;
  count?: number;
  allowHalf?: boolean;
  allowClear?: boolean;
  disabled?: boolean;
  size?: number;
}

export function Rate({
  value = 0,
  onChange,
  count = 5,
  allowHalf = false,
  allowClear = true,
  disabled = false,
  size = 22,
  className,
  ...rest
}: RateProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? value;

  const pick = (e: React.MouseEvent, index: number) => {
    if (disabled) return;
    let next = index + 1;
    if (allowHalf) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      if (e.clientX - rect.left < rect.width / 2) next = index + 0.5;
    }
    if (allowClear && next === value) {
      onChange?.(0);
      return;
    }
    onChange?.(next);
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1", disabled && "cursor-not-allowed opacity-60", className)}
      data-testid="rate"
      role="radiogroup"
      {...rest}
    >
      {Array.from({ length: count }).map((_, i) => {
        const filled = display >= i + 1;
        const half = !filled && allowHalf && display >= i + 0.5;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={(e) => pick(e, i)}
            onMouseMove={(e) => !disabled && setHover(allowHalf && e.clientX - e.currentTarget.getBoundingClientRect().left < e.currentTarget.getBoundingClientRect().width / 2 ? i + 0.5 : i + 1)}
            onMouseLeave={() => setHover(null)}
            className="relative transition-transform hover:scale-110 disabled:hover:scale-100"
            aria-label={`${i + 1} 星`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn("transition-colors", filled || half ? "text-amber-400" : "text-muted-foreground/40")}
              fill={filled ? "currentColor" : "transparent"}
            />
            {half && (
              <span className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: size / 2 }}>
                <Star style={{ width: size, height: size }} className="text-amber-400" fill="currentColor" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
