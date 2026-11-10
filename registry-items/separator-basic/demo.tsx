import { Separator } from "@/components/ui/separator";

export default function Demo() {
  return (
    <div className="max-w-md space-y-3 text-sm">
      <div>上方内容块</div>
      <Separator />
      <div>下方内容块</div>
      <div className="flex h-10 items-center gap-3">
        <span>左</span>
        <Separator orientation="vertical" />
        <span>中</span>
        <Separator orientation="vertical" />
        <span>右</span>
      </div>
    </div>
  );
}
