import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function Demo() {
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant="outline">打开浮层</Button></PopoverTrigger>
      <PopoverContent className="w-64 text-sm">浮层内容：任意 React 节点。</PopoverContent>
    </Popover>
  );
}
