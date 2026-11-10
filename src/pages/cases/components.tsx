/**
 * 页面案例：组件展厅 Components（表单/交互控件集中演示）
 * ──────────────────────────────────────────────────
 * 把 ShardKit 的交互类控件集中陈列、可实际操作：
 *   Select 下拉 · DatePicker/DateTimePicker 日期 · Calendar 日历 · Transfer 穿梭框
 *   Checkbox 复选 · RadioGroup 单选组 · Slider 滑块 · Switch 开关
 *   RichTextEditor 富文本 · MarkdownEditor Markdown
 *
 * 依赖：shadcn {select,date-picker,calendar,popover,transfer,checkbox,radio-group,
 *      slider,switch,card,button,badge,separator,input,label} + 两个编辑器
 */
import * as React from "react";
import {
  Sparkles, CalendarDays, ArrowLeftRight, FileText, Wand2, MousePointerClick, ToggleLeft,
  AppWindow, Maximize2, Minimize2, GripHorizontal, LockKeyhole,
} from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PageHeader } from "@/components/page-header";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker, DateTimePicker } from "@/components/ui/date-picker";
import { Transfer, type TransferItem } from "@/components/ui/transfer";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input as FormInput } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

const TRANSFER_DATA: TransferItem[] = [
  { key: "1", title: "数据采集 Agent", description: "多渠道抓取" },
  { key: "2", title: "内容生成 Agent", description: "文案/图文产出" },
  { key: "3", title: "翻译本地化 Agent", description: "多语种适配" },
  { key: "4", title: "渠道分发 Agent", description: "多平台投放" },
  { key: "5", title: "效果分析 Agent", description: "ROI 归因" },
  { key: "6", title: "合规审查 Agent", description: "风控审核（暂不可用）", disabled: true },
  { key: "7", title: "客服应答 Agent" },
];

