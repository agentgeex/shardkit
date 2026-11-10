/**
 * 页面案例：详情页 · 表格型只读展示（/detail-view）
 * ──────────────────────────────────────────────────────────
 * 2026-10-29 新增（维护者指定对标 vue-admin-tpl「组件 → 描述列表」border 模式）。
 *
 * 与 /detail 的分工：
 *   - /detail        —— 带页头、信息卡、时间线、标签页的「综合详情页」
 *   - /detail-view   —— **纯只读展示页**：标签列浅灰底的表格型描述列表，
 *                       零输入控件（input/select/textarea 一个都没有），
 *                       适合「只看不改」的档案 / 快照 / 审批留痕场景。
 *
 * 结构：ContentFrame 白框 → 框内首行身份条 → 三个横线分区（基础信息 / 内容 / 附件与元数据）。
 * 框内**不用卡片**，分区一律走 ContentFrameSection 的横线（规范 §10）。
 *
 * 依赖：content-frame（白框/分区）+ descriptions（本次新增基元）+ button / badge / status-badge
 */
import { useTranslation } from "react-i18next";
import { ArrowLeft, Edit3, FileText, Paperclip } from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Descriptions, DescriptionsItem } from "@/components/ui/descriptions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";

/**
 * 展示数据（只读快照）。
 * 刻意内联而非放 src/mock/：本页只服务「值类型覆盖」演示，
 * 与其它页面的业务 mock（agents / products）无共享需求，内联能保证改本页不牵动别处。
 *
 * 8 种值类型全覆盖：① 纯文本 ② 等宽 ID ③ 状态徽标 ④ 标签组
 *                    ⑤ 日期时间 ⑥ 数字 ⑦ 长文本块 ⑧ 附件缩略图
 */
const snapshot = {
  name: "第 10 章 · 结构化输出与白框模式",
  id: "run_w_ch10_s01_119dfdc4ce44",
  status: "running",
  tags: ["内容生产", "章节写作", "多轮审校", "白框模式"],
  owner: "shardkit_fe",
  createdAt: "2026-10-29 14:22:07",
  updatedAt: "2026-10-29 16:05:41",
  tokens: 1284500,
  steps: 137,
  durationMinutes: 103,
  chapter: "第 10 章",
  remark: "", // ← 空值样例：渲染为 "-"
  reviewer: null, // ← 空值样例：渲染为 "-"
  version: "v1.0.0",
  summary:
    "本章把「去页头 + 白框」的排版模式落成可复用基元：内容一律装进 ContentFrame 白框，框内不再叠卡片，分区改用横线；身份条降为框内首行，页头只在「这是哪一个对象」时保留。示例代码同时覆盖浅色/深色两套令牌，禁止原生色板与任意 z 值。",
  attachments: [
    { name: "第10章-终稿.docx", meta: "1.2 MB · 2026-10-29" },
    { name: "审校意见-r3.pdf", meta: "384 KB · 2026-10-29" },
  ],
};

