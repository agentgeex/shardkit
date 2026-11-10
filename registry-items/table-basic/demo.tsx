import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const rows = [
  { name: "gallery 页面", stack: "React", status: "可用" },
  { name: "detail 页面", stack: "React", status: "可用" },
  { name: "registry 构建脚本", stack: "Node", status: "可用" },
  { name: "Fuse.js 检索", stack: "React", status: "待整理" },
];

export default function Demo() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>条目</TableHead>
            <TableHead>技术栈</TableHead>
            <TableHead>状态</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-muted-foreground">{r.stack}</TableCell>
              <TableCell>
                <Badge variant={r.status === "可用" ? "default" : "secondary"}>{r.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
