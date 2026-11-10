import * as React from "react";
import { Rate } from "@/components/ui/rate";

export default function Demo() {
  const [v, setV] = React.useState(3);
  return <Rate value={v} onChange={setV} allowHalf />;
}