export default function DetailViewPage() {
  const { t } = useTranslation();
  return (
    <div data-testid="detail-view-page" className="flex flex-col">
      <ContentFrame padding={5}>
        {/* 身份条：框内首行（导航已高亮页名）。h1 是「实体身份」而非页头标题，
            与 /detail 保持同一档；e2e 全站扫描也据此判定详情页身份。 */}
        <div
          data-testid="detail-head"
          className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-4"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <FileText className="h-5 w-5 shrink-0 text-primary" />
            <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight">{snapshot.name}</h1>
            <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{snapshot.id}</span>
            <StatusBadge status={snapshot.status} />
            <Badge variant="outline" className="font-normal">
              只读
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="edit" size="sm" data-testid="detail-view-edit">
              <Edit3 className="h-4 w-4" /> 编辑
            </Button>
            {/* 返回永远是最后一个 */}
            <Button variant="back" size="sm" data-testid="detail-view-back">
              <ArrowLeft className="h-4 w-4" /> 返回
            </Button>
          </div>
        </div>

        {/* ── 分区 1：基础信息 ───────────────────────────────── */}
        <ContentFrameSection>
          <h2 className="text-base font-semibold">基础信息</h2>
          <Descriptions>
            {/* ①纯文本 + ②等宽 ID */}
            <DescriptionsItem label={t("field.name")}>{snapshot.name}</DescriptionsItem>
            <DescriptionsItem label={t("field.execId")}>
              <span className="font-mono text-[13px]">{snapshot.id}</span>
            </DescriptionsItem>
            {/* ③状态徽标 + ④标签组 */}
            <DescriptionsItem label={t("field.status")}>
              <StatusBadge status={snapshot.status} />
            </DescriptionsItem>
            <DescriptionsItem label={t("field.tags")}>
              <div className="flex flex-wrap items-center gap-1.5">
                {snapshot.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </DescriptionsItem>
            {/* ①纯文本 + ⑤日期时间 */}
            <DescriptionsItem label={t("field.owner")}>{snapshot.owner}</DescriptionsItem>
            <DescriptionsItem label={t("field.createdAt")}>
              <span className="font-mono text-[13px] tabular-nums">{snapshot.createdAt}</span>
            </DescriptionsItem>
            <DescriptionsItem label={t("field.updatedAt")}>
              <span className="font-mono text-[13px] tabular-nums">{snapshot.updatedAt}</span>
            </DescriptionsItem>
            {/* ⑥数字 */}
            <DescriptionsItem label={t("field.tokenUsed")}>
              <span className="tabular-nums">{snapshot.tokens.toLocaleString()}</span>
            </DescriptionsItem>
            <DescriptionsItem label={t("field.steps")}>
              <span className="tabular-nums">{snapshot.steps}</span>
            </DescriptionsItem>
            <DescriptionsItem label={t("field.duration")}>
              <span className="tabular-nums">{snapshot.durationMinutes} 分钟</span>
            </DescriptionsItem>
            {/* 空值样例：备注 / 审批人 */}
            <DescriptionsItem label={t("field.note")}>{snapshot.remark}</DescriptionsItem>
            <DescriptionsItem label={t("field.approver")}>{snapshot.reviewer}</DescriptionsItem>
          </Descriptions>
        </ContentFrameSection>

        {/* ── 分区 2：内容（含整行长文本，验证 span=2）────────── */}
        <ContentFrameSection>
          <h2 className="text-base font-semibold">内容</h2>
          <Descriptions>
            <DescriptionsItem label={t("field.chapter")}>{snapshot.chapter}</DescriptionsItem>
            <DescriptionsItem label={t("field.version")}>{snapshot.version}</DescriptionsItem>
            {/* ⑦长文本块 —— 整行：自动换行 + 可读行长 */}
            <DescriptionsItem label={t("field.summary")} span={2}>
              <p className="max-w-prose whitespace-pre-line leading-relaxed">{snapshot.summary}</p>
            </DescriptionsItem>
          </Descriptions>
        </ContentFrameSection>

        {/* ── 分区 3：附件与元数据（附件整行，验证 span=2）────── */}
        <ContentFrameSection>
          <h2 className="text-base font-semibold">附件与元数据</h2>
          <Descriptions>
            {/* 先元数据、后附件：整行项一律排在本表末尾（与分区 2「内容摘要整行压尾」同写法）。
                基元也已强制 span≥2 后置，这里显式排好是为了源码里就能看出阅读顺序。 */}
            <DescriptionsItem label={t("field.archivePath")}>
              <span className="font-mono text-[13px]">/outputs/ch10/final</span>
            </DescriptionsItem>
            <DescriptionsItem label={t("field.retention")}>
              <span className="tabular-nums">180 天</span>
            </DescriptionsItem>
            {/* ⑧附件缩略图 —— 整行 */}
            <DescriptionsItem label={t("field.attachment")} span={2}>
              <div className="flex flex-wrap items-start gap-3">
                {snapshot.attachments.map((a) => (
                  <div key={a.name} className="flex items-center gap-3">
                    {/* 缩略图：纯令牌渐变 + 图标（不放外链图片，离线/截图都稳） */}
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-gradient-to-br from-muted to-muted-foreground/15">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm">{a.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">{a.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </DescriptionsItem>
          </Descriptions>
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
