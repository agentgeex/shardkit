import * as React from "react";
import { Pagination } from "@/components/ui/pagination";

export default function Demo() {
  const [p, setP] = React.useState(2);
  return <Pagination page={p} pageCount={10} onPageChange={setP} />;
}
