/**
 * 页面案例：详情页 Detail（信息卡 + 描述列表 + 时间线 + 关联表格 + 标签页）
 * ──────────────────────────────────────────────────────────
 * 一个「和真实应用一样完整」的后台详情页：
 *   - 页头：名称 / 状态 / 角色 + 返回 / 编辑
 *   - 概览：基础字段描述列表 + 资源指标卡
 *   - 活动时间线
 *   - 标签页：概览 / 执行记录 / 配置（JSON 视图）
 *
 * 依赖：shadcn {card,badge,separator,button,table,tabs} + page-header / status-badge
 */
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bot, Cpu, Activity, Clock, Edit3, Copy } from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { agents, runs } from "@/mock/data";

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm"}>{value}</span>
    </div>
  );
}

export default function DetailPage() {
  const { t } = useTranslation();
  const agent = agents[0];
  const timeline = [
    { t: "09:20", text: "执行「每日选题生成」，产出 12 条选题", tone: "bg-emerald-500" },
    { t: "09:12", text: "接收调度任务 run_9001", tone: "bg-sky-500" },
    { t: "08:58", text: "模型路由切换至 gpt-4o", tone: "bg-violet-500" },
    { t: "08:40", text: "Agent 上线", tone: "bg-muted-foreground" },
  ];

  return (
    <div data-testid="detail-page" className="flex flex-col">
      <ContentFrame padding={5}>
        {/* 身份条：原页头的标题/ID/状态 + 编辑/返回，全部降为框内首行（导航已高亮页名） */}
        <div
          data-testid="detail-head"
          className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-4"
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Bot className="h-5 w-5 shrink-0 text-primary" />
            <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight">{agent.name}</h1>
            <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{agent.id}</span>
            <StatusBadge status={agent.status} />
            <Badge variant="outline" className="font-normal">{agent.role}</Badge>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="edit" size="sm"><Edit3 className="h-4 w-4" /> 编辑</Button>
            {/* 返回永远是最后一个 */}
            <Button variant="back" size="sm"><ArrowLeft className="h-4 w-4" /> 返回</Button>
          </div>
        </div>

        {/* 分区直接作为白框子项：间距由各 section 的 pb-5 自报。
            容器若再加 gap-5，就会与 section padding 双算（规范踩坑 7）。 */}
        {/* 配置概览 */}
          <ContentFrameSection>
            <h2 className="text-base font-semibold">配置概览</h2>
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={t("field.baseModel")} value={agent.model} mono />
              <Field label={t("field.role")} value={agent.role} />
              <Field label={t("field.tasksTotal")} value={<span className="tabular-nums">{agent.tasks}</span>} />
              <Field label={t("field.tokenTotal")} value={<span className="tabular-nums">{agent.tokens.toLocaleString()}</span>} />
            </div>
          </ContentFrameSection>

          {/* 实时指标（原三个带边框小卡 → 去边框，纯字段式） */}
          <ContentFrameSection>
            <h2 className="text-base font-semibold">实时指标</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: Cpu, label: "CPU", value: "23%" },
                { icon: Activity, label: "队列", value: "0" },
                { icon: Clock, label: "运行时长", value: "6h 12m" },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <m.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    <div className="text-sm font-semibold tabular-nums">{m.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </ContentFrameSection>

          {/* 活动时间线 */}
          <ContentFrameSection>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">活动时间线</h2>
              <p className="text-sm text-muted-foreground">最近事件</p>
            </div>
            <ol className="relative flex flex-col gap-4 border-l border-border pl-4">
              {timeline.map((e, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${e.tone} ring-4 ring-card`} />
                  <div className="text-xs text-muted-foreground tabular-nums">{e.t}</div>
                  <div className="text-sm">{e.text}</div>
                </li>
              ))}
            </ol>
          </ContentFrameSection>

          {/* 详情标签页 */}
          <ContentFrameSection>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">详情</h2>
              <p className="text-sm text-muted-foreground">按标签页查看更多信息</p>
            </div>
            <Tabs defaultValue="runs">
              <TabsList>
                <TabsTrigger value="runs">执行记录</TabsTrigger>
                <TabsTrigger value="config">配置</TabsTrigger>
                <TabsTrigger value="logs">日志</TabsTrigger>
              </TabsList>

              <TabsContent value="runs">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("field.execId")}</TableHead>
                      <TableHead>{t("field.recipe")}</TableHead>
                      <TableHead>{t("field.startedAt")}</TableHead>
                      <TableHead>{t("field.status")}</TableHead>
                      <TableHead className="text-right">{t("field.duration")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id}</TableCell>
                        <TableCell>{r.recipe}</TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">{r.startedAt}</TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell className="text-right tabular-nums">{r.duration}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="config">
                <div className="relative rounded-lg border bg-muted/40 p-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    aria-label="复制配置"
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(agent, null, 2))}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <pre className="overflow-auto text-xs leading-relaxed">
{JSON.stringify(agent, null, 2)}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent value="logs">
                <ol className="flex flex-col gap-2 font-mono text-xs">
                  {[
                    "[09:20:11] INFO  执行配方「每日选题生成」完成，产出 12 条",
                    "[09:12:03] INFO  接收调度任务 run_9001",
                    "[09:12:03] DEBUG 载入配方参数 { topN: 20, market: 'SEA' }",
                    "[08:58:44] INFO  模型路由切换 gpt-4o → claude-3.5",
                    `[08:40:00] INFO  Agent ${agent.id} 上线`,
                  ].map((l, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-muted-foreground">{l.slice(1, 9)}</span>
                      <span>{l.slice(11)}</span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            </Tabs>
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
