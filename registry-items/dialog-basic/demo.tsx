import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Demo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>打开对话框</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建组件条目</DialogTitle>
          <DialogDescription>
            填写 id 后会在 registry-items/&lt;id&gt;/ 下生成条目。
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid gap-1.5">
            <Label htmlFor="sid">组件 ID</Label>
            <Input id="sid" placeholder="如 hero-section" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost">取消</Button>
          <Button>创建</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
