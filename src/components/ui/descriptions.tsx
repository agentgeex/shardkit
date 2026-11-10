import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ██ Descriptions —— 只读描述列表（表格型，标签列浅灰底）
 * ────────────────────────────────────────────────────────────────────────
 * 2026-10-29 新增（维护者指定对标 vue-admin-tpl / Element Plus `Descriptions` border 模式）。
 *
 * 形态：真 `<table>` 四列 = 标签 / 值 / 标签 / 值，整行字段 `span={2}` 的值横跨后三列。
 * 为什么用 table 而不是 grid：
 *   「网格线全包、相邻单元格共用一条 1px」只有 `border-collapse` 能做到；
 *   grid + 逐格 border 会出双线，靠负 margin 补又会在换行/缩放时露出 2px。
 *
 * ⚠️ 三条硬约束：
 *   1. **纯展示**：本文件内不得出现 input / select / textarea（只读页就该不可编辑）；
 *   2. **标签列浅灰底走语义令牌**：`bg-table-head`（= `hsl(var(--table-head))`，令牌定义在 index.css），
 *      不要硬编码 #F5F7FA，也不要自己调 `bg-muted`。
 *
 *      ── 这个值必须三方挤压，别凭手感改（维护者真实返工事故）────────────────
 *      light 的一格里同时存在三种色：白框底 255 / 标签底 / 网格线 231.7。
 *      标签底只有落在**两者中间**，才能同时与白、与线都拉开距离：
 *        · 当前 light `220 20% 96%` → 实测 rgb(243,244,247)：
 *          与网格线差 13.0、与白框差 10.3 —— 两个差都成立，1px 线可见。
 *        · 曾经取 93% → 实测 rgb(234,236,240)：只剩 5.0 的差，**网格线被底色吃掉**
 *          （维护者反馈「框看不见了」，是真实事故，不是审美偏好）。
 *        · 再往深走，白框那一侧就不够了 —— 两个差是此消彼长，244~245 已是双满足的最优区间。
 *
 *      ── dark 方向是**相反**的，别照抄 light 的思路 ──────────────────────
 *      暗色下网格线 rgb(39,39,43) 比标签更亮，所以标签要往**更暗**走线才浮得出来；
 *      但标签又必须比内容面 card rgb(21,21,25) 亮，否则整块沉进画框里。
 *      当前 dark `240 8% 12.5%` → rgb(29,29,34)：与线差 9.7、比内容面亮 8.3，两侧都成立。
 *      （取 15% 时是 rgb(35,35,41)，反而比线更亮 3.3 —— 线同样被吃掉。）
 *
 *      ⚠️ **改这个值必须同时验两个差：「底 vs 网格线」和「底 vs 框底」，
 *        只验一边必翻车**（light 要 ≥11 与 ≥10，dark 要 ≥8 与 ≥8）。
 *        验证方法：getComputedStyle 取 th 的 backgroundColor + td 的 borderLeftColor
 *        + ContentFrame 的 backgroundColor，三个 rgb 求均值再相减；
 *        光看 className 或截图都不算证据（截图看不出 1px 线是否被吃掉）。
 *   3. **空值统一 `-`**（半角连字符）+ `text-foreground`（正常前景色），由基元自动兜，页面不用各写一遍。
 *      刻意不用 muted：褪色的短横线在白底上会被目视读成「这格漏了内容」。
 *
 * 响应式：<768px 降为单列（标签在上、值在下），靠 `max-md:*` 把单元格改成 block；
 *        此时 colSpan 失效、填充格隐藏，横向不出滚动条。
 *
 * ⚠️ 不变量：**首行必须满行（4 格），否则 `table-fixed` 会把列数压小**
 *    （实测：若首行是 span=2 的整行项，该表被定成 2 列，后续 4 格行的余宽被三等分，
 *      右半列起点从 824 漂到 733.8，与同页其它表错位 90px）。
 *    基元已强制「span≥2 的整行项一律后置」（稳定分区，同 span 组内保持书写顺序），
 *    页面因此不需要靠自觉维持顺序。
 *    另：**本文件不许用 `<colgroup>/<col>` 定列宽** —— `<col>` 的优先级会压过
 *    `max-md:w-full`，手机端标签格会卡成 150px 小灰块。
 */
export type DescriptionSpan = 1 | 2;

export interface DescriptionsItemProps {
  /** 标签文案（左侧灰底格） */
  label: React.ReactNode;
  /** 值（ReactNode）；`null / undefined / '' / 空白串` 一律渲染成 `-` */
  children?: React.ReactNode;
  /** 1 = 半行（默认，两个字段并排） · 2 = 整行（值横跨 3 列） */
  span?: DescriptionSpan;
}

