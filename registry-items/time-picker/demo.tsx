import * as React from "react";
import { TimePicker, TimeSelect } from "@/components/ui/time-picker";

export default function Demo() {
  const [t, setT] = React.useState("09:30");
  const [ts, setTs] = React.useState("");
  return (
    <div className="flex flex-col gap-3">
      <TimePicker value={t} onChange={setT} />
      <TimeSelect value={ts} onChange={setTs} start="08:30" end="18:00" stepMinutes={30} />
    </div>
  );
}
