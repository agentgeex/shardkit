/**
 * ui/input-number.tsx — 数字输入（对齐 vue-admin-tpl「全部示例」的 InputNumber）
 * ────────────────────────────────────────────────────────────────────────────
 * 带 −/+ 步进按钮、min/max/step、精度控制、禁用态。无第三方依赖。
 */
import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputNumberProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  disabled?: boolean;
  controls?: boolean;
  className?: string;
}

function clamp(n: number, min?: number, max?: number) {
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}

function round(n: number, precision?: number) {
  if (precision == null) return n;
  const f = Math.pow(10, precision);
  return Math.round(n * f) / f;
}

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  (
    { value, onChange, min, max, step = 1, precision, disabled, controls = true, className, ...props },
    ref
  ) => {
    const [text, setText] = React.useState<string>(value == null ? "" : String(value));

    React.useEffect(() => {
      setText(value == null ? "" : String(value));
    }, [value]);

    const commit = (next: number | null) => {
      const v = next == null ? null : round(clamp(next, min, max), precision);
      setText(v == null ? "" : String(v));
      onChange?.(v);
    };

    const bump = (dir: 1 | -1) => {
      const cur = value ?? 0;
      commit(cur + dir * step);
    };

    return (
      <div
        className={cn(
          "flex h-9 w-full items-center rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        data-testid="input-number"
      >
        {controls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (min != null && (value ?? 0) <= min)}
            onClick={() => bump(-1)}
            className="flex h-full w-8 shrink-0 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="减少"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        )}
        <input
          ref={ref}
          inputMode="decimal"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            if (raw === "" || raw === "-") {
              onChange?.(null);
              return;
            }
            const n = Number(raw);
            if (!Number.isNaN(n)) onChange?.(n);
          }}
          onBlur={() => commit(value ?? null)}
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-center outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          {...props}
        />
        {controls && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (max != null && (value ?? 0) >= max)}
            onClick={() => bump(1)}
            className="flex h-full w-8 shrink-0 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent"
            aria-label="增加"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);
InputNumber.displayName = "InputNumber";