/**
 * 占位组件：只在 `Descriptions` 内部被读取 props，自身永不渲染。
 * 保留成组件是为了 JSX 可读性（`<DescriptionsItem label="…">值</DescriptionsItem>`）。
 */
export function DescriptionsItem(_props: DescriptionsItemProps): null {
  return null;
}
DescriptionsItem.displayName = "DescriptionsItem";

export interface DescriptionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 标签列宽（px），默认 150（参考页同档） */
  labelWidth?: number;
}

// 标签列宽 150px 只写在 th 上（不再用 <colgroup>）：
// <col> 的列宽优先级高于 `max-md:w-full`，会让手机端标签格卡在 150px 的小灰块。
const LABEL_CELL = cn(
  "w-[150px] border border-border bg-table-head px-2.5 py-3 text-left align-middle text-sm font-semibold text-foreground",
  // <768：单列堆叠，标签在上；与下方值之间不加线（由值的下边框统一画）
  "max-md:block max-md:w-full max-md:border-0 max-md:border-b-0 max-md:px-3 max-md:py-2"
);

const VALUE_CELL = cn(
  "border border-border px-2.5 py-3 text-left align-middle text-sm font-normal text-foreground",
  "max-md:block max-md:w-full max-md:border-0 max-md:border-b max-md:border-border max-md:px-3"
);

/** 空值判定：null / undefined / 空串 / 纯空白 */
function isBlank(node: React.ReactNode): boolean {
  if (node === null || node === undefined || node === false) return true;
  if (typeof node === "string") return node.trim() === "";
  if (typeof node === "number") return false;
  return false;
}

function renderValue(node: React.ReactNode): React.ReactNode {
  if (isBlank(node)) return <span className="text-foreground">-</span>;
  return node;
}

interface ItemEl extends React.ReactElement<DescriptionsItemProps> {}

export function Descriptions({ children, className, labelWidth = 150, ...props }: DescriptionsProps) {
  const items = React.Children.toArray(children).filter(
    (c): c is ItemEl => React.isValidElement(c) && c.type === DescriptionsItem
  );

  // 自定义标签列宽时用内联 width 覆盖默认 150（默认走 className，手机端才能被 w-full 盖掉）
  const labelStyle: React.CSSProperties | undefined =
    labelWidth === 150 ? undefined : { width: labelWidth };

  // 整行项后置（稳定分区，不用 sort：同 span 组内严格保持页面书写顺序）。
  // 目的：保证首行是满行 → table-fixed 的列宽由 4 格定死 → 同页多张表天然对齐。
  const halfItems = items.filter((it) => (it.props.span ?? 1) !== 2);
  const fullItems = items.filter((it) => (it.props.span ?? 1) === 2);
  const ordered = [...halfItems, ...fullItems];

  // 行打包：span=2 独占一行；span=1 两个凑一行；奇数个时补一个空格子保持网格闭合
  const rows: ItemEl[][] = [];
  let bucket: ItemEl[] = [];
  for (const it of ordered) {
    if ((it.props.span ?? 1) === 2) {
      if (bucket.length) {
        rows.push(bucket);
        bucket = [];
      }
      rows.push([it]);
    } else {
      bucket.push(it);
      if (bucket.length === 2) {
        rows.push(bucket);
        bucket = [];
      }
    }
  }
  if (bucket.length) rows.push(bucket);

  return (
    <div className={cn("w-full max-md:rounded-none", className)} {...props}>
      <table className="w-full table-fixed border-collapse text-sm">
        <tbody>
          {rows.map((row, ri) => {
            const isFull = row.length === 1 && (row[0].props.span ?? 1) === 2;
            if (isFull) {
              return (
                <tr key={ri}>
                  <th scope="row" style={labelStyle} className={LABEL_CELL}>
                    {row[0].props.label}
                  </th>
                  <td colSpan={3} className={VALUE_CELL}>
                    {renderValue(row[0].props.children)}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={ri}>
                {row.map((it, i) => (
                  <React.Fragment key={i}>
                    <th scope="row" style={labelStyle} className={LABEL_CELL}>
                      {it.props.label}
                    </th>
                    <td className={VALUE_CELL}>{renderValue(it.props.children)}</td>
                  </React.Fragment>
                ))}
                {row.length === 1 && (
                  <>
                    <th scope="row" aria-hidden className={cn(LABEL_CELL, "max-md:hidden")} />
                    <td aria-hidden className={cn(VALUE_CELL, "max-md:hidden")} />
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
