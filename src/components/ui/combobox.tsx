/**
 * ui/combobox.tsx — 自动完成 / 可搜索下拉（对齐 vue-admin-tpl「全部示例」的 Autocomplete）
 * ────────────────────────────────────────────────────────────────────────────
 * - Combobox：输入过滤建议项，选中回填（单选）
 * - 支持自由输入（非选项内容也可作为值）
 */
import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  freeInput?: boolean;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "输入以搜索",
  freeInput = true,
  disabled,
  emptyText = "无匹配项",
  className,
  ...rest
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  const select = (v: string) => {
    onChange?.(v);
    setOpen(false);
    setQuery("");
  };

  // 展示值优先取匹配项的 label（value 与 label 不一致时更友好，如 value=react / label=React）
  const display = value != null && value !== "" ? (options.find((o) => o.value === value)?.label ?? value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid="combobox"
          {...rest}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{display || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-3.5 w-3.5 opacity-50" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (filtered.length) select(filtered[0].value);
                else if (freeInput && query.trim()) select(query.trim());
              }
            }}
            placeholder={placeholder}
            className="h-6 w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col gap-1 px-2 py-3 text-center text-xs text-muted-foreground">
              <span>{emptyText}</span>
              {freeInput && query.trim() && (
                <button
                  type="button"
                  onClick={() => select(query.trim())}
                  className="mx-auto rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-secondary/80"
                >
                  使用「{query.trim()}」
                </button>
              )}
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => select(o.value)}
                className={cn(
                  "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors",
                  o.value === value ? "bg-accent text-foreground" : "hover:bg-accent/60"
                )}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
