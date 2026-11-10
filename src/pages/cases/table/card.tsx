/**
 * 页面案例：表格 · 卡片表格（CardTable）
 * ──────────────────────────────────────────────────
 * 参考：vue-admin-tpl/src/views/Components/Table/CardTable.vue
 *   （左侧导航「表格 → 卡片表格」，i18n `tableDemo.cardTable`）
 *
 * 复刻要点：
 *   1. 内容区标题「卡片表格」
 *   2. 数据以**卡片网格**呈现（Element Table 的 custom-content 形态）：
 *      每张卡片 = 圆形 logo + 名称（加粗）+ 3 行截断描述
 *   3. 卡片底部 footer：居中的「操作一 | 操作二」两个链接（中间竖向分隔）
 *   4. 卡片尺寸贴合参考：宽约 200px、间距 20px；此处用响应式 flex 网格
 *
 * 路由：/table/card
 */
import * as React from "react";
import { LayoutGrid, ImageIcon } from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { CARD_ROWS, type CardRow } from "./mock";

export default function TableCardCase() {
  const { toast } = useToast();

  const act = (row: CardRow, which: string) =>
    toast({ title: which, description: `${which}：${row.name}` });

  return (
    <div data-testid="table-card-page" className="flex flex-col">
      <ContentFrame className="flex flex-col gap-5">
      <ContentFrameSection>
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-4 w-4 text-teal-500" /> 卡片表格
          </h2>
          <p className="text-sm text-muted-foreground">
            以卡片网格承载数据：圆形头像 + 名称 + 描述 + 底部操作，适合「图片/资源」类列表。
          </p>
        </div>
        <div>
          <div
            data-testid="card-table-grid"
            className="flex flex-wrap gap-5"
          >
            {CARD_ROWS.map((row) => (
              <div
                key={row.id}
                data-testid={`card-item-${row.name}`}
                className="group w-[220px] overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* 主体：logo + 名称 + 描述 */}
                <div className="flex cursor-pointer p-4">
                  <div className="pr-4">
                    {row.logo ? (
                      <img
                        src={row.logo}
                        alt={row.name}
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-border"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 truncate text-base font-bold">{row.name}</div>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                      {row.desc}
                    </p>
                  </div>
                </div>

                {/* 底部操作：操作一 | 操作二 */}
                <div className="flex items-center border-t py-2">
                  <button
                    type="button"
                    onClick={() => act(row, "操作一")}
                    className="flex-1 text-center text-sm text-primary transition-colors hover:underline"
                  >
                    操作一
                  </button>
                  <Separator orientation="vertical" className="h-4" />
                  <button
                    type="button"
                    onClick={() => act(row, "操作二")}
                    className="flex-1 text-center text-sm text-primary transition-colors hover:underline"
                  >
                    操作二
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
