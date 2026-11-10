import * as React from "react";
import { Slider } from "@/components/ui/slider";

export default function Demo() {
  const [v, setV] = React.useState([40]);
  return (
    <div className="flex max-w-sm items-center gap-4">
      <Slider value={v} onValueChange={setV} min={0} max={100} step={5} />
      <span className="w-10 text-sm tabular-nums">{v[0]}</span>
    </div>
  );
}
