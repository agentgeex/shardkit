/**
 * ui/time-picker.tsx — 时间选择（对齐 vue-admin-tpl「全部示例」的 TimePicker / TimeSelect）
 * ────────────────────────────────────────────────────────────────────────────
 * - TimePicker：时/分（可选秒）下拉选择，受控，值为 "HH:mm[:ss]"
 * - TimeSelect：固定时间点下拉（对齐 ElementPlus TimeSelect，如 08:30–18:00 每 30 分钟）
 * 无第三方依赖。
 */
import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export interface TimePickerProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  withSeconds?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  withSeconds = false,
  disabled,
  placeholder = "选择时间",
  className,
  ...rest
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const parts = (value ?? "").split(":");
  const hh = parts[0] ? Number(parts[0]) : 9;
  const mm = parts[1] ? Number(parts[1]) : 0;
  const ss = parts[2] ? Number(parts[2]) : 0;

  const emit = (h: number, m: number, s: number) =>
    onChange?.(withSeconds ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}`);

  const col = (label: string, max: number, val: number, onPick: (n: number) => void) => (
    <div className="flex flex-col">
      <div className="px-2 pb-1 text-center text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="h-44 space-y-0.5 overflow-y-auto pr-1">
        {Array.from({ length: max }).map((_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            className={cn(
              "block w-full rounded px-2 py-1 text-center text-sm tabular-nums transition-colors",
              n === val ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            {pad(n)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid="time-picker"
          {...rest}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="h-4 w-4 opacity-70" />
          {value || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {col("时", 24, hh, (n) => emit(n, mm, ss))}
          {col("分", 60, mm, (n) => emit(hh, n, ss))}
          {withSeconds && col("秒", 60, ss, (n) => emit(hh, mm, n))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface TimeSelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  start?: string; // "08:30"
  end?: string; // "18:00"
  stepMinutes?: number;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/** 生成 start..end 之间按 stepMinutes 递增的时间点 */
export function buildTimeOptions(start = "08:30", end = "18:00", stepMinutes = 30): string[] {
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  const out: string[] = [];
  for (let t = toMin(start); t <= toMin(end); t += stepMinutes) {
    out.push(`${pad(Math.floor(t / 60))}:${pad(t % 60)}`);
  }
  return out;
}

export function TimeSelect({
  value,
  onChange,
  start,
  end,
  stepMinutes,
  disabled,
  placeholder = "选择时间",
  className,
  ...rest
}: TimeSelectProps) {
  const [open, setOpen] = React.useState(false);
  const options = React.useMemo(() => buildTimeOptions(start, end, stepMinutes), [start, end, stepMinutes]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid="time-select"
          {...rest}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="h-4 w-4 opacity-70" />
          {value || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-h-64 w-[--radix-popover-trigger-width] overflow-y-auto p-1" align="start">
        {options.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              onChange?.(t);
              setOpen(false);
            }}
            className={cn(
              "block w-full rounded px-2 py-1.5 text-left text-sm tabular-nums transition-colors",
              t === value ? "bg-primary text-primary-foreground" : "hover:bg-accent"
            )}
          >
            {t}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
