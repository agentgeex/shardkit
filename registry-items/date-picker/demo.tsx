import * as React from "react";
import { DatePicker, DateTimePicker } from "@/components/ui/date-picker";

export default function Demo() {
  const [d, setD] = React.useState<Date | undefined>(new Date());
  const [dt, setDt] = React.useState<Date | undefined>(new Date());
  return (
    <div className="flex flex-wrap gap-4">
      <DatePicker value={d} onChange={setD} />
      <DateTimePicker value={dt} onChange={setDt} />
    </div>
  );
}
