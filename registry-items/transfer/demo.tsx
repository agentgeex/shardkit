import * as React from "react";
import { Transfer, type TransferItem } from "@/components/ui/transfer";

const DATA: TransferItem[] = [
  { key: "1", title: "数据采集 Agent" },
  { key: "2", title: "内容生成 Agent" },
  { key: "3", title: "渠道分发 Agent" },
  { key: "4", title: "合规审查 Agent", disabled: true },
];

export default function Demo() {
  const [keys, setKeys] = React.useState<string[]>(["2"]);
  return <Transfer dataSource={DATA} targetKeys={keys} onChange={setKeys} />;
}