const MD_SAMPLE = `# 任务配方说明：跨境选品周报

> 由「任务配方」可视化编排，一键驱动 Agent 集群执行。

## 步骤

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

function Demo({ title, desc, icon: Icon, tone, children }: {
  title: string; desc: string; icon: React.ComponentType<{ className?: string }>; tone: string; children: React.ReactNode;
}) {
  return (
    <ContentFrameSection>
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Icon className={tone} /> {title}
        </h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div>{children}</div>
    </ContentFrameSection>
  );
}

/* ────────────────────────────────────────────────────────────
 * 弹窗（Dialog）—— 对齐 vue-admin-tpl 「组件 → 弹窗」
 * 特性：可拖拽移动 · 可缩放（右下角手柄）· 可切全屏 · 内容区可滚动
 *       · 底部 footer 独立边框 · 点击遮罩不关闭
 * ──────────────────────────────────────────────────────────── */
type DialogSize = { w: number; h: number };

/** 密码输入框演示（对齐 vue-admin-tpl「组件 → 密码输入框」） */
function PasswordDemo() {
  const [pwd1, setPwd1] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [pwd3, setPwd3] = React.useState("Shard@2026");
  return (
    <Demo
      title="密码输入框（PasswordInput）"
      desc="明文/密文切换 · 强度条实时反馈 —— 对齐 vue-admin-tpl「组件 → 密码输入框」"
      icon={LockKeyhole}
      tone="text-rose-500"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>基础密码框</Label>
          <PasswordInput
            value={pwd1}
            onChange={(e) => setPwd1(e.target.value)}
            placeholder="请输入密码"
            data-testid="pwd-basic"
          />
        </div>
        <div className="space-y-1.5">
          <Label>带强度条</Label>
          <PasswordInput
            strength
            value={pwd2}
            onChange={(e) => setPwd2(e.target.value)}
            placeholder="请输入密码（试试 abc123 / Abc@12345）"
            data-testid="pwd-strength"
          />
        </div>
        <div className="space-y-1.5">
          <Label>强度条 + 禁用态</Label>
          <PasswordInput strength disabled value={pwd3} onChange={() => {}} />
        </div>
      </div>
    </Demo>
  );
}

function DraggableDialog({
  open, onOpenChange, title, description, children, footer,
  resizable = true, draggable = true, fullscreenable = true,
  defaultSize = { w: 560, h: 380 }, testid = "dialog",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  resizable?: boolean;
  draggable?: boolean;
  fullscreenable?: boolean;
  defaultSize?: DialogSize;
  testid?: string;
}) {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const [size, setSize] = React.useState<DialogSize>(defaultSize);
  const [full, setFull] = React.useState(false);
  const dragRef = React.useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = React.useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);
  const [moved, setMoved] = React.useState(false);

  // 每次打开重置位置/全屏
  React.useEffect(() => {
    if (open) {
      setPos({ x: 0, y: 0 });
      setFull(false);
      setMoved(false);
    }
  }, [open]);

  const onDragStart = (e: React.PointerEvent) => {
    if (!draggable || full) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const onDragMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const nx = d.ox + (e.clientX - d.sx);
    const ny = d.oy + (e.clientY - d.sy);
    if (!moved && Math.abs(nx - d.ox) + Math.abs(ny - d.oy) > 2) setMoved(true);
    setPos({ x: nx, y: ny });
  };
  const onDragEnd = () => { dragRef.current = null; };

  const onResizeStart = (e: React.PointerEvent) => {
    if (!resizable || full) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeRef.current = { sx: e.clientX, sy: e.clientY, ow: size.w, oh: size.h };
  };
  const onResizeMove = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r) return;
    setSize({
      w: Math.max(360, r.ow + (e.clientX - r.sx)),
      h: Math.max(220, r.oh + (e.clientY - r.sy)),
    });
  };
  const onResizeEnd = () => { resizeRef.current = null; };

  const style: React.CSSProperties = full
    ? { width: "calc(100vw - 32px)", height: "calc(100vh - 32px)", maxWidth: "none" }
    : {
        width: size.w,
        height: size.h,
        maxWidth: "none",
        transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
      };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid={testid}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        className="gap-0 overflow-hidden p-0 [&>.absolute.right-4.top-4]:hidden"
        style={style}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* 头部：标题 + 全屏/关闭 */}
        <DialogHeader
          onPointerDown={onDragStart}
          className={`flex h-12 flex-row items-center justify-between border-b px-4 py-0 pr-4 ${
            draggable && !full ? "cursor-move select-none" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {draggable && !full ? <GripHorizontal className="h-4 w-4 text-muted-foreground" /> : null}
            <DialogTitle className="text-base">{title}</DialogTitle>
          </div>
          <div className="flex items-center gap-1">
            {fullscreenable ? (
              <button
                type="button"
                aria-label={full ? "退出全屏" : "全屏"}
                data-testid={`${testid}-fullscreen`}
                onClick={() => setFull((f) => !f)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            ) : null}
            <button
              type="button"
              aria-label="关闭"
              data-testid={`${testid}-close`}
              onClick={() => onOpenChange(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </DialogHeader>

        {/* 内容区：可滚动 */}
        <DialogBody className="p-4" data-testid={`${testid}-body`}>
          {description ? (
            <DialogDescription className="mb-3">{description}</DialogDescription>
          ) : null}
          {children}
        </DialogBody>

        {/* 底部 */}
        {footer ? (
          <DialogFooter className="flex-row justify-end gap-2 space-x-0 border-t px-4 py-3">
            {footer}
          </DialogFooter>
        ) : null}

        {/* 缩放手柄 */}
        {resizable && !full ? (
          <div
            data-testid={`${testid}-resize`}
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
            style={{
              background:
                "linear-gradient(135deg, transparent 0 50%, hsl(var(--muted-foreground) / 0.4) 50% 60%, transparent 60% 70%, hsl(var(--muted-foreground) / 0.4) 70% 80%, transparent 80%)",
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default function ComponentsPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [datetime, setDatetime] = React.useState<Date | undefined>(new Date());
  const [calendar, setCalendar] = React.useState<Date | undefined>(new Date());
  const [targetKeys, setTargetKeys] = React.useState<string[]>(["2", "4"]);
  const [html, setHtml] = React.useState(
    "<h2>示例内容工作台</h2><p>用 <strong>按钮</strong> 驱动 Agent，而不是写 Prompt。</p>"
  );
  const [md, setMd] = React.useState(MD_SAMPLE);
  const [platform, setPlatform] = React.useState("tiktok");
  const [checked, setChecked] = React.useState<string[]>(["api"]);
  const [radio, setRadio] = React.useState("standard");
  const [slider, setSlider] = React.useState([60]);
  const [switches, setSwitches] = React.useState({ a: true, b: false });
  const [dlgBasic, setDlgBasic] = React.useState(false);
  const [dlgForm, setDlgForm] = React.useState(false);
  const [dlgResize, setDlgResize] = React.useState(false);
  const [dlgFormData, setDlgFormData] = React.useState({ name: "", owner: "", level: "标准" });

  const toggle = (v: string) =>
    setChecked((c) => (c.includes(v) ? c.filter((x) => x !== v) : [...c, v]));

  return (
    <div data-testid="components-page" className="flex flex-col">
      <ContentFrame>
      {/* 页头已去（导航高亮即页名）；说明降为框内首行，徽标移到最右 */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm text-muted-foreground">Win3 商业控制台 · 表单与交互控件集中演示</p>
        <Badge variant="info" className="ml-auto">
          <Sparkles className="mr-1 h-3 w-3" />科技感主题
        </Badge>
      </div>

      {/* 表单控件：Select / Date / Calendar */}
      <Demo title="表单控件" desc="下拉选择（Select）· 日期 / 日期时间（Popover + 自研 Calendar）" icon={CalendarDays} tone="text-sky-500">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>下拉选择（基础）</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tiktok">TikTok Shop</SelectItem>
                <SelectItem value="amazon">Amazon</SelectItem>
                <SelectItem value="temu">Temu</SelectItem>
                <SelectItem value="shein">SHEIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>下拉选择（分组）</Label>
            <Select defaultValue="worker">
              <SelectTrigger><SelectValue placeholder="选择 Agent 角色" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>执行类</SelectLabel>
                  <SelectItem value="worker">worker · 执行单元</SelectItem>
                  <SelectItem value="specialist">specialist · 领域专家</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>管理类</SelectLabel>
                  <SelectItem value="project_manager">project_manager</SelectItem>
                  <SelectItem value="host_manager">host_manager</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>日期选择</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>
          <div className="space-y-1.5">
            <Label>日期时间</Label>
            <DateTimePicker value={datetime} onChange={setDatetime} />
          </div>
        </div>
        <Separator className="my-4" />
        <div className="space-y-1.5">
          <Label>日历（内联 Calendar）</Label>
          <Calendar value={calendar} onChange={setCalendar} className="rounded-lg border p-3" />
        </div>
      </Demo>

      {/* 选择类控件 */}
      <Demo title="选择类控件" desc="复选框 · 单选组 · 滑块 · 开关" icon={ToggleLeft} tone="text-amber-500">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>复选框（Checkbox）</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {[
                { v: "api", l: "已接入 API" },
                { v: "hitl", l: "人工确认" },
                { v: "log", l: "全量日志" },
              ].map((it) => (
                <Label key={it.v} htmlFor={`cb-${it.v}`} className="flex cursor-pointer items-center gap-2 font-normal">
                  <Checkbox id={`cb-${it.v}`} checked={checked.includes(it.v)} onCheckedChange={() => toggle(it.v)} />
                  {it.l}
                </Label>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">已选：{checked.join("、") || "—"}</p>
          </div>
          <div className="space-y-2">
            <Label>单选组（RadioGroup）</Label>
            <RadioGroup value={radio} onValueChange={setRadio} className="grid gap-2 sm:grid-cols-3">
              {[
                { v: "light", l: "轻量" },
                { v: "standard", l: "标准" },
                { v: "heavy", l: "重度" },
              ].map((it) => (
                <Label
                  key={it.v}
                  htmlFor={`rd-${it.v}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-normal transition-colors ${
                    radio === it.v ? "border-primary bg-primary/5" : "hover:bg-accent"
                  }`}
                >
                  <RadioGroupItem id={`rd-${it.v}`} value={it.v} />
                  {it.l}
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>滑块（Slider）</Label>
            <div className="flex items-center gap-4 pt-1">
              <Slider value={slider} onValueChange={setSlider} min={0} max={100} step={5} />
              <Badge variant="secondary" className="w-12 justify-center tabular-nums">{slider[0]}</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">并发/配额等连续值输入</p>
          </div>
          <div className="space-y-2">
            <Label>开关（Switch）</Label>
            <div className="flex items-center gap-6 pt-1">
              <Label className="flex items-center gap-2 font-normal">
                <Switch checked={switches.a} onCheckedChange={(v) => setSwitches((s) => ({ ...s, a: v }))} />
                自动重试
              </Label>
              <Label className="flex items-center gap-2 font-normal">
                <Switch checked={switches.b} onCheckedChange={(v) => setSwitches((s) => ({ ...s, b: v }))} />
                调试模式
              </Label>
            </div>
          </div>
        </div>
      </Demo>

      {/* 穿梭框 */}
      <Demo title="穿梭框（Transfer）" desc="为任务配方挑选参与执行的 Agent —— 支持搜索 / 全选 / 禁用项" icon={ArrowLeftRight} tone="text-violet-500">
        <Transfer dataSource={TRANSFER_DATA} targetKeys={targetKeys} onChange={setTargetKeys} />
        <div className="mt-3 text-xs text-muted-foreground">
          已选 <span className="font-medium text-foreground">{targetKeys.length}</span> 个 Agent：
          {targetKeys.map((k) => TRANSFER_DATA.find((d) => d.key === k)?.title).filter(Boolean).join("、") || "—"}
        </div>
      </Demo>

      {/* 富文本 + Markdown */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Demo title="富文本编辑器（Tiptap）" desc="所见即所得 · 标题/加粗/列表/引用/链接/对齐/图片上传" icon={FileText} tone="text-emerald-500">
          <div className="space-y-3">
            <RichTextEditor value={html} onChange={setHtml} />
            <details className="rounded-md border bg-muted/30 p-2 text-xs">
              <summary className="cursor-pointer text-muted-foreground">查看 HTML 输出</summary>
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all">{html}</pre>
            </details>
          </div>
        </Demo>
        <Demo title="Markdown 编辑器（编辑 + 预览）" desc="@uiw/react-md-editor · 实时分栏预览 · 随主题切换" icon={Wand2} tone="text-fuchsia-500">
          <MarkdownEditor value={md} onChange={setMd} />
        </Demo>
      </div>

      {/* 基础输入 */}
      <Demo title="基础输入" desc="Input / Textarea / 禁用态 / 错误态" icon={MousePointerClick} tone="text-indigo-500">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">文本输入</Label>
            <Input id="c-name" placeholder="配方名称" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-dis">禁用态</Label>
            <Input id="c-dis" value="agentos_core" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-err">错误态</Label>
            <Input id="c-err" defaultValue="非法值" className="border-destructive focus-visible:ring-destructive" />
            <p className="text-[11px] text-destructive">该字段格式不正确</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-num">数字</Label>
            <Input id="c-num" type="number" defaultValue={20} />
          </div>
        </div>
      </Demo>

      <Separator />

      {/* 密码输入框（对齐 vue-admin-tpl「组件 → 密码输入框」） */}
      <PasswordDemo />

      <Separator />

      {/* ── 弹窗（Dialog）── */}
      <Demo
        title="弹窗（Dialog）"
        desc="可拖拽移动 · 可缩放 · 可全屏 · 内容区滚动 · footer 独立边框 —— 对齐 vue-admin-tpl「组件 → 弹窗」"
        icon={AppWindow}
        tone="text-cyan-500"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button data-testid="dlg-open-basic" onClick={() => setDlgBasic(true)}>
              基础弹窗
            </Button>
            <Button data-testid="dlg-open-form" variant="secondary" onClick={() => setDlgForm(true)}>
              与表单结合
            </Button>
            <Button data-testid="dlg-open-resize" variant="outline" onClick={() => setDlgResize(true)}>
              可拖拽缩放弹窗
            </Button>
          </div>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            <li>拖拽<b>头部</b>可移动窗口；右下角手柄可调整大小（<b>可拖拽缩放弹窗</b>）</li>
            <li>右上角 <b>⤢</b> 一键切换全屏，<b>×</b> 关闭；点击遮罩不关闭</li>
            <li>内容超出时<b>仅内容区滚动</b>，标题与底部按钮固定不动</li>
          </ul>
        </div>
      </Demo>

      {/* 基础弹窗：内容 + footer */}
      <DraggableDialog
        open={dlgBasic}
        onOpenChange={setDlgBasic}
        title="任务配方详情"
        description="跨境选品周报 · 由 Agent 集群自动编排"
        testid="dlg-basic"
        defaultSize={{ w: 560, h: 420 }}
        footer={
          <>
            <Button variant="outline" onClick={() => setDlgBasic(false)}>
              关闭
            </Button>
            <Button onClick={() => setDlgBasic(false)}>确定</Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            本配方编排了 <b className="text-foreground">4 个 Agent</b> 依次执行：采集 → 分析 → 生成 → 分发。
          </p>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">执行步骤</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>数据采集 Agent — 拉取目标类目近 7 日销量</li>
              <li>内容生成 Agent — 产出周报草稿（Markdown）</li>
              <li>渠道分发 Agent — 推送至飞书 / 邮件</li>
            </ol>
          </div>
          {/* 长内容验证「仅内容区滚动」 */}
          <p className="text-xs text-muted-foreground">
            （以下为演示滚动区域的长文本）{Array.from({ length: 12 })
              .map(() => "示例 Win3 · 把 Prompt 封装为按钮，让客户点按钮驱动 Agent 干活。")
              .join("")}
          </p>
        </div>
      </DraggableDialog>

      {/* 表单弹窗 */}
      <DraggableDialog
        open={dlgForm}
        onOpenChange={setDlgForm}
        title="新建 Agent"
        testid="dlg-form"
        defaultSize={{ w: 600, h: 340 }}
        footer={
          <>
            <Button variant="outline" onClick={() => setDlgForm(false)}>
              取消
            </Button>
            <Button data-testid="dlg-form-submit" onClick={() => setDlgForm(false)}>
              提交
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[88px_1fr] sm:items-center">
            <Label htmlFor="d-name" className="text-sm">
              Agent 名称
            </Label>
            <FormInput
              id="d-name"
              value={dlgFormData.name}
              onChange={(e) => setDlgFormData((d) => ({ ...d, name: e.target.value }))}
              placeholder="如 stock_scout"
            />
            <Label htmlFor="d-owner" className="text-sm">
              负责人
            </Label>
            <FormInput
              id="d-owner"
              value={dlgFormData.owner}
              onChange={(e) => setDlgFormData((d) => ({ ...d, owner: e.target.value }))}
              placeholder="请输入姓名"
            />
            <Label className="text-sm">优先级</Label>
            <Select
              value={dlgFormData.level}
              onValueChange={(v) => setDlgFormData((d) => ({ ...d, level: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="轻量">轻量</SelectItem>
                <SelectItem value="标准">标准</SelectItem>
                <SelectItem value="重度">重度</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground">
            表单置于弹窗内容区，标题/底部按钮固定，中间表单可滚动。
          </p>
        </div>
      </DraggableDialog>

      {/* 可拖拽缩放弹窗（演示带完整能力的变体） */}
      <DraggableDialog
        open={dlgResize}
        onOpenChange={setDlgResize}
        title="可拖拽 / 可缩放弹窗"
        description="按住头部移动，拖右下角改变大小，右上角可全屏"
        testid="dlg-resize"
        defaultSize={{ w: 520, h: 320 }}
        footer={
          <Button variant="outline" onClick={() => setDlgResize(false)}>
            关闭
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          这是一个可自由拖动位置的窗口。试试拖头部移动到别处，或拖右下角把窗口拉大。
        </p>
      </DraggableDialog>

      <Separator />

      <ContentFrameSection>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold">按钮与徽标</h2>
          <p className="text-sm text-muted-foreground">Button 变体 / Badge 语义色</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="success">success</Badge>
            <Badge variant="warning">warning</Badge>
            <Badge variant="info">info</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="destructive">destructive</Badge>
          </div>
        </div>
      </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
