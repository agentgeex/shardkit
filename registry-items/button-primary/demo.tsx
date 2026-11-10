import { Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Demo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button>主按钮</Button>
      <Button variant="secondary">次要</Button>
      <Button variant="outline">描边</Button>
      <Button variant="ghost">幽灵</Button>
      <Button variant="destructive">
        <Trash2 className="h-4 w-4" /> 删除
      </Button>
      <Button variant="link">链接按钮</Button>
      <Button disabled>禁用</Button>
      <Button size="icon" aria-label="新建">
        <Plus className="h-4 w-4" />
      </Button>
      <Button>
        <Mail className="h-4 w-4" /> 发送
      </Button>
    </div>
  );
}
