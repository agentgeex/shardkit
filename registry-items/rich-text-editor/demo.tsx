import * as React from "react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

export default function Demo() {
  const [html, setHtml] = React.useState("<p>用 <strong>按钮</strong> 驱动 Agent，而不是写 Prompt。</p>");
  return <RichTextEditor value={html} onChange={setHtml} />;
}
