import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Demo() {
  return (
    <Tabs defaultValue="overview" className="max-w-md">
      <TabsList>
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="tasks">任务</TabsTrigger>
        <TabsTrigger value="settings">设置</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="rounded-md border p-4 text-sm text-muted-foreground">
        概览内容：关键指标与状态摘要。
      </TabsContent>
      <TabsContent value="tasks" className="rounded-md border p-4 text-sm text-muted-foreground">
        任务内容：运行中的任务列表。
      </TabsContent>
      <TabsContent value="settings" className="rounded-md border p-4 text-sm text-muted-foreground">
        设置内容：配置项。
      </TabsContent>
    </Tabs>
  );
}
