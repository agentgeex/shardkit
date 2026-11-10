import * as React from "react";
import { ColorPicker } from "@/components/ui/color-picker";

export default function Demo() {
  const [c, setC] = React.useState("#6366f1");
  return <ColorPicker value={c} onChange={setC} />;
}
