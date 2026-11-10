import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Demo() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>卡片标题</CardTitle>
          <CardDescription>一句话描述这个卡片承载的信息。</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          卡片是布局容器的基础单元，适合承载指标、条目、表单分区。
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm">操作</Button>
          <Button size="sm" variant="ghost">
            取消
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            指标卡片
            <Badge variant="secondary">+12%</Badge>
          </CardTitle>
          <CardDescription>运行中任务</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">1,284</div>
          <div className="mt-1 text-xs text-muted-foreground">较昨日 +32</div>
        </CardContent>
      </Card>
    </div>
  );
}
