/**
 * 页面案例：布局区块 Blocks（统计卡组 / 表格工具条 / 空态 / 用户卡片）
 * ────────────────────────────────────────────────────────────
 * 区块级案例：整块复制进任意页面。
 * 依赖：shadcn {card,badge,button,table,input,separator} + lucide-react + page-header
 */
import { Users, DollarSign, Package, TrendingUp, Plus, Filter, Search, Inbox, Mail, ShieldAlert, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentFrame } from "@/components/ui/content-frame";

function MetricCard({ label, value, delta, icon: Icon, tone }: {
  label: string; value: string; delta: string; icon: any; tone: string;
}) {
  const up = delta.startsWith("+");
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
        </div>
        <span className={`ml-auto text-xs ${up ? "text-emerald-500" : "text-destructive"}`}>{delta}</span>
      </CardContent>
    </Card>
  );
}

function Block({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function BlocksPage() {
  return (
    <div data-testid="blocks-page" className="flex flex-col">
      <ContentFrame>
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm text-muted-foreground">可整块复制的页面级区块：统计卡组 / 工具条 / 空态 / 用户卡</p>
      </div>

      <Block title="统计卡组" desc="4 个关键指标卡，常用于页面顶部">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="活跃用户" value="2,847" delta="+12%" icon={Users} tone="bg-sky-500/15 text-sky-400" />
          <MetricCard label="本月 GMV" value="$84.2K" delta="+8.1%" icon={DollarSign} tone="bg-emerald-500/15 text-emerald-400" />
          <MetricCard label="在售 SKU" value="1,203" delta="-2%" icon={Package} tone="bg-violet-500/15 text-violet-400" />
          <MetricCard label="转化率" value="3.42%" delta="+0.4%" icon={TrendingUp} tone="bg-amber-500/15 text-amber-400" />
        </div>
      </Block>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Block title="表格工具条" desc="搜索 + 筛选 + 操作按钮的一体化工具条">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜索…" className="pl-8" />
            </div>
            <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> 筛选</Button>
            <Button size="sm"><Plus className="h-4 w-4" /> 新建</Button>
          </div>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground">工具条通常粘在表格上方，与分页联动。</p>
        </Block>

        <Block title="空态" desc="无数据 / 无结果的占位区块（统一 EmptyState 组件）">
          <EmptyState
            icon={Inbox}
            title="暂无数据"
            description="点击下方按钮创建你的第一条记录"
            action={
              <Button size="sm"><Plus className="h-4 w-4" /> 新建</Button>
            }
          />
        </Block>

        <Block title="用户卡片" desc="头像 + 信息 + 操作的紧凑卡片">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-medium text-white">
              冯
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">冯翔</span>
                <Badge variant="success" className="font-normal">在线</Badge>
              </div>
              <div className="truncate text-xs text-muted-foreground">user@example.com</div>
            </div>
            <Button size="sm" variant="outline"><Mail className="h-4 w-4" /> 发消息</Button>
          </div>
        </Block>

        <Block title="说明列表" desc="键值对描述列表，常用于详情摘要">
          <dl className="divide-y">
            {[
              ["项目", "示例跨境营销"],
              ["负责人", "demo_agent"],
              ["状态", "运行中"],
              ["最近更新", "2026-09-16"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2.5">
                <dt className="text-sm text-muted-foreground">{k}</dt>
                <dd className="text-sm font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Block>

        <Block title="筛选标签组" desc="可点击切换的筛选 Chip，常用在列表页顶部">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "全部", n: 128, on: true },
              { label: "运行中", n: 6, on: false },
              { label: "已完成", n: 118, on: false },
              { label: "失败", n: 4, on: false },
            ].map((t) => (
              <button
                key={t.label}
                className={
                  `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ` +
                  (t.on ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-accent")
                }
              >
                {t.label}
                <span className={`rounded-full px-1.5 tabular-nums ${t.on ? "bg-primary/20" : "bg-muted"}`}>{t.n}</span>
              </button>
            ))}
          </div>
        </Block>

        <Block title="设置项列表" desc="开关 + 说明的配置行，常用于设置页">
          <div className="divide-y">
            {[
              ["自动重试", "执行失败后最多重试 3 次", true],
              ["全量日志", "保留全部执行日志 30 天", false],
              ["调试模式", "输出详细调试信息（影响性能）", false],
            ].map(([title, desc, on]) => (
              <div key={title as string} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">{title as string}</div>
                  <div className="text-xs text-muted-foreground">{desc as string}</div>
                </div>
                <div
                  className={
                    `flex h-5 w-9 cursor-pointer items-center rounded-full px-0.5 transition-colors ` +
                    (on ? "justify-end bg-primary" : "justify-start bg-muted")
                  }
                >
                  <span className="h-4 w-4 rounded-full bg-background shadow" />
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="危险操作区" desc="高风险动作的强调区块，带后果说明">
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="flex-1">
                <div className="text-sm font-medium">删除项目</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  删除后该项目下的全部 Agent、配方与执行记录将不可恢复。
                </p>
              </div>
              <Button variant="destructive" size="sm">删除</Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> 已备份至 2026-09-15 快照
          </div>
        </Block>
      </div>
      </ContentFrame>
    </div>
  );
}
