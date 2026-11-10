import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Demo() {
  return (
    <div className="grid max-w-md gap-1.5">
      <Label htmlFor="bio">简介</Label>
      <Textarea id="bio" placeholder="说点什么…" defaultValue={"ShardKit — 可复制取用的 UI 碎片工具箱。\n支持多行文本。"} />
      <p className="text-xs text-muted-foreground">支持多行输入与占位提示。</p>
    </div>
  );
}
