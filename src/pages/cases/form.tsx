/**
 * 页面案例：表单页 Form（一整套真实业务表单）
 * ──────────────────────────────────────────
 * 这是一个「和真实应用一样完整」的配方创建表单：
 *   基本信息（文本 / 下拉 / 富文本）
 *   ├─ 配方名称 / 归属项目 / 负责人
 *   ├─ 目标平台（Select）
 *   ├─ 生效周期（DatePicker + DateTimePicker）
 *   ├─ 任务描述（富文本 Tiptap）+ 使用说明（Markdown）
 *   └─ 校验反馈（错误态 / 必填标记）
 *   执行配置
 *   ├─ 参与 Agent（Transfer 穿梭框）
 *   ├─ 触发方式（RadioGroup 单选组）
 *   ├─ 并发上限（Slider 滑块）
 *   ├─ 通知渠道（Checkbox 多选）+ 开关
 *   └─ 高级参数
 *   底部：提交 / 重置 / 存草稿
 *
 * 整页复用方式：
 *   1. 复制本文件到你的项目 src/pages/RecipeCreate.tsx
 *   2. 依赖：shadcn {input,textarea,label,select,date-picker,calendar,popover,transfer,
 *      checkbox,radio-group,slider,switch,card,button,badge,separator}
 *      + rich-text-editor + markdown-editor + page-header
 *   3. 把 handleSubmit 换成你的接口。
 */
import * as React from "react";
import {
  Save, RotateCcw, Send, Sparkles, SlidersHorizontal,
  Bell, AlertCircle,
} from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePicker, DateTimePicker } from "@/components/ui/date-picker";
import { Transfer, type TransferItem } from "@/components/ui/transfer";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

/* ── 演示数据 ─────────────────────────────────────────────── */

const AGENTS: TransferItem[] = [
  { key: "1", title: "数据采集 Agent", description: "多渠道抓取商品/评论" },
  { key: "2", title: "内容生成 Agent", description: "文案 / 图文产出" },
  { key: "3", title: "翻译本地化 Agent", description: "多语种适配" },
  { key: "4", title: "渠道分发 Agent", description: "多平台投放" },
  { key: "5", title: "效果分析 Agent", description: "ROI 归因" },
  { key: "6", title: "合规审查 Agent", description: "风控审核（暂不可用）", disabled: true },
  { key: "7", title: "客服应答 Agent", description: "买家咨询自动回复" },
];

const OWNERS = [
  { value: "demo_agent", label: "demo_agent · 跨境营销" },
  { value: "win_ui_lead", label: "win_ui_lead · 前端 UI" },
  { value: "agentos_core", label: "agentos_core · 内核" },
];

const PLATFORMS = [
  { value: "tiktok", label: "TikTok Shop" },
  { value: "amazon", label: "Amazon" },
  { value: "temu", label: "Temu" },
  { value: "shein", label: "SHEIN" },
  { value: "shopee", label: "Shopee" },
];

const CHANNELS = [
  { value: "feishu", label: "飞书" },
  { value: "email", label: "邮件" },
  { value: "webhook", label: "Webhook" },
  { value: "sms", label: "短信" },
];

const MD_TEMPLATE = `# 跨境选品周报 · 使用说明

> 该配方由「任务配方」可视化编排，一键驱动 Agent 集群执行。

## 执行步骤

1. **采集** — 拉取目标类目近 7 日销量与评论
2. **分析** — 识别潜力 SKU 与差评归因
3. **生成** — 产出周报草稿（Markdown）
4. **分发** — 推送至飞书 / 邮件

\`\`\`json
{ "resource": "recipes", "action": "run", "params": { "topN": 20 } }
\`\`\`

- [x] 已接入 AgentOS API
- [ ] 待接入 HITL 人工确认
`;

const RICH_HTML = `<h2>每日跨境选品周报</h2><p>面向 <strong>东南亚市场</strong>，输出潜力 SKU 与投放建议。</p>`;

/* ── 小组件 ───────────────────────────────────────────────── */

