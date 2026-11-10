import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Demo() {
  return (
    <div className="grid gap-3">
      <Label className="flex items-center gap-2 font-normal"><Checkbox defaultChecked /> 已接入 API</Label>
      <Label className="flex items-center gap-2 font-normal"><Checkbox /> 人工确认</Label>
      <Label className="flex items-center gap-2 font-normal opacity-50"><Checkbox disabled /> 禁用项</Label>
    </div>
  );
}
