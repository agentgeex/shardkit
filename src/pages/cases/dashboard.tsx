/**
 * 页面案例：仪表盘 Dashboard
 * ────────────────────────────
 * 依赖：recharts lucide-react + shadcn card/badge/table/separator
 */
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Bot, Workflow, PlayCircle, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentFrame } from "@/components/ui/content-frame";
import { StatusBadge } from "@/components/status-badge";
import { trendData, roleDistribution, agents, runs } from "@/mock/data";

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];

function StatCard({ title, value, sub, icon, tone }: {
  title: string; value: string; sub: string; icon: React.ReactNode; tone: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const online = agents.filter((a) => a.status === "online").length;
  const successRate = Math.round((runs.filter((r) => r.status === "succeeded").length / runs.length) * 100);

  return (
    <div data-testid="dashboard-page" className="flex flex-col">
      <ContentFrame>
      {/* 页头已去（导航高亮即页名）；说明降为框内首行，"实时数据"移到最右 */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm text-muted-foreground">关键指标总览：Agent 运行 / 任务执行 / 资源消耗</p>
        <Badge variant="info" className="ml-auto">实时数据</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="在线 Agent" value={`${online}/${agents.length}`} sub="较昨日 +1" icon={<Bot className="h-4 w-4 text-sky-400" />} tone="bg-sky-500/15 ring-1 ring-sky-500/30" />
        <StatCard title="任务配方" value="5" sub="已发布 4 / 草稿 1" icon={<Workflow className="h-4 w-4 text-violet-400" />} tone="bg-violet-500/15 ring-1 ring-violet-500/30" />
        <StatCard title="执行次数（今日）" value="26" sub={`成功率 ${successRate}%`} icon={<PlayCircle className="h-4 w-4 text-emerald-400" />} tone="bg-emerald-500/15 ring-1 ring-emerald-500/30" />
        <StatCard title="Token 消耗（今日）" value="17.4K" sub="较昨日 -11%" icon={<Zap className="h-4 w-4 text-amber-400" />} tone="bg-amber-500/15 ring-1 ring-amber-500/30" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" /> 近 7 日执行与 Token 趋势</CardTitle>
            <CardDescription>执行次数（左轴）与 Token 消耗（右轴）</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                {/* 计数轴不给小数刻度：执行次数与 Token 都是整数，recharts 默认会算出 2.25 这类刻度 */}
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line yAxisId="left" type="monotone" dataKey="runs" name="执行次数" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="tokens" name="Token" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent 角色分布</CardTitle>
            <CardDescription>按角色统计在线 Agent 数量</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {roleDistribution.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">执行状态分布</CardTitle>
            <CardDescription>今日执行结果构成</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "成功", value: runs.filter((r) => r.status === "succeeded").length },
                  { name: "失败", value: runs.filter((r) => r.status === "failed").length },
                  { name: "运行中", value: runs.filter((r) => r.status === "running").length },
                ]}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                {/* 同上：执行条数是计数，轴刻度必须为整数（否则出现 1.5 / 2.25 这类无意义刻度） */}
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Bar dataKey="value" name="数量" radius={[6, 6, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">最近执行</CardTitle>
            <CardDescription>最新的任务运行记录</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>执行 ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>配方</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">耗时</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell>{r.agent}</TableCell>
                    <TableCell className="text-muted-foreground">{r.recipe}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right tabular-nums">{r.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      </ContentFrame>
    </div>
  );
}
