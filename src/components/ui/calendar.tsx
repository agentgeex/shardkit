import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 轻量日历 —— 零外部依赖，科技感渐变选中态。
 * 相比 react-day-picker：可控性强、体积更小，样式完全走 Tailwind 主题变量。
 *
 * 支持三种视图（view）：
 *   - date  日视图（默认）
 *   - month 月视图（选月份）
 *   - year  年视图（选年份，分页 12 年）
 * 支持区间选择（range）：传入 selected 数组 [start, end]，选中高亮。
 * 支持禁用日期（disabledDate）：返回 true 表示不可选。
 */
export type CalendarView = "date" | "month" | "year";
export type DateRange = [Date | undefined, Date | undefined];

export interface CalendarProps {
  /** 单选值 */
  value?: Date;
  /** 单选回调 */
  onChange?: (d: Date) => void;
  /** 区间值 [start, end]；传入则进入区间选择模式 */
  selected?: DateRange;
  /** 区间回调 */
  onSelectRange?: (r: DateRange) => void;
  /** 视图：日/月/年 */
  view?: CalendarView;
  /** 禁用日期 */
  disabledDate?: (d: Date) => boolean;
  /** 年份跳转步长，默认 1 */
  yearStep?: number;
  /** 受控“当前展示月/年”的基准日期（双面板共享月份用）；不传则内部自管理 */
  baseMonth?: Date;
  /** 展示月份变化回调（配合 baseMonth 做双面板联动） */
  onMonthChange?: (d: Date) => void;
  /** 强制控制选中态的“区间端点”角色；仅用于双面板：面板左侧=开始端点，右侧=结束端点 */
  edgeRole?: "start" | "end";
  /** 受控“区间选取中”的起始点（双面板共享）；不传则内部自管理 */
  pendingStart?: Date | null;
  /** 点击某个日期回调（双面板模式下接管选取逻辑） */
  onPickDate?: (d: Date) => void;
  /** 隐藏头部导航（双面板只留右侧面板翻页） */
  hideNav?: boolean;
  /** 隐藏头部箭头按钮（保留标题）；双面板把箭头提到顶部两侧时用 */
  hideArrows?: boolean;
  /** 额外 className 传给 grid 日格子 */
  className?: string;
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const sameDay = (a?: Date, b?: Date) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sameMonth = (a?: Date, b?: Date) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const sameYear = (a?: Date, b?: Date) => !!a && !!b && a.getFullYear() === b.getFullYear();

const NavBtn = ({
  onClick, label, testid, children,
}: { onClick: () => void; label: string; testid: string; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    data-testid={testid}
    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
  >
    {children}
  </button>
);

export function Calendar({
  value = new Date(),
  onChange,
  selected,
  onSelectRange,
  view = "date",
  disabledDate,
  className,
  yearStep = 1,
  baseMonth,
  onMonthChange,
  edgeRole,
  pendingStart,
  onPickDate,
  hideNav,
  hideArrows,
}: CalendarProps) {
  const rangeMode = !!selected;
  const anchor = value ?? selected?.[0] ?? new Date();
  const [innerViewDate, setInnerViewDate] = React.useState(() => new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  // 受控模式：外部传入 baseMonth 则以其为准（双面板共享/联动）
  const viewDate = baseMonth ?? innerViewDate;
  const setViewDate = (d: Date) => {
    if (baseMonth) onMonthChange?.(d);
    else setInnerViewDate(d);
  };
  // 年份视图的分页起点（12 年一屏）
  const [yearBase, setYearBase] = React.useState(() => Math.floor(anchor.getFullYear() / 12) * 12);

  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const today = new Date();

  // 区间选择内部状态（点击第一个点、点击第二个点闭合）
  const [rangePicking, setRangePicking] = React.useState<Date | null>(null);
  React.useEffect(() => {
    if (rangeMode && selected?.[1]) setRangePicking(null);
  }, [rangeMode, selected]);

  /* ── 头部导航 ── */
  const header = (() => {
    if (view === "date") {
      return {
        title: `${y} 年 ${m + 1} 月`,
        titleTestid: "cal-title",
        onPrevMonth: () => setViewDate(new Date(y, m - 1, 1)),
        onNextMonth: () => setViewDate(new Date(y, m + 1, 1)),
        onPrevYear: () => setViewDate(new Date(y - yearStep, m, 1)),
        onNextYear: () => setViewDate(new Date(y + yearStep, m, 1)),
      };
    }
    if (view === "month") {
      return {
        title: `${y} 年`,
        titleTestid: "cal-title",
        onPrevMonth: () => setViewDate(new Date(y - 1, m, 1)),
        onNextMonth: () => setViewDate(new Date(y + 1, m, 1)),
        onPrevYear: () => setViewDate(new Date(y - 10, m, 1)),
        onNextYear: () => setViewDate(new Date(y + 10, m, 1)),
        isYearGroup: true,
      };
    }
    // year
    return {
      title: `${yearBase} - ${yearBase + 11}`,
      titleTestid: "cal-title",
      onPrevMonth: () => setYearBase((b) => b - 12),
      onNextMonth: () => setYearBase((b) => b + 12),
      onPrevYear: () => setYearBase((b) => b - 120),
      onNextYear: () => setYearBase((b) => b + 120),
      isYearGroup: true,
    };
  })();

  /* ── 日视图 cell ── */
  const dayCells: { date: Date; current: boolean }[] = [];
  if (view === "date") {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrev = new Date(y, m, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) dayCells.push({ date: new Date(y, m - 1, daysInPrev - i), current: false });
    for (let d = 1; d <= daysInMonth; d++) dayCells.push({ date: new Date(y, m, d), current: true });
    while (dayCells.length % 7 !== 0)
      dayCells.push({ date: new Date(y, m + 1, dayCells.length - firstDay - daysInMonth + 1), current: false });
  }

  const pick = (d: Date) => {
    if (disabledDate?.(d)) return;
    if (onPickDate) {
      // 双面板模式：选取逻辑由父级接管
      if (rangeMode) onSelectRange?.([d, undefined]);
      onPickDate(d);
      return;
    }
    if (rangeMode) {
      if (!rangePicking) {
        setRangePicking(d);
        onSelectRange?.([d, undefined]);
      } else {
        const [a, b] = rangePicking <= d ? [rangePicking, d] : [d, rangePicking];
        setRangePicking(null);
        onSelectRange?.([a, b]);
      }
      return;
    }
    // 月视图：选中整月第一天；年视图：选中该年 1 月 1 日
    onChange?.(d);
  };

  // 区间内高亮判断
  const activePending = pendingStart !== undefined ? pendingStart : rangePicking;
  const start = activePending ?? selected?.[0];
  const end = activePending ? undefined : selected?.[1];
  const inRange = (d: Date) => {
    if (!rangeMode || !start || !end) return false;
    return d > start && d < end;
  };
  const isEdge = (d: Date) => sameDay(d, start) || sameDay(d, end);

  return (
    <div className={cn("w-[268px] select-none", className)}>
      <div className={cn("mb-2 flex items-center justify-between", hideNav && "hidden")}>
        {!hideArrows && (
          <div className="flex items-center gap-0.5">
            <NavBtn onClick={header.onPrevYear} label={header.isYearGroup ? "上十年" : "上一年"} testid="cal-prev-year">
              <ChevronsLeft className="h-4 w-4" />
            </NavBtn>
            <NavBtn onClick={header.onPrevMonth} label={header.isYearGroup ? "上一年" : "上个月"} testid="cal-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </NavBtn>
          </div>
        )}
        <div className={cn("text-sm font-semibold", hideArrows && "mx-auto")} data-testid={header.titleTestid}>{header.title}</div>
        {!hideArrows && (
          <div className="flex items-center gap-0.5">
            <NavBtn onClick={header.onNextMonth} label={header.isYearGroup ? "下一年" : "下个月"} testid="cal-next-month">
              <ChevronRight className="h-4 w-4" />
            </NavBtn>
            <NavBtn onClick={header.onNextYear} label={header.isYearGroup ? "下十年" : "下一年"} testid="cal-next-year">
              <ChevronsRight className="h-4 w-4" />
            </NavBtn>
          </div>
        )}
      </div>

      {/* ── 月视图 ── */}
      {view === "month" && (
        <div className="grid grid-cols-3 gap-1" data-testid="cal-month-grid">
          {MONTHS.map((label, i) => {
            const md = new Date(y, i, 1);
            const active = sameMonth(md, selected?.[0] ?? value);
            const disabled = disabledDate?.(md);
            return (
              <button
                type="button"
                key={label}
                disabled={disabled}
                data-testid={`cal-month-${i + 1}`}
                onClick={() => pick(md)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-md text-sm transition-colors",
                  disabled && "cursor-not-allowed text-muted-foreground/30",
                  active && !disabled && "bg-gradient-to-br from-sky-500 to-indigo-500 font-semibold text-white shadow-[0_0_12px_-2px_rgba(99,102,241,0.8)]",
                  !active && !disabled && "hover:bg-accent"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 年视图 ── */}
      {view === "year" && (
        <div className="grid grid-cols-3 gap-1" data-testid="cal-year-grid">
          {Array.from({ length: 12 }, (_, i) => yearBase + i).map((yy) => {
            const yd = new Date(yy, 0, 1);
            const active = sameYear(yd, selected?.[0] ?? value);
            const disabled = disabledDate?.(yd);
            return (
              <button
                type="button"
                key={yy}
                disabled={disabled}
                data-testid={`cal-year-${yy}`}
                onClick={() => pick(yd)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-md text-sm transition-colors",
                  disabled && "cursor-not-allowed text-muted-foreground/30",
                  active && !disabled && "bg-gradient-to-br from-sky-500 to-indigo-500 font-semibold text-white shadow-[0_0_12px_-2px_rgba(99,102,241,0.8)]",
                  !active && !disabled && "hover:bg-accent"
                )}
              >
                {yy}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 日视图 ── */}
      {view === "date" && (
        <>
          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-muted-foreground">
            {WEEK.map((w) => <div key={w} className="py-1">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {dayCells.map((c, i) => {
              const disabled = disabledDate?.(c.date);
              const active = rangeMode
                ? (edgeRole === "start" && !activePending
                    ? sameDay(c.date, start)
                    : edgeRole === "start" && activePending
                    ? sameDay(c.date, activePending)
                    : edgeRole === "end"
                    ? sameDay(c.date, end)
                    : isEdge(c.date))
                : sameDay(c.date, value);
              const ranged = inRange(c.date);
              const isToday = sameDay(c.date, today);
              return (
                <button
                  type="button"
                  key={i}
                  disabled={disabled}
                  onClick={() => pick(c.date)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-xs transition-colors",
                    !c.current && "text-muted-foreground/40",
                    disabled && "cursor-not-allowed text-muted-foreground/25 line-through",
                    active && !disabled && "bg-gradient-to-br from-sky-500 to-indigo-500 font-semibold text-white shadow-[0_0_12px_-2px_rgba(99,102,241,0.8)]",
                    ranged && !disabled && "bg-accent text-foreground",
                    !active && !ranged && !disabled && "hover:bg-accent",
                    isToday && !active && !disabled && "ring-1 ring-primary/50"
                  )}
                >
                  {c.date.getDate()}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
