import { AlertTriangle, CheckCircle2, Info, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Demo() {
  return (
    <div className="grid gap-3">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>提示</AlertTitle>
        <AlertDescription>这是一条中性提示，用于说明上下文信息。</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>成功</AlertTitle>
        <AlertDescription>操作已完成，结果已写入。</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>错误</AlertTitle>
        <AlertDescription>请求失败，请检查网络或重试。</AlertDescription>
      </Alert>
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>信息</AlertTitle>
        <AlertDescription>ShardKit 采用 copy-in 消费方式，不做 npm 依赖。</AlertDescription>
      </Alert>
    </div>
  );
}
