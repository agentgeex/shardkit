/**
 * Markdown 编辑器（编辑 + 实时预览）。
 *
 * 选型理由：
 * - @uiw/react-md-editor：开箱即用，自带分栏预览 / 工具栏 / 语法高亮，
 *   基于 rehype/remark 生态，社区成熟，体积可控。
 */
import * as React from "react";
import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

export function MarkdownEditor({
  value,
  onChange,
  height = 360,
  className,
}: {
  value?: string;
  onChange?: (v: string) => void;
  height?: number;
  className?: string;
}) {
  const [dark, setDark] = React.useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : true
  );

  // 跟随站点主题
  React.useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setDark(el.classList.contains("dark")));
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn("win3-md overflow-hidden rounded-lg border bg-background/60", className)}
      data-color-mode={dark ? "dark" : "light"}
    >
      <MDEditor
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        height={height}
        preview="live"
        visibleDragbar={false}
        style={{ background: "transparent" }}
      />
    </div>
  );
}
