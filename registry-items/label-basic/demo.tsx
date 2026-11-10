import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Demo() {
  return (
    <div className="grid max-w-sm gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="a">用户名</Label>
        <Input id="a" className="h-8" placeholder="绑定 htmlFor" />
      </div>
      <div className="flex items-center gap-2">
        <Label htmlFor="b" className="text-destructive">
          必填项 *
        </Label>
        <Input id="b" className="h-8" />
      </div>
      <div className="flex items-center gap-2 opacity-50">
        <Label htmlFor="c">禁用关联</Label>
        <Input id="c" className="h-8" disabled />
      </div>
    </div>
  );
}
