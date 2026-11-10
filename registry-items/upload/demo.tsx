import * as React from "react";
import { Upload } from "@/components/ui/upload";

export default function Demo() {
  const [v, setV] = React.useState([]);
  return <Upload value={v} onChange={setV} multiple maxCount={3} tip="支持多选，最多 3 个文件" />;
}
