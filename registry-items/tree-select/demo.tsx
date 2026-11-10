import * as React from "react";
import { TreeSelect } from "@/components/ui/tree-select";

const TREE = [
  { value: "1", label: "一级 1-1", children: [{ value: "1-1", label: "二级 1-1-1" }] },
  { value: "2", label: "一级 1-2" },
];

export default function Demo() {
  const [v, setV] = React.useState([]);
  return <TreeSelect tree={TREE} value={v} onChange={setV} />;
}
