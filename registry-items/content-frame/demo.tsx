import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Demo() {
  return (
    <div className="flex flex-col gap-4">
      {/* 列表页：白框 + 顶部工具行（页头动作搬到这里最右侧） */}
      <ContentFrame>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">列表页 · 白框</span>
          <Badge variant="secondary" className="ml-auto font-normal">共 128 条</Badge>
          <Button size="sm">新建</Button>
        </div>
        <div className="rounded-md border border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          表格 / 卡片群 / 图表放这里
        </div>
      </ContentFrame>

      {/* 详情页：保留页头（实体身份），白框内用横线分区，不套小卡片 */}
      <ContentFrame padding={5}>
        <ContentFrameSection>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">详情页 · 白框</h2>
              <Badge variant="outline">运行中</Badge>
            </div>
            <Button size="sm" variant="back">返回</Button>
          </div>
        </ContentFrameSection>
        <ContentFrameSection>
          <p className="text-sm text-muted-foreground">
            分区用 <code>border-b</code> 横线，最后一块自动去线 —— 白框里再套卡片就是「框中框」。
          </p>
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
