import { Progress } from "@/components/ui/progress";

export default function Demo() {
  return (
    <div className="max-w-md space-y-5">
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>任务进度</span>
          <span>35%</span>
        </div>
        <Progress value={35} />
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>上传</span>
          <span>78%</span>
        </div>
        <Progress value={78} />
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>完成</span>
          <span>100%</span>
        </div>
        <Progress value={100} indicatorClassName="bg-emerald-500" />
      </div>
    </div>
  );
}
