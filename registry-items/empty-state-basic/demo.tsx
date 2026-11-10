import { Inbox, SearchX, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function Demo() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 常规：空列表 + 明确下一步 */}
      <div className="rounded-lg border">
        <EmptyState
          icon={Inbox}
          title="暂无数据"
          description="点击下方按钮创建你的第一条记录"
          action={
            <Button size="sm">
              <Plus className="h-4 w-4" /> 新建
            </Button>
          }
        />
      </div>

      {/* 常规：无搜索结果 */}
      <div className="rounded-lg border">
        <EmptyState
          icon={SearchX}
          title="无匹配结果"
          description="试试清除筛选条件或换个关键词"
        />
      </div>

      {/* 紧凑：用于下拉 / 弹层 / 小容器 */}
      <div className="rounded-lg border">
        <EmptyState compact icon={Inbox} title="无数据" />
      </div>
    </div>
  );
}
