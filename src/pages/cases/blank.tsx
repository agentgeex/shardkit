/**
 * 页面案例：空白页（Blank / 默认工作区）
 * ────────────────────────────────────────────────────────────────────────────
 * 定位：标签栏的「默认兜底页」。
 *   - 当工作区里所有标签被关闭（关闭全部 / 关到最后一张）时，回落到本页；
 *   - 本页对应的标签是**固定且不可关闭**的默认标签（见 TabsContext.HOME_TAB）；
 *   - 内容刻意保持空白（仅一句轻提示），后续可在此挂「欢迎 / 快捷入口 /
 *     最近访问 / Agent 建议动作」等，作为真正的落地首页。
 *
 * 入口路由：/blank（侧边栏「页面案例」组「空白页」）
 *
 * 说明：本页与「案例索引」(/，案例卡总览) 是两个不同的东西 ——
 *   - /        ：案例索引，普通可关闭标签，从左侧导航可达；
 *   - /blank   ：默认空白工作区，标签全关后的兜底，固定不可关。
 */
import { SquareDashed } from "lucide-react";
import { ContentFrame } from "@/components/ui/content-frame";

export default function BlankCase() {
  return (
    <div data-testid="blank-page" className="flex flex-col">
      <ContentFrame className="flex min-h-[60vh] items-center justify-center border-dashed">
        <div className="flex max-w-lg flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed text-muted-foreground">
            <SquareDashed className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">空白工作区</p>
            <p className="text-xs text-muted-foreground">
              标签全部关闭后默认回落到这里。从左侧导航打开任意案例即可开始。
            </p>
          </div>
        </div>
      </ContentFrame>
    </div>
  );
}