function FormRow({
  label, htmlFor, required, hint, error, children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-start">
      <div className="space-y-0.5 pt-1.5 sm:text-right">
        <Label htmlFor={htmlFor} className={cn("flex items-center justify-end gap-0.5", required && "before:text-destructive before:content-['*']")}>
          {label}
        </Label>
        {hint ? <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="space-y-1.5">
        {children}
        {error ? (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function FormPage() {
  // 基本信息
  const [name, setName] = React.useState("");
  const [owner, setOwner] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [startDate, setStartDate] = React.useState<Date | undefined>(new Date());
  const [deadline, setDeadline] = React.useState<Date | undefined>();
  const [html, setHtml] = React.useState(RICH_HTML);
  const [md, setMd] = React.useState(MD_TEMPLATE);

  // 执行配置
  const [targetKeys, setTargetKeys] = React.useState<string[]>(["2", "4"]);
  const [trigger, setTrigger] = React.useState("schedule");
  const [concurrency, setConcurrency] = React.useState([3]);
  const [channels, setChannels] = React.useState<string[]>(["feishu"]);
  const [notifyOnFail, setNotifyOnFail] = React.useState(true);
  const [autoRetry, setAutoRetry] = React.useState(false);
  const [note, setNote] = React.useState("");

  // 校验
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const toggleChannel = (v: string) =>
    setChannels((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "请填写配方名称";
    else if (name.trim().length < 2) e.name = "名称至少 2 个字符";
    if (!owner) e.owner = "请选择负责人";
    if (!platform) e.platform = "请选择目标平台";
    if (!targetKeys.length) e.target = "请至少选择 1 个参与 Agent";
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setSubmitted(true);
      // TODO: 换成你的 API，例如 await api.recipes.create({...})
    }
  };

  const handleReset = () => {
    setName("");
    setOwner("");
    setPlatform("");
    setStartDate(new Date());
    setDeadline(undefined);
    setHtml(RICH_HTML);
    setMd(MD_TEMPLATE);
    setTargetKeys(["2", "4"]);
    setTrigger("schedule");
    setConcurrency([3]);
    setChannels(["feishu"]);
    setNotifyOnFail(true);
    setAutoRetry(false);
    setNote("");
    setErrors({});
    setSubmitted(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <ContentFrame padding={5}>
        {/* 身份条：原页头降为框内首行（导航已高亮「表单页」），动作搬到最右 */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl font-semibold tracking-tight">新建任务配方</h1>
            <p className="text-sm text-muted-foreground">
              用按钮组合任务流，一键驱动 Agent 集群 —— 无需手写 Prompt
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" /> 重置
            </Button>
            <Button type="button" variant="secondary" size="sm">
              <Save className="h-4 w-4" /> 存草稿
            </Button>
            <Button type="submit" size="sm">
              <Send className="h-4 w-4" /> 提交创建
            </Button>
          </div>
        </div>

        <ContentFrameSection>
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-4 w-4 text-primary" /> 基本信息
            </h2>
            <p className="text-sm text-muted-foreground">配方的名称、归属与目标平台</p>
          </div>
          <div className="flex flex-col gap-5">
            <FormRow label="配方名称" htmlFor="name" required error={errors.name} hint="展示在配方列表与执行记录中">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：跨境选品周报" />
            </FormRow>

            <FormRow label="负责人" required error={errors.owner} hint="配方的默认调度 Agent">
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="选择负责人" />
                </SelectTrigger>
                <SelectContent>
                  {OWNERS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            <FormRow label="目标平台" required error={errors.platform} hint="支持多选后续可在配方内扩展">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="sm:max-w-xs">
                  <SelectValue placeholder="选择平台" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormRow>

            <FormRow label="生效周期" hint="开始日期与截止时间">
              <div className="flex flex-wrap items-center gap-3">
                <DatePicker value={startDate} onChange={setStartDate} />
                <span className="text-muted-foreground">→</span>
                <DateTimePicker value={deadline} onChange={setDeadline} />
              </div>
            </FormRow>

            <Separator />

            <FormRow label="任务描述" hint="富文本（Tiptap）· 所见即所得">
              <RichTextEditor value={html} onChange={setHtml} />
            </FormRow>

            <FormRow label="使用说明" hint="Markdown（编辑 + 实时预览）">
              <MarkdownEditor value={md} onChange={setMd} height={280} />
            </FormRow>
          </div>
        </ContentFrameSection>

        {/* 执行配置 */}
        <ContentFrameSection>
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-warning" /> 执行配置
            </h2>
            <p className="text-sm text-muted-foreground">参与 Agent、触发方式、并发与通知</p>
          </div>
          <div className="flex flex-col gap-5">
            <FormRow label="参与 Agent" required error={errors.target} hint="穿梭框选择执行集群成员">
              <Transfer dataSource={AGENTS} targetKeys={targetKeys} onChange={setTargetKeys} />
              <p className="text-[11px] text-muted-foreground">
                已选 <span className="font-medium text-foreground">{targetKeys.length}</span> 个：
                {targetKeys.map((k) => AGENTS.find((a) => a.key === k)?.title).filter(Boolean).join("、") || "—"}
              </p>
            </FormRow>

            <FormRow label="触发方式" hint="单选组（RadioGroup）">
              <RadioGroup value={trigger} onValueChange={setTrigger} className="grid gap-2 sm:grid-cols-3">
                {[
                  { value: "manual", label: "手动触发" },
                  { value: "schedule", label: "定时调度" },
                  { value: "event", label: "事件驱动" },
                ].map((t) => (
                  <Label
                    key={t.value}
                    htmlFor={`trigger-${t.value}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-normal transition-colors",
                      trigger === t.value ? "border-primary bg-primary/5" : "hover:bg-accent"
                    )}
                  >
                    <RadioGroupItem id={`trigger-${t.value}`} value={t.value} />
                    {t.label}
                  </Label>
                ))}
              </RadioGroup>
            </FormRow>

            <FormRow label="并发上限" hint={`当前：${concurrency[0]} 个 Agent 并行`}>
              <div className="flex items-center gap-4 sm:max-w-md">
                <Slider value={concurrency} onValueChange={setConcurrency} min={1} max={10} step={1} />
                <Badge variant="secondary" className="w-12 justify-center tabular-nums">{concurrency[0]}</Badge>
              </div>
            </FormRow>

            <FormRow label="通知渠道" hint="多选（Checkbox）">
              <div className="flex flex-wrap gap-4">
                {CHANNELS.map((c) => (
                  <Label key={c.value} htmlFor={`ch-${c.value}`} className="flex cursor-pointer items-center gap-2 font-normal">
                    <Checkbox
                      id={`ch-${c.value}`}
                      checked={channels.includes(c.value)}
                      onCheckedChange={() => toggleChannel(c.value)}
                    />
                    {c.label}
                  </Label>
                ))}
              </div>
            </FormRow>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">失败时通知</div>
                    <div className="text-[11px] text-muted-foreground">执行失败立即推送告警</div>
                  </div>
                </div>
                <Switch checked={notifyOnFail} onCheckedChange={setNotifyOnFail} />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">自动重试</div>
                    <div className="text-[11px] text-muted-foreground">失败后最多重试 3 次</div>
                  </div>
                </div>
                <Switch checked={autoRetry} onCheckedChange={setAutoRetry} />
              </div>
            </div>

            <FormRow label="备注" hint="可选">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="补充说明、变更记录…" />
            </FormRow>
          </div>
        </ContentFrameSection>

        {/* 底部操作条（框内页脚，横线以上） */}
        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        {submitted ? <Badge variant="success" className="mr-auto font-normal">校验通过 · 已提交（示例）</Badge> : null}
        <Button type="button" variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4" /> 重置
        </Button>
        <Button type="submit">
          <Send className="h-4 w-4" /> 提交创建
        </Button>
        </div>
      </ContentFrame>
    </form>
  );
}
