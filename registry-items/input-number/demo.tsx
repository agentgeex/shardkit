import * as React from "react";
import { InputNumber } from "@/components/ui/input-number";

export default function Demo() {
  const [v, setV] = React.useState(3);
  return (
    <div className="flex items-center gap-3">
      <InputNumber value={v} onChange={setV} min={0} max={99} step={1} />
      <span className="text-sm text-muted-foreground">当前：{v}</span>
    </div>
  );
}
