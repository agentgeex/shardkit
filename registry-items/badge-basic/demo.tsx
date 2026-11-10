import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Demo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>默认</Badge>
      <Badge variant="secondary">次要</Badge>
      <Badge variant="outline">描边</Badge>
      <Badge variant="destructive">危险</Badge>
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
        <CheckCircle2 className="h-3 w-3" /> 已完成
      </Badge>
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" /> 进行中
      </Badge>
      <Badge variant="outline" className="gap-1 text-destructive">
        <XCircle className="h-3 w-3" /> 失败
      </Badge>
    </div>
  );
}
