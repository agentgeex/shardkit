/**
 * ui/tree-select.tsx — 树选择（对齐 vue-admin-tpl「全部示例」的 TreeSelect）
 * ────────────────────────────────────────────────────────────────────────────
 * 下拉内置可展开树：单选（默认）或多选，支持父子联动勾选。
 */
import * as React from "react";
import { ChevronRight, ChevronsUpDown, TreePine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
}

export interface TreeSelectProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  tree: TreeNode[];
  value?: string[];
  onChange?: (value: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function flatten(nodes: TreeNode[], out: TreeNode[] = []): TreeNode[] {
  for (const n of nodes) {
    out.push(n);
    if (n.children) flatten(n.children, out);
  }
  return out;
}

function collectDescendants(node: TreeNode): string[] {
  const acc: string[] = [];
  const walk = (n: TreeNode) => {
    acc.push(n.value);
    n.children?.forEach(walk);
  };
  walk(node);
  return acc;
}

export function TreeSelect({
  tree,
  value = [],
  onChange,
  multiple = false,
  placeholder = "请选择",
  disabled,
  className,
  ...rest
}: TreeSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(tree.map((n) => n.value)));
  const all = flatten(tree);
  const labelOf = (v: string) => all.find((n) => n.value === v)?.label ?? v;

  const toggleExpand = (v: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });

  const pick = (node: TreeNode) => {
    if (node.disabled) return;
    const vals = collectDescendants(node);
    if (multiple) {
      const has = value.includes(node.value);
      const next = has
        ? value.filter((v) => !vals.includes(v))
        : Array.from(new Set([...value, ...vals]));
      onChange?.(next);
    } else {
      onChange?.([node.value]);
      setOpen(false);
    }
  };

  const renderNode = (node: TreeNode, depth: number): React.ReactNode => {
    const hasChildren = !!node.children?.length;
    const isOpen = expanded.has(node.value);
    const checked = value.includes(node.value);
    return (
      <div key={node.value}>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded px-1.5 py-1 text-sm transition-colors hover:bg-accent/60",
            node.disabled && "cursor-not-allowed opacity-40"
          )}
          style={{ paddingLeft: 6 + depth * 16 }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.value)}
              className="flex h-4 w-4 items-center justify-center"
              aria-label={isOpen ? "折叠" : "展开"}
            >
              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
            </button>
          ) : (
            <span className="h-4 w-4" />
          )}
          {multiple && (
            <Checkbox checked={checked} onCheckedChange={() => pick(node)} disabled={node.disabled} />
          )}
          <button
            type="button"
            onClick={() => pick(node)}
            className={cn("flex-1 truncate text-left", checked && !multiple && "font-medium text-primary")}
          >
            {node.label}
          </button>
        </div>
        {hasChildren && isOpen && (
          <div>{node.children!.map((c) => renderNode(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  const display = value.length ? value.map(labelOf).join("、") : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-testid="tree-select"
          {...rest}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            !display && "text-muted-foreground",
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <TreePine className="h-4 w-4 shrink-0 opacity-60" />
            <span className="truncate">{display || placeholder}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-h-72 w-[--radix-popover-trigger-width] overflow-y-auto p-1" align="start">
        {tree.map((n) => renderNode(n, 0))}
      </PopoverContent>
    </Popover>
  );
}
