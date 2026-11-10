import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function Demo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild><Button variant="outline">悬停提示</Button></TooltipTrigger>
        <TooltipContent>这是一段悬浮提示文字</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
