import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Demo() {
  return (
    <div className="grid max-w-sm gap-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="s1">启用自动刷新</Label>
        <Switch id="s1" defaultChecked />
      </div>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="s2">发送邮件通知</Label>
        <Switch id="s2" />
      </div>
      <div className="flex items-center justify-between gap-4 opacity-50">
        <Label htmlFor="s3">禁用状态</Label>
        <Switch id="s3" disabled defaultChecked />
      </div>
    </div>
  );
}
