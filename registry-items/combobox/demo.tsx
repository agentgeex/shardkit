import * as React from "react";
import { Combobox } from "@/components/ui/combobox";

const OPTIONS = [
  { value: "vue", label: "Vue" },
  { value: "react", label: "React" },
  { value: "angular", label: "Angular" },
];

export default function Demo() {
  const [v, setV] = React.useState("");
  return <Combobox options={OPTIONS} value={v} onChange={setV} placeholder="选择或输入框架" />;
}
