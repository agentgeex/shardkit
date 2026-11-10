import * as React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function Demo() {
  const [v, setV] = React.useState("standard");
  return (
    <RadioGroup value={v} onValueChange={setV} className="grid gap-2 sm:grid-cols-3">
      {[["light","轻量"],["standard","标准"],["heavy","重度"]].map(([val, label]) => (
        <Label key={val} htmlFor={val} className="flex items-center gap-2 font-normal">
          <RadioGroupItem id={val} value={val} /> {label}
        </Label>
      ))}
    </RadioGroup>
  );
}
