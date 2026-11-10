/**
 * ui/cascader.tsx — 级联选择（对齐 vue-admin-tpl「全部示例」的 Cascader）
 * ────────────────────────────────────────────────────────────────────────────
 * 多级下拉：逐层展开列，选中叶子后回填「A / B / C」路径；支持受控值。
 */
import * as React from "react";
import { ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
}

export interface CascaderProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  options: CascaderOption[];
  value?: string[];
  onChange?: (path: string[], labels: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Cascader({
  options,
  value = [],
  onChange,
  placeholder = "请选择",
  disabled,
  className,
  ...rest
}: CascaderProps) {
  const [open, setOpen] = React.useState(false);
  const [hoverPath, setHoverPath] = React.useState<string[]>([]);

  const findNode = (opts: CascaderOption[], v: string) => opts.find((o) => o.value === v);
  const labelOf = (path: string[]) => {
    const labels: string[] = [];
    let level = options;
    for (const v of path) {
      const node = findNode(level, v);
      if (!node) break;
      labels.push(node.label);
      level = node.children ?? [];
    }
    return labels;
  };

  const cols: CascaderOption[][] = [options];
  for (const v of hoverPath) {
    const node = findNode(cols[cols.length - 1], v);
    if (node?.children?.length) cols.push(node.children);
    else break;
  }

  const pick = (level: number, opt: CascaderOption) => {
    if (opt.disabled) return;
    const next = [...hoverPath.slice(0, level), opt.value];
    if (opt.children?.length) {
      setHoverPath(next);
      return;
    }
    onChange?.(next, labelOf(next));
    setHoverPath([]);
    setOpen(false);
  };

  const display = value.length ? labelOf(value).join(" / ") : "";

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setHoverPath([]);
        else setHoverPath(value);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid="cascader"
          {...rest}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !display && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{display || placeholder}</span>
          <ChevronRight className="h-4 w-4 shrink-0 rotate-90 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {cols.map((col, level) => (
            <div key={level} className="max-h-64 w-44 overflow-y-auto border-r border-border last:border-r-0 p-1">
              {col.map((opt) => {
                const active = hoverPath[level] === opt.value;
                const isLeaf = !opt.children?.length;
                const selected = isLeaf && value[level] === opt.value && hoverPath.length === level + 1;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => pick(level, opt)}
                    onMouseEnter={() => !opt.children?.length && undefined}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors",
                      active ? "bg-accent text-foreground" : "hover:bg-accent/60",
                      opt.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.children?.length ? (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    ) : selected ? (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
