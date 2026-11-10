import * as React from "react";
import { ChevronRight, ChevronLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";

export interface TransferItem {
  key: string;
  title: string;
  description?: string;
  disabled?: boolean;
}

/**
 * 穿梭框（Transfer）—— shadcn 风格自研实现。
 * 左：可选项；右：已选项。支持搜索、全选、禁用项、统计。
 */
export function Transfer({
  dataSource,
  targetKeys: targetKeysProp,
  onChange,
  titles = ["可选项", "已选项"],
  className,
  height = 260,
}: {
  dataSource: TransferItem[];
  targetKeys?: string[];
  onChange?: (keys: string[]) => void;
  titles?: [string, string];
  className?: string;
  height?: number;
}) {
  const [targetKeys, setTargetKeys] = React.useState<string[]>(targetKeysProp ?? []);
  const [leftChecked, setLeftChecked] = React.useState<string[]>([]);
  const [rightChecked, setRightChecked] = React.useState<string[]>([]);
  const [leftQuery, setLeftQuery] = React.useState("");
  const [rightQuery, setRightQuery] = React.useState("");

  React.useEffect(() => {
    if (targetKeysProp) setTargetKeys(targetKeysProp);
  }, [targetKeysProp]);

  const commit = (keys: string[]) => {
    setTargetKeys(keys);
    onChange?.(keys);
  };

  const source = dataSource.filter((i) => !targetKeys.includes(i.key));
  const target = dataSource.filter((i) => targetKeys.includes(i.key));

  const filter = (list: TransferItem[], q: string) =>
    list.filter(
      (i) =>
        i.title.toLowerCase().includes(q.toLowerCase()) ||
        (i.description ?? "").toLowerCase().includes(q.toLowerCase())
    );

  const leftList = filter(source, leftQuery);
  const rightList = filter(target, rightQuery);

  const moveRight = () => {
    const moved = leftChecked.filter((k) => !dataSource.find((d) => d.key === k)?.disabled);
    commit([...targetKeys, ...moved]);
    setLeftChecked([]);
  };
  const moveLeft = () => {
    commit(targetKeys.filter((k) => !rightChecked.includes(k)));
    setRightChecked([]);
  };

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-stretch", className)}>
      <Panel
        title={titles[0]}
        count={leftList.length}
        total={source.length}
        list={leftList}
        checked={leftChecked}
        onCheck={setLeftChecked}
        query={leftQuery}
        onQuery={setLeftQuery}
        height={height}
      />
      <div className="flex flex-row items-center justify-center gap-2 sm:flex-col">
        <Button size="icon" variant="outline" onClick={moveRight} disabled={leftChecked.length === 0} title="移至右侧">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={moveLeft} disabled={rightChecked.length === 0} title="移至左侧">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <Panel
        title={titles[1]}
        count={rightList.length}
        total={target.length}
        list={rightList}
        checked={rightChecked}
        onCheck={setRightChecked}
        query={rightQuery}
        onQuery={setRightQuery}
        height={height}
      />
    </div>
  );
}

function Panel({
  title, count, total, list, checked, onCheck, query, onQuery, height,
}: {
  title: string;
  count: number;
  total: number;
  list: TransferItem[];
  checked: string[];
  onCheck: (k: string[]) => void;
  query: string;
  onQuery: (q: string) => void;
  height: number;
}) {
  const selectable = list.filter((i) => !i.disabled);
  const allChecked = selectable.length > 0 && selectable.every((i) => checked.includes(i.key));
  const toggleAll = () => {
    if (allChecked) onCheck(checked.filter((k) => !selectable.some((i) => i.key === k)));
    else onCheck(Array.from(new Set([...checked, ...selectable.map((i) => i.key)])));
  };
  const toggleOne = (key: string) =>
    onCheck(checked.includes(key) ? checked.filter((k) => k !== key) : [...checked, key]);

  return (
    <div className="flex flex-1 flex-col rounded-lg border bg-card/50">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <label className="flex items-center gap-2 text-xs font-medium">
          <Checkbox checked={allChecked} onCheckedChange={toggleAll} />
          {title}
          <span className="text-muted-foreground">{checked.length}/{total}</span>
        </label>
        <span className="text-[11px] text-muted-foreground">{count} 项</span>
      </div>
      <div className="border-b px-3 py-1.5">
        <div className="relative">
          <Search className="absolute left-2 top-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="搜索…"
            className="h-7 w-full rounded-md border border-input bg-background/60 pl-7 pr-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      <div className="overflow-y-auto p-1" style={{ height }}>
        {list.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">无数据</div>}
        {list.map((i) => (
          <label
            key={i.key}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              i.disabled ? "cursor-not-allowed opacity-40" : "hover:bg-accent"
            )}
          >
            <Checkbox
              disabled={i.disabled}
              checked={checked.includes(i.key)}
              onCheckedChange={() => toggleOne(i.key)}
            />
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{i.title}</span>
              {i.description ? (
                <span className="truncate text-[11px] text-muted-foreground">{i.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
