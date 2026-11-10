import * as React from "react";
import { cn } from "@/lib/utils";

/** TableBody 的斑马线开关通过 context 下发给 TableRow（才能在 tr 上生成 even: 变体，保证 hover 可覆盖） */
const TableStripedContext = React.createContext(false);

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-lg border border-border">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b bg-muted/40", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement> & {
  /** 斑马线：偶数行加浅底色（语义 token bg-muted/30，深色模式自动适配；hover 仍可覆盖） */
  striped?: boolean;
};

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, striped = false, ...props }, ref) => (
    <TableStripedContext.Provider value={striped}>
      <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
    </TableStripedContext.Provider>
  )
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    const striped = React.useContext(TableStripedContext);
    return (
      <tr
        ref={ref}
        className={cn(
          "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
          striped && "even:bg-muted/30",
          className
        )}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      // 2026-10-30：表头字重 500 → 600（维护者要求所有表头加粗；只动字重，字号/颜色/高度一律不变）。
      // 600 = 本项目字重阶梯既有档位（/detail-view 标签列即 600），不擅自上 700。
      "h-10 border-r border-border/60 px-3 text-left align-middle text-xs font-semibold text-muted-foreground last:border-r-0 [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("border-r border-border/60 p-3 align-middle last:border-r-0 [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption };
