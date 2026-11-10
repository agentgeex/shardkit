import * as React from "react";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

export default function Demo() {
  const [md, setMd] = React.useState("# 标题\n\n- 支持实时预览\n- 支持 GFM 待办\n\n- [x] 已完成\n- [ ] 待办");
  return <MarkdownEditor value={md} onChange={setMd} />;
}
