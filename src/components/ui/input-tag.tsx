/**
 * ui/input-tag.tsx — 标签输入（对齐 vue-admin-tpl「全部示例」的标签/多值录入）
 * ────────────────────────────────────────────────────────────────────────────
 * 回车/逗号创建标签，退格删末尾，支持去重、最大数量、禁用。
 */
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputTagProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function InputTag({
  value = [],
  onChange,
  placeholder = "输入后回车添加",
  max,
  disabled,
  className,
  ...rest
}: InputTagProps) {
  const [draft, setDraft] = React.useState("");

  const add = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    if (max != null && value.length >= max) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    onChange?.([...value, t]);
    setDraft("");
  };

  const removeAt = (i: number) => onChange?.(value.filter((_, idx) => idx !== i));

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-2 py-1.5 text-sm shadow-sm transition-colors focus-within:ring-1 focus-within:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      data-testid="input-tag"
      {...rest}
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
    >
      {value.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
              }}
              className="rounded-sm opacity-60 transition-opacity hover:opacity-100"
              aria-label={`移除 ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        value={draft}
        disabled={disabled || (max != null && value.length >= max)}
        placeholder={value.length === 0 ? placeholder : ""}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length) {
            removeAt(value.length - 1);
          }
        }}
        onBlur={() => add(draft)}
        className="h-6 min-w-[6rem] flex-1 border-0 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
