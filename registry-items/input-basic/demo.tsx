import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Demo() {
  return (
    <div className="grid max-w-sm gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="email">邮箱</Label>
        <Input id="email" type="email" placeholder="name@example.com" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="disabled">禁用状态</Label>
        <Input id="disabled" disabled value="只读内容" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="err">异常状态</Label>
        <Input id="err" aria-invalid className="border-destructive focus-visible:ring-destructive" defaultValue="非法值" />
      </div>
    </div>
  );
}
