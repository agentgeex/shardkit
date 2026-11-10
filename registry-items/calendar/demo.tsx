import * as React from "react";
import { Calendar } from "@/components/ui/calendar";

export default function Demo() {
  const [d, setD] = React.useState<Date | undefined>(new Date());
  return <Calendar value={d} onChange={setD} className="rounded-lg border p-3" />;
}
