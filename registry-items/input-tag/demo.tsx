import * as React from "react";
import { InputTag } from "@/components/ui/input-tag";

export default function Demo() {
  const [v, setV] = React.useState(["React", "Vite"]);
  return <InputTag value={v} onChange={setV} placeholder="输入后回车添加" />;
}
