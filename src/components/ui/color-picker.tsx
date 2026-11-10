/**
 * ui/color-picker.tsx — 颜色选择（对齐 vue-admin-tpl「全部示例」的 ColorPicker）
 * ────────────────────────────────────────────────────────────────────────────
 * 原生取色器 + 预设色板 + 十六进制输入，受控（值为 #RRGGBB）。
 */
import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PRESETS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#64748b", "#0f172a",
];

export interface ColorPickerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  showInput?: boolean;
  className?: string;
}

export function ColorPicker({
  value = "#3b82f6",
  onChange,
  disabled,
  showInput = true,
  className,
  ...rest
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid="color-picker"
          {...rest}
          className={cn(
            "flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm transition-colors hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <span
            className="h-5 w-5 shrink-0 rounded border border-black/10 shadow-inner"
            style={{ backgroundColor: value }}
          />
          {showInput && <span className="font-mono text-xs uppercase">{value}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-3" align="start">
        <div className="mb-2 grid grid-cols-6 gap-1.5">
          {PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange?.(c)}
              className={cn(
                "h-6 w-6 rounded border transition-transform hover:scale-110",
                c === value ? "ring-2 ring-ring ring-offset-1" : "border-black/10"
              )}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-2">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded border border-input bg-transparent"
            aria-label="自定义颜色"
          />
          <input
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="h-7 min-w-0 flex-1 rounded border border-input bg-transparent px-2 font-mono text-xs uppercase outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
