import * as React from "react";
import { Cascader } from "@/components/ui/cascader";

const OPTIONS = [
  { value: "guide", label: "指南", children: [
    { value: "spec", label: "规范", children: [{ value: "consistency", label: "一致性" }] },
  ]},
  { value: "comp", label: "组件", children: [{ value: "button", label: "按钮" }] },
];

export default function Demo() {
  const [v, setV] = React.useState([]);
  return <Cascader options={OPTIONS} value={v} onChange={(p) => setV(p)} suppressHydrationWarning />;
}
