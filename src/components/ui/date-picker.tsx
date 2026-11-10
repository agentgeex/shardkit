import * as React from "react";
import { CalendarDays, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar, type CalendarView, type DateRange } from "./calendar";

export type { CalendarView, DateRange };

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d?: Date) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : "");
const ym = (d?: Date) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}` : "");
const yOnly = (d?: Date) => (d ? `${d.getFullYear()}` : "");

export interface Shortcut {
  text: string;
  value: Date | (() => Date);
}

const resolveShortcut = (s: Shortcut): Date => (typeof s.value === "function" ? s.value() : s.value);

/* ────────────────────────────────────────────────────────────
 * 通用触发器（按钮外形，左侧图标，整框可点）
 * ★ 必须 forwardRef：PopoverTrigger asChild 需要把 ref 挂到真实 DOM 上，
 *   否则 radix PopperAnchor 拿不到 reference → Floating UI 不定位 → 弹层卡在 -200% 占位。
 * ──────────────────────────────────────────────────────────── */
const Trigger = React.forwardRef<
  HTMLButtonElement,
  {
    display?: string;
    placeholder: string;
    onClear?: () => void;
    className?: string;
    testid: string;
  } & Omit<React.ComponentPropsWithoutRef<typeof Button>, "value" | "onChange" | "className" | "children">
>(function Trigger({ display, placeholder, onClear, className, testid, ...rest }, ref) {
  return (
    <div className={cn("relative w-[240px]", className)}>
      <Button
        ref={ref}
        variant="outline"
        data-testid={testid}
        className={cn("w-full justify-start pr-8 text-left font-normal", !display && "text-muted-foreground")}
        {...rest}
      >
        <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">{display || placeholder}</span>
      </Button>
      {display && onClear && (
        <button
          type="button"
          aria-label="清除"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});

/* ────────────────────────────────────────────────────────────
 * 范围触发器：单个输入框（显示 开始 ~ 结束）+ 右侧清除
 * ★ 必须 forwardRef（PopoverTrigger asChild 需要真实 DOM，否则 radix PopperAnchor 拿不到 reference）
 * ──────────────────────────────────────────────────────────── */
const RangeTrigger = React.forwardRef<
  HTMLDivElement,
  {
    start?: string;
    end?: string;
    startPlaceholder?: string;
    endPlaceholder?: string;
    placeholder?: string;
    onClear?: () => void;
    className?: string;
    testid: string;
  } & Omit<React.ComponentPropsWithoutRef<"div">, "className" | "children">
>(function RangeTrigger(
  { start, end, startPlaceholder = "开始", endPlaceholder = "结束", onClear, className, testid, ...rest },
  ref
) {
  const empty = !start && !end;
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      data-testid={testid}
      className={cn(
        "relative flex h-9 w-full cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm",
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...rest}
    >
      <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex flex-1 items-center gap-1.5 truncate">
        <span className={cn("truncate", !start && "text-muted-foreground")}>{start || startPlaceholder}</span>
        <span className="shrink-0 text-muted-foreground">~</span>
        <span className={cn("truncate", !end && "text-muted-foreground")}>{end || endPlaceholder}</span>
      </span>
      {!empty && onClear && (
        <button
          type="button"
          aria-label="清除"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="shrink-0 rounded-sm text-muted-foreground opacity-60 transition-opacity hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});

/* ────────────────────────────────────────────────────────────
 * 双面板区间选择（左=开始月，右=次月）+ 共享区间状态
 * ★ 左面板选起点，右面板选终点（或相反顺序）；两面板共享“选取中”状态。
 * ──────────────────────────────────────────────────────────── */
function RangePanel({
  selected, onChange, disabledDate, view = "date", onClose, children,
}: {
  selected?: DateRange;
  onChange: (r: DateRange) => void;
  disabledDate?: (d: Date) => boolean;
  view?: CalendarView;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const anchor = selected?.[0] ?? selected?.[1] ?? new Date();
  const [baseMonth, setBaseMonth] = React.useState(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  );
  const [pendingStart, setPendingStart] = React.useState<Date | null>(null);

  const shift = (months: number) => {
    const d = new Date(baseMonth);
    if (view === "date") d.setMonth(d.getMonth() + months);
    else if (view === "month") d.setFullYear(d.getFullYear() + months);
    else d.setFullYear(d.getFullYear() + months * 12);
    setBaseMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  // 年/大跨步（日视图：±1 年；月视图：±10 年；年视图：±10 纪）
  const shiftBig = (dir: number) => {
    const d = new Date(baseMonth);
    if (view === "date") d.setFullYear(d.getFullYear() + dir);
    else if (view === "month") d.setFullYear(d.getFullYear() + dir * 10);
    else d.setFullYear(d.getFullYear() + dir * 120);
    setBaseMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const pick = (d: Date) => {
    if (!pendingStart) {
      setPendingStart(d);
      onChange([d, undefined]);
      return;
    }
    const [a, b] = pendingStart <= d ? [pendingStart, d] : [d, pendingStart];
    setPendingStart(null);
    onChange([a, b]);
    onClose();
  };

  // 右面板展示的左月 +1
  const rightMonth = React.useMemo(() => {
    const d = new Date(baseMonth);
    if (view === "date") d.setMonth(d.getMonth() + 1);
    else if (view === "month") d.setFullYear(d.getFullYear() + 1);
    else d.setFullYear(d.getFullYear() + 12);
    return d;
  }, [baseMonth, view]);

  return (
    <div className="flex flex-col gap-2" data-testid="range-panel">
      {/* 顶部导航：左 ‹«  ... »› 右（同时推进两个面板） */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-0.5">
          <NavArrow onClick={() => shiftBig(-1)} label="上一年" testid="range-prev-big">
            <ChevronsLeft className="h-4 w-4" />
          </NavArrow>
          <NavArrow onClick={() => shift(-1)} label="上一步" testid="range-prev">
            <ChevronLeft className="h-4 w-4" />
          </NavArrow>
        </div>
        <div className="flex items-center gap-0.5">
          <NavArrow onClick={() => shift(1)} label="下一步" testid="range-next">
            <ChevronRight className="h-4 w-4" />
          </NavArrow>
          <NavArrow onClick={() => shiftBig(1)} label="下一年" testid="range-next-big">
            <ChevronsRight className="h-4 w-4" />
          </NavArrow>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Calendar
          view={view}
          selected={selected}
          onSelectRange={() => {}}
          onPickDate={pick}
          pendingStart={pendingStart}
          edgeRole="start"
          disabledDate={disabledDate}
          baseMonth={baseMonth}
          onMonthChange={setBaseMonth}
          hideArrows
        />
        <Calendar
          view={view}
          selected={selected}
          onSelectRange={() => {}}
          onPickDate={pick}
          pendingStart={pendingStart}
          edgeRole="end"
          disabledDate={disabledDate}
          baseMonth={rightMonth}
          onMonthChange={() => {}}
          hideArrows
        />
      </div>
      {children}
    </div>
  );
}

const NavArrow = ({
  onClick, label, testid, children,
}: { onClick: () => void; label: string; testid: string; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    data-testid={testid}
    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
  >
    {children}
  </button>
);

/* ────────────────────────────────────────────────────────────
 * 1. 日期选择器（支持快捷选项 shortcuts / 禁用日期 disabledDate）
 * ──────────────────────────────────────────────────────────── */
export function DatePicker({
  value, onChange, placeholder = "选择日期", className, shortcuts, disabledDate, ...rest
}: {
  value?: Date;
  onChange?: (d?: Date) => void;
  placeholder?: string;
  className?: string;
  shortcuts?: Shortcut[];
  disabledDate?: (d: Date) => boolean;
} & Omit<React.ComponentPropsWithoutRef<typeof Button>, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Trigger display={ymd(value)} placeholder={placeholder} onClear={() => onChange?.(undefined)} className={className} testid="date-picker" {...rest} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex">
          {shortcuts?.length ? (
            <div className="mr-3 flex flex-col gap-1 border-r pr-3" data-testid="date-shortcuts">
              {shortcuts.map((s) => (
                <Button key={s.text} variant="ghost" size="sm" className="justify-start" onClick={() => { onChange?.(resolveShortcut(s)); setOpen(false); }}>
                  {s.text}
                </Button>
              ))}
            </div>
          ) : null}
          <div>
            <Calendar value={value} disabledDate={disabledDate} onChange={(d) => { onChange?.(d); setOpen(false); }} />
            <div className="mt-2 flex justify-between border-t pt-2">
              <Button variant="ghost" size="sm" onClick={() => { onChange?.(undefined); setOpen(false); }}>清除</Button>
              <Button variant="ghost" size="sm" onClick={() => { onChange?.(new Date()); setOpen(false); }}>今天</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
 * 2. 日期范围选择器
 * ──────────────────────────────────────────────────────────── */
export function DateRangePicker({
  value, onChange, placeholder = "选择日期范围", className, disabledDate, ...rest
}: {
  value?: DateRange;
  onChange?: (r: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabledDate?: (d: Date) => boolean;
} & Omit<React.ComponentPropsWithoutRef<"div">, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RangeTrigger
          start={ymd(value?.[0])}
          end={ymd(value?.[1])}
          startPlaceholder="开始日期"
          endPlaceholder="结束日期"
          onClear={() => onChange?.([undefined, undefined])}
          className={cn("w-[300px]", className)}
          testid="date-range-picker"
          {...rest}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <RangePanel
          selected={value}
          onChange={(r) => onChange?.(r)}
          disabledDate={disabledDate}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
 * 3. 月份选择器
 * ──────────────────────────────────────────────────────────── */
export function MonthPicker({
  value, onChange, placeholder = "选择月份", className, disabledDate, ...rest
}: {
  value?: Date;
  onChange?: (d?: Date) => void;
  placeholder?: string;
  className?: string;
  disabledDate?: (d: Date) => boolean;
} & Omit<React.ComponentPropsWithoutRef<typeof Button>, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Trigger display={ym(value)} placeholder={placeholder} onClear={() => onChange?.(undefined)} className={className} testid="month-picker" {...rest} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar view="month" value={value} disabledDate={disabledDate} onChange={(d) => { onChange?.(new Date(d.getFullYear(), d.getMonth(), 1)); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
 * 4. 月份范围选择器
 * ──────────────────────────────────────────────────────────── */
export function MonthRangePicker({
  value, onChange, placeholder = "选择月份范围", className, disabledDate, ...rest
}: {
  value?: DateRange;
  onChange?: (r: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabledDate?: (d: Date) => boolean;
} & Omit<React.ComponentPropsWithoutRef<"div">, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RangeTrigger
          start={ym(value?.[0])}
          end={ym(value?.[1])}
          startPlaceholder="开始月份"
          endPlaceholder="结束月份"
          onClear={() => onChange?.([undefined, undefined])}
          className={cn("w-[280px]", className)}
          testid="month-range-picker"
          {...rest}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <RangePanel
          view="month"
          selected={value}
          onChange={(r) => onChange?.(r)}
          disabledDate={disabledDate}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
 * 5. 年份选择器
 * ──────────────────────────────────────────────────────────── */
export function YearPicker({
  value, onChange, placeholder = "选择年份", className, disabledDate, ...rest
}: {
  value?: Date;
  onChange?: (d?: Date) => void;
  placeholder?: string;
  className?: string;
  disabledDate?: (d: Date) => boolean;
} & Omit<React.ComponentPropsWithoutRef<typeof Button>, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Trigger display={yOnly(value)} placeholder={placeholder} onClear={() => onChange?.(undefined)} className={className} testid="year-picker" {...rest} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <Calendar view="year" value={value} disabledDate={disabledDate} onChange={(d) => { onChange?.(new Date(d.getFullYear(), 0, 1)); setOpen(false); }} />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
 * 6. 年份范围选择器
 * ──────────────────────────────────────────────────────────── */
export function YearRangePicker({
  value, onChange, placeholder = "选择年份范围", className, disabledDate, ...rest
}: {
  value?: DateRange;
  onChange?: (r: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabledDate?: (d: Date) => boolean;
} & Omit<React.ComponentPropsWithoutRef<"div">, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RangeTrigger
          start={yOnly(value?.[0])}
          end={yOnly(value?.[1])}
          startPlaceholder="开始年份"
          endPlaceholder="结束年份"
          onClear={() => onChange?.([undefined, undefined])}
          className={cn("w-[260px]", className)}
          testid="year-range-picker"
          {...rest}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <RangePanel
          view="year"
          selected={value}
          onChange={(r) => onChange?.(r)}
          disabledDate={disabledDate}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
 * 7. 日期时间选择器（含时分，支持快捷选项）
 * ──────────────────────────────────────────────────────────── */
export function DateTimePicker({
  value, onChange, className, shortcuts, placeholder = "选择日期时间", ...rest
}: {
  value?: Date;
  onChange?: (d?: Date) => void;
  className?: string;
  shortcuts?: Shortcut[];
  placeholder?: string;
} & Omit<React.ComponentPropsWithoutRef<typeof Button>, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  const d = value ?? new Date();
  const set = (patch: Partial<{ h: number; m: number }>) => {
    const next = new Date(d);
    if (patch.h != null) next.setHours(patch.h);
    if (patch.m != null) next.setMinutes(patch.m);
    onChange?.(next);
  };
  const display = value ? `${ymd(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Trigger display={display} placeholder={placeholder} onClear={() => onChange?.(undefined)} className={className} testid="date-time-picker" {...rest} />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex">
          {shortcuts?.length ? (
            <div className="mr-3 flex flex-col gap-1 border-r pr-3" data-testid="datetime-shortcuts">
              {shortcuts.map((s) => (
                <Button key={s.text} variant="ghost" size="sm" className="justify-start" onClick={() => { onChange?.(resolveShortcut(s)); setOpen(false); }}>
                  {s.text}
                </Button>
              ))}
            </div>
          ) : null}
          <div>
            <Calendar value={value} onChange={(nd) => onChange?.(new Date(nd.setHours(d.getHours(), d.getMinutes())))} />
            <div className="mt-3 flex items-center gap-2 border-t pt-3 text-sm">
              <span className="text-muted-foreground">时间</span>
              <input type="number" min={0} max={23} value={d.getHours()} onChange={(e) => set({ h: Number(e.target.value) })} className="h-8 w-16 rounded-md border border-input bg-background px-2 text-center" />
              <span>:</span>
              <input type="number" min={0} max={59} value={d.getMinutes()} onChange={(e) => set({ m: Number(e.target.value) })} className="h-8 w-16 rounded-md border border-input bg-background px-2 text-center" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ────────────────────────────────────────────────────────────
 * 8. 日期时间范围选择器
 * ──────────────────────────────────────────────────────────── */
export function DateTimeRangePicker({
  value, onChange, placeholder = "选择日期时间范围", className, disabledDate, ...rest
}: {
  value?: DateRange;
  onChange?: (r: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabledDate?: (d: Date) => boolean;
} & Omit<React.ComponentPropsWithoutRef<"div">, "value" | "onChange" | "className">) {
  const [open, setOpen] = React.useState(false);
  const [times, setTimes] = React.useState<[string, string]>(["00:00", "23:59"]);
  const startStr = value?.[0] ? `${ymd(value[0])} ${times[0]}` : "";
  const endStr = value?.[1] ? `${ymd(value[1])} ${times[1]}` : "";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RangeTrigger
          start={startStr}
          end={endStr}
          startPlaceholder="开始日期时间"
          endPlaceholder="结束日期时间"
          onClear={() => onChange?.([undefined, undefined])}
          className={cn("w-[360px]", className)}
          testid="date-time-range-picker"
          {...rest}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <RangePanel
          selected={value}
          onChange={(r) => onChange?.(r)}
          disabledDate={disabledDate}
          onClose={() => {}}
        >
          {/* 两个时间输入框：分别对齐左/右日历下方 */}
          <div className="flex items-start gap-3 border-t pt-3 text-sm" data-testid="dtr-times">
            <label className="flex w-[268px] items-center justify-center gap-2">
              <span className="text-muted-foreground">开始时间</span>
              <input
                type="time"
                data-testid="dtr-start-time"
                value={times[0]}
                onChange={(e) => setTimes((t) => [e.target.value, t[1]])}
                className="h-8 rounded-md border border-input bg-background px-2 text-center"
              />
            </label>
            <label className="flex w-[268px] items-center justify-center gap-2">
              <span className="text-muted-foreground">结束时间</span>
              <input
                type="time"
                data-testid="dtr-end-time"
                value={times[1]}
                onChange={(e) => setTimes((t) => [t[0], e.target.value])}
                className="h-8 rounded-md border border-input bg-background px-2 text-center"
              />
            </label>
          </div>
        </RangePanel>
      </PopoverContent>
    </Popover>
  );
}
