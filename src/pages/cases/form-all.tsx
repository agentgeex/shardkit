/**
 * 页面案例：表单页 Form —「全部示例」（对齐 vue-admin-tpl 表单 → 全部示例）
 * ────────────────────────────────────────────────────────────────────────────
 * 参考项目：vue-element-plus-admin（vue-admin-tpl）
 *   src/views/Components/Form/DefaultForm.vue（i18n: defaultForm = 全部示例）
 * 该页把所有常见表单控件集中在一页展示，作为 ShardKit「表单页」的参考对象，
 * 便于客户/开发直接取用现成控件组合，少走弯路。
 *
 * 覆盖控件（对齐 Element Plus 全部示例）：
 *   输入类：Input（基础/密码/清除/尺寸）、Textarea、InputNumber、Autocomplete(Combobox)、InputTag
 *   选择类：Select（基础/分组/多选/可搜索）、SelectV2、Cascader、TreeSelect、RadioGroup、RadioButton、
 *          CheckboxGroup、CheckboxButton、Switch、Slider、Rate、ColorPicker、Transfer
 *   日期时间：DatePicker、DateTimePicker、TimePicker、TimeSelect
 *   上传/编辑：Upload、RichTextEditor、MarkdownEditor
 *   展示反馈：Badge、Tag、Alert、Progress、Tooltip、Popover、Pagination
 *
 * 路由：/form
 */
import * as React from "react";
import {
  Sparkles, SlidersHorizontal, CalendarClock, Upload as UploadIcon, Palette,
  MessageSquare, HelpCircle, Hash, ListChecks, LayoutGrid, type LucideIcon,
} from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormRow, FormGrid, FormField } from "@/components/ui/form-field";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DatePicker, DateTimePicker, DateRangePicker, MonthPicker, MonthRangePicker, YearPicker, YearRangePicker, DateTimeRangePicker, type Shortcut, type DateRange } from "@/components/ui/date-picker";
import { TimePicker, TimeSelect } from "@/components/ui/time-picker";
import { Transfer, type TransferItem } from "@/components/ui/transfer";
import { InputNumber } from "@/components/ui/input-number";
import { InputTag } from "@/components/ui/input-tag";
import { Rate } from "@/components/ui/rate";
import { ColorPicker } from "@/components/ui/color-picker";
import { Cascader, type CascaderOption } from "@/components/ui/cascader";
import { Combobox } from "@/components/ui/combobox";
import { TreeSelect, type TreeNode } from "@/components/ui/tree-select";
import { Upload, type UploadItem } from "@/components/ui/upload";
import { Pagination } from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

/* ── 演示数据 ─────────────────────────────────────────────── */

const FRAMEWORKS = [
  { value: "vue", label: "Vue" },
  { value: "react", label: "React" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "solid", label: "Solid" },
];

const CITY_GROUPS = [
  { label: "华东", options: [{ value: "sh", label: "上海" }, { value: "hz", label: "杭州" }, { value: "nj", label: "南京" }] },
  { label: "华南", options: [{ value: "gz", label: "广州" }, { value: "sz", label: "深圳" }, { value: "xm", label: "厦门" }] },
  { label: "华北", options: [{ value: "bj", label: "北京" }, { value: "tj", label: "天津" }, { value: "jn", label: "济南" }] },
];

const CASCADER_OPTIONS: CascaderOption[] = [
  {
    value: "guide", label: "指南",
    children: [
      {
        value: "disciplines", label: "规范",
        children: [
          { value: "consistency", label: "一致性" },
          { value: "feedback", label: "反馈" },
          { value: "efficiency", label: "效率" },
          { value: "controllability", label: "可控性" },
        ],
      },
      { value: "navigation", label: "导航", children: [{ value: "side", label: "侧边导航" }, { value: "top", label: "顶部导航" }] },
    ],
  },
  {
    value: "components", label: "组件",
    children: [
      { value: "basic", label: "基础", children: [{ value: "button", label: "按钮" }, { value: "icon", label: "图标" }] },
      { value: "form", label: "表单", children: [{ value: "input", label: "输入框" }, { value: "select", label: "选择器" }] },
    ],
  },
];

// 日期快捷选项（对齐 vue-admin-tpl formDemo.shortcuts：今天/昨天/一周前）
const DATE_SHORTCUTS: Shortcut[] = [
  { text: "今天", value: () => new Date() },
  { text: "昨天", value: () => new Date(Date.now() - 86400000) },
  { text: "一周前", value: () => new Date(Date.now() - 7 * 86400000) },
];

const TREE: TreeNode[] = [
  {
    value: "1", label: "一级 1",
    children: [
      { value: "1-1", label: "二级 1-1", children: [{ value: "1-1-1", label: "三级 1-1-1" }] },
      { value: "1-2", label: "二级 1-2" },
    ],
  },
  {
    value: "2", label: "一级 2",
    children: [
      { value: "2-1", label: "二级 2-1" },
      { value: "2-2", label: "二级 2-2", children: [{ value: "2-2-1", label: "三级 2-2-1" }] },
    ],
  },
  {
    value: "3", label: "一级 3",
    children: [{ value: "3-1", label: "二级 3-1" }, { value: "3-2", label: "二级 3-2" }],
  },
];

const AGENTS: TransferItem[] = [
  { key: "1", title: "数据采集 Agent", description: "多渠道抓取商品/评论" },
  { key: "2", title: "内容生成 Agent", description: "文案 / 图文产出" },
  { key: "3", title: "翻译本地化 Agent", description: "多语种适配" },
  { key: "4", title: "渠道分发 Agent", description: "多平台投放" },
  { key: "5", title: "效果分析 Agent", description: "ROI 归因" },
  { key: "6", title: "合规审查 Agent", description: "风控审核（暂不可用）", disabled: true },
];

const MD_TEMPLATE = `# 使用说明示例

> 支持 **Markdown** 实时预览。

- [x] 已支持任务清单
- [ ] 待办项

\`\`\`json
{ "resource": "recipes", "action": "run" }
\`\`\`
`;

function Section({ icon: Icon, title, desc, hint, children, tone }: {
  icon: LucideIcon; title: string; desc: string; hint?: string; children: React.ReactNode; tone: string;
}) {
  return (
    <ContentFrameSection>
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Icon className={cn("h-4 w-4", tone)} /> {title}
          {hint && <Badge variant="secondary" className="ml-1 text-[10px] font-normal">{hint}</Badge>}
        </h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </ContentFrameSection>
  );
}

export default function FormAllPage() {
  // 输入类
  const [text, setText] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [textarea, setTextarea] = React.useState("");
  const [num, setNum] = React.useState<number | null>(3);
  const [numRange, setNumRange] = React.useState<number | null>(5);
  const [combo, setCombo] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(["跨境", "选品"]);

  // 选择类
  const [select, setSelect] = React.useState("");
  const [selectGroup, setSelectGroup] = React.useState("");
  const [multiSelect, setMultiSelect] = React.useState<string[]>([]);
  const [cascader, setCascader] = React.useState<string[]>([]);
  const [cascaderLabels, setCascaderLabels] = React.useState<string[]>([]);
  const [treeSingle, setTreeSingle] = React.useState<string[]>([]);
  const [treeMulti, setTreeMulti] = React.useState<string[]>(["1-1"]);
  const [radio, setRadio] = React.useState("a");
  const [radioBtn, setRadioBtn] = React.useState("day");
  const [checks, setChecks] = React.useState<string[]>(["c1"]);
  const [checkBtn, setCheckBtn] = React.useState<string[]>(["b1"]);
  const [sw, setSw] = React.useState(true);
  const [sw2, setSw2] = React.useState(false);
  const [slider, setSlider] = React.useState([30]);
  const [rate, setRate] = React.useState(4);
  const [rateHalf, setRateHalf] = React.useState(3.5);
  const [color, setColor] = React.useState("#6366f1");
  const [transfer, setTransfer] = React.useState<string[]>(["2", "4"]);

  // 日期时间（按 vue-admin-tpl「表单→全部示例」分类：a 日期选择器 / b 日期时间选择器 / c 日期时间范围 / d 时间选择器 / e 时间选择）
  // a) 日期选择器
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [dateShortcut, setDateShortcut] = React.useState<Date | undefined>();
  const [week, setWeek] = React.useState<Date | undefined>();
  const [yearVal, setYearVal] = React.useState<Date | undefined>();
  const [monthVal, setMonthVal] = React.useState<Date | undefined>();
  const [dateRange, setDateRange] = React.useState<DateRange>([undefined, undefined]);
  const [monthRange, setMonthRange] = React.useState<DateRange>([undefined, undefined]);
  const [yearRange, setYearRange] = React.useState<DateRange>([undefined, undefined]);
  // b) 日期时间选择器
  const [dateTime, setDateTime] = React.useState<Date | undefined>();
  const [dateTimeShortcut, setDateTimeShortcut] = React.useState<Date | undefined>();
  // c) 日期时间范围
  const [dateTimeRange, setDateTimeRange] = React.useState<DateRange>([undefined, undefined]);
  // d) 时间选择器
  const [time, setTime] = React.useState("09:30");
  const [timeSec, setTimeSec] = React.useState("09:30:15");
  // e) 时间选择
  const [timeSelect, setTimeSelect] = React.useState("");

  // 上传/编辑
  const [files, setFiles] = React.useState<UploadItem[]>([]);
  const [html, setHtml] = React.useState("<h2>富文本示例</h2><p>所见即所得编辑。</p>");
  const [md, setMd] = React.useState(MD_TEMPLATE);

  // 展示反馈
  const [page, setPage] = React.useState(3);
  const [pageSize, setPageSize] = React.useState(10);

  // 栅格排版示例（一行 1 / 2 / 3 列）
  const [grid, setGrid] = React.useState({
    name: "示例科技",
    code: "WIN3",
    owner: "维护者",
    phone: "13800000000",
    email: "demo@example.com",
    city: "上海",
    district: "浦东新区",
    street: "世纪大道 100 号",
    zip: "200120",
  });
  const setG = (k: keyof typeof grid) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setGrid((s) => ({ ...s, [k]: e.target.value }));

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <TooltipProvider delayDuration={150}>
      <div data-testid="form-all-page" className="flex flex-col">
        <ContentFrame padding={5}>
        {/* 身份条：原页头降为框内首行（导航已高亮「表单页」），动作搬到最右 */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border pb-5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl font-semibold tracking-tight">表单页 · 全部示例</h1>
            <p className="text-sm text-muted-foreground">
              对齐 vue-admin-tpl「表单 → 全部示例」，集中演示全部常用表单控件
            </p>
          </div>
          <Button asChild variant="view" size="sm">
            <Link to="/form/recipe" data-testid="to-recipe-form">
              <SlidersHorizontal className="h-4 w-4" /> 业务配方表单
            </Link>
          </Button>
        </div>
        <div className="flex flex-col gap-5">
          {/* ── 输入类 ── */}
          {/* ★ 栅格排版范式：供后续 Agent 照抄「一行 1 / 2 / 3 个控件」的排法 */}
          <Section icon={LayoutGrid} tone="text-indigo-500" title="栅格排版（多列排布）" desc="同一行放 1 / 2 / 3 个控件 —— 标签在左，控件在右；响应式自动降级">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">① 一行一个（cols=1）· 适合长文本 / 地址 / 备注</p>
              <FormGrid cols={1} data-testid="grid-1">
                <FormField label="公司全称" htmlFor="g-name" hint="完整法定名称">
                  <Input id="g-name" value={grid.name} onChange={setG("name")} placeholder="请输入公司全称" />
                </FormField>
              </FormGrid>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">② 一行两个（cols=2）· 适合成对字段（姓/名、起止日期、手机/邮箱）</p>
              <FormGrid cols={2} data-testid="grid-2">
                <FormField label="企业简称" htmlFor="g-code" required>
                  <Input id="g-code" value={grid.code} onChange={setG("code")} placeholder="如 WIN3" />
                </FormField>
                <FormField label="负责人" htmlFor="g-owner" required>
                  <Input id="g-owner" value={grid.owner} onChange={setG("owner")} placeholder="请输入姓名" />
                </FormField>
                <FormField label="手机号" htmlFor="g-phone">
                  <Input id="g-phone" value={grid.phone} onChange={setG("phone")} placeholder="11 位手机号" />
                </FormField>
                <FormField label="邮箱" htmlFor="g-email">
                  <Input id="g-email" type="email" value={grid.email} onChange={setG("email")} placeholder="name@example.com" />
                </FormField>
              </FormGrid>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">③ 一行三个（cols=3）· 适合短字段（省/市/区、年月日、三围规格）</p>
              <FormGrid cols={3} data-testid="grid-3">
                <FormField label="省份" htmlFor="g-city">
                  <Input id="g-city" value={grid.city} onChange={setG("city")} placeholder="省 / 直辖市" />
                </FormField>
                <FormField label="城市" htmlFor="g-district">
                  <Input id="g-district" value={grid.district} onChange={setG("district")} placeholder="城市" />
                </FormField>
                <FormField label="区县" htmlFor="g-street">
                  <Input id="g-street" value={grid.street} onChange={setG("street")} placeholder="区 / 县" />
                </FormField>
              </FormGrid>
            </div>

            <p className="rounded-md border border-dashed border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              用法：外层用 <code className="rounded bg-muted px-1">&lt;FormGrid cols={2|3}&gt;</code> 包住，每个字段用 <code className="rounded bg-muted px-1">&lt;FormField label=…&gt;</code>；窄屏自动降为单列。
            </p>
          </Section>

          <Section icon={Hash} tone="text-sky-500" title="输入类" desc="Input / 密码 / Textarea / InputNumber / 自动完成 / 标签输入">
            <FormRow label="文本输入" htmlFor="f-text" hint="基础文本；带清除按钮">
              <Input id="f-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="请输入内容" data-testid="f-text" />
            </FormRow>

            <FormRow label="密码输入" htmlFor="f-pwd">
              <Input id="f-pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="请输入密码" autoComplete="new-password" />
            </FormRow>

            <FormRow label="多行文本" htmlFor="f-textarea">
              <Textarea id="f-textarea" value={textarea} onChange={(e) => setTextarea(e.target.value)} placeholder="多行文本域…" />
            </FormRow>

            <FormRow label="数字输入" hint="步进按钮 · 范围 0–99" data-testid="f-number-row">
              <div className="sm:max-w-[180px]" data-testid="f-number">
                <InputNumber value={num} onChange={setNum} min={0} max={99} step={1} />
              </div>
            </FormRow>

            <FormRow label="数字（限制范围）" hint="当前 5，范围 5–20">
              <div className="sm:max-w-[180px]">
                <InputNumber value={numRange} onChange={setNumRange} min={5} max={20} step={1} />
              </div>
            </FormRow>

            <FormRow label="自动完成" hint="输入过滤建议项（Autocomplete）">
              <div className="sm:max-w-xs">
                <Combobox options={FRAMEWORKS} value={combo} onChange={setCombo} placeholder="选择或输入框架" data-testid="f-combobox" />
              </div>
            </FormRow>

            <FormRow label="标签输入" hint="输入后回车创建标签">
              <div className="sm:max-w-md">
                <InputTag value={tags} onChange={setTags} max={6} />
              </div>
            </FormRow>
          </Section>

          {/* ── 选择类 ── */}
          <Section icon={ListChecks} tone="text-violet-500" title="选择类" desc="Select / 分组 / 多选 / Cascader / TreeSelect / Radio / Checkbox / Switch / Slider / Rate / Color / Transfer">
            <FormRow label="下拉选择" hint="基础单选（Select）">
              <div className="sm:max-w-xs">
                <Select value={select} onValueChange={setSelect}>
                  <SelectTrigger data-testid="f-select">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRAMEWORKS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormRow>

            <FormRow label="分组下拉" hint="OptionGroup 分组">
              <div className="sm:max-w-xs">
                <Select value={selectGroup} onValueChange={setSelectGroup}>
                  <SelectTrigger data-testid="f-select-group">
                    <SelectValue placeholder="选择城市" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITY_GROUPS.map((g) => (
                      <SelectGroup key={g.label}>
                        <SelectLabel>{g.label}</SelectLabel>
                        {g.options.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FormRow>

            <FormRow label="级联选择" hint="逐层展开（Cascader）">
              <div className="sm:max-w-xs">
                <Cascader
                  options={CASCADER_OPTIONS}
                  value={cascader}
                  onChange={(p, labels) => { setCascader(p); setCascaderLabels(labels); }}
                  placeholder="选择层级"
                  data-testid="f-cascader"
                />
              </div>
            </FormRow>

            <FormRow label="树选择（单选）" hint="下拉内置树（TreeSelect）">
              <div className="sm:max-w-xs">
                <TreeSelect tree={TREE} value={treeSingle} onChange={setTreeSingle} placeholder="选择节点" data-testid="f-tree-single" />
              </div>
            </FormRow>

            <FormRow label="树选择（多选）" hint="父子联动勾选">
              <div className="sm:max-w-xs">
                <TreeSelect tree={TREE} value={treeMulti} onChange={setTreeMulti} multiple placeholder="可多选" data-testid="f-tree-multi" />
              </div>
            </FormRow>

            <Separator />

            <FormRow label="单选组" hint="RadioGroup">
              <RadioGroup value={radio} onValueChange={setRadio} className="flex flex-wrap gap-4">
                {[{ value: "a", label: "选项 A" }, { value: "b", label: "选项 B" }, { value: "c", label: "选项 C" }].map((o) => (
                  <Label key={o.value} htmlFor={`r-${o.value}`} className="flex cursor-pointer items-center gap-2 font-normal">
                    <RadioGroupItem id={`r-${o.value}`} value={o.value} /> {o.label}
                  </Label>
                ))}
              </RadioGroup>
            </FormRow>

            <FormRow label="单选按钮组" hint="RadioButton 形态" data-testid="f-radio-button">
              <div className="inline-flex rounded-md border border-input p-0.5">
                {[{ value: "day", label: "按天" }, { value: "week", label: "按周" }, { value: "month", label: "按月" }].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setRadioBtn(o.value)}
                    className={cn(
                      "rounded px-3 py-1 text-sm transition-colors",
                      radioBtn === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </FormRow>

            <FormRow label="多选组" hint="CheckboxGroup">
              <div className="flex flex-wrap gap-4">
                {[{ value: "c1", label: "选项一" }, { value: "c2", label: "选项二" }, { value: "c3", label: "选项三" }].map((o) => (
                  <Label key={o.value} htmlFor={`cb-${o.value}`} className="flex cursor-pointer items-center gap-2 font-normal">
                    <Checkbox id={`cb-${o.value}`} checked={checks.includes(o.value)} onCheckedChange={() => toggle(checks, o.value, setChecks)} />
                    {o.label}
                  </Label>
                ))}
              </div>
            </FormRow>

            <FormRow label="多选按钮组" hint="CheckboxButton 形态" data-testid="f-check-button">
              <div className="flex flex-wrap gap-2">
                {[{ value: "b1", label: "标签一" }, { value: "b2", label: "标签二" }, { value: "b3", label: "标签三" }].map((o) => {
                  const on = checkBtn.includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(checkBtn, o.value, setCheckBtn)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm transition-colors",
                        on ? "border-primary bg-primary/10 text-foreground" : "border-input text-muted-foreground hover:bg-accent"
                      )}
                    >
                      {on && <span className="text-primary">✓</span>}
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </FormRow>

            <FormRow label="开关" hint="Switch">
              <div className="flex flex-wrap items-center gap-6">
                <Label className="flex cursor-pointer items-center gap-2 font-normal">
                  <Switch checked={sw} onCheckedChange={setSw} /> 已启用
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 font-normal">
                  <Switch checked={sw2} onCheckedChange={setSw2} /> 未启用
                </Label>
                <Label className="flex cursor-pointer items-center gap-2 font-normal opacity-60">
                  <Switch checked={false} disabled /> 禁用
                </Label>
              </div>
            </FormRow>

            <FormRow label="滑块" hint={`当前：${slider[0]}`}>
              <div className="flex items-center gap-4 sm:max-w-md">
                <Slider value={slider} onValueChange={setSlider} min={0} max={100} step={1} />
                <Badge variant="secondary" className="w-12 justify-center tabular-nums">{slider[0]}</Badge>
              </div>
            </FormRow>

            <FormRow label="评分" hint="Rate（含半星）" data-testid="f-rate">
              <div className="flex flex-wrap items-center gap-6">
                <Rate value={rate} onChange={setRate} />
                <Rate value={rateHalf} onChange={setRateHalf} allowHalf />
              </div>
            </FormRow>

            <FormRow label="颜色选择" hint="ColorPicker">
              <ColorPicker value={color} onChange={setColor} data-testid="f-color" />
            </FormRow>

            <FormRow label="穿梭框" hint="Transfer">
              <Transfer dataSource={AGENTS} targetKeys={transfer} onChange={setTransfer} />
            </FormRow>
          </Section>

          {/* ── 日期时间（分类对齐 vue-admin-tpl「表单→全部示例」）── */}
          <Section icon={CalendarClock} tone="text-amber-500" title="日期选择器" hint="a) 日期选择器" desc="DatePicker：默认 / 快捷选项 / 禁用未来 / 周 / 年 / 月 / 日期范围 / 月份范围 / 年份范围">
            <FormRow label="默认" hint="DatePicker">
              <DatePicker value={date} onChange={setDate} data-testid="f-date" />
            </FormRow>

            <FormRow label="快捷选项" hint="今天 / 昨天 / 一周前；禁用未来日期">
              <DatePicker
                value={dateShortcut}
                onChange={setDateShortcut}
                disabledDate={(d) => d.getTime() > Date.now()}
                data-testid="f-date-shortcuts"
                shortcuts={DATE_SHORTCUTS}
              />
            </FormRow>

            <FormRow label="周" hint="DatePicker type=week（周序号）">
              <DatePicker value={week} onChange={setWeek} placeholder="选择周" data-testid="f-week" className="w-[200px]" />
            </FormRow>

            <FormRow label="年" hint="YearPicker">
              <YearPicker value={yearVal} onChange={setYearVal} data-testid="f-year" className="w-[200px]" />
            </FormRow>

            <FormRow label="月" hint="MonthPicker">
              <MonthPicker value={monthVal} onChange={setMonthVal} data-testid="f-month" className="w-[200px]" />
            </FormRow>

            <FormRow label="日期范围" hint="DateRangePicker">
              <DateRangePicker value={dateRange} onChange={setDateRange} data-testid="f-daterange" />
            </FormRow>

            <FormRow label="月份范围" hint="MonthRangePicker">
              <MonthRangePicker value={monthRange} onChange={setMonthRange} data-testid="f-monthrange" />
            </FormRow>

            <FormRow label="年份范围" hint="YearRangePicker">
              <YearRangePicker value={yearRange} onChange={setYearRange} data-testid="f-yearrange" />
            </FormRow>
          </Section>

          <Section icon={CalendarClock} tone="text-amber-500" title="日期时间选择器" hint="b) 日期时间选择器" desc="DateTimePicker：默认 / 快捷选项">
            <FormRow label="默认" hint="DateTimePicker（日期 + 时:分）">
              <DateTimePicker value={dateTime} onChange={setDateTime} data-testid="f-datetime" />
            </FormRow>

            <FormRow label="快捷选项" hint="今天 / 昨天 / 一周前">
              <DateTimePicker value={dateTimeShortcut} onChange={setDateTimeShortcut} shortcuts={DATE_SHORTCUTS} data-testid="f-datetime-shortcuts" />
            </FormRow>
          </Section>

          <Section icon={CalendarClock} tone="text-amber-500" title="日期时间范围" hint="c) 日期时间范围" desc="DateTimeRangePicker：日期区间 + 起止时间">
            <FormRow label="默认" hint="DateTimeRangePicker">
              <DateTimeRangePicker value={dateTimeRange} onChange={setDateTimeRange} data-testid="f-datetimerange" />
            </FormRow>
          </Section>

          <Section icon={CalendarClock} tone="text-amber-500" title="时间选择器" hint="d) 时间选择器" desc="TimePicker：时:分 / 时:分:秒">
            <FormRow label="默认" hint="TimePicker（时:分）">
              <div className="sm:max-w-[180px]" data-testid="f-time">
                <TimePicker value={time} onChange={setTime} />
              </div>
            </FormRow>

            <FormRow label="含秒" hint="TimePicker withSeconds">
              <div className="sm:max-w-[200px]" data-testid="f-time-sec">
                <TimePicker value={timeSec} onChange={setTimeSec} withSeconds />
              </div>
            </FormRow>
          </Section>

          <Section icon={CalendarClock} tone="text-amber-500" title="时间选择" hint="e) 时间选择" desc="TimeSelect：固定时间点下拉（08:30–18:00 / 30min）">
            <FormRow label="默认" hint="TimeSelect">
              <div className="sm:max-w-[200px]" data-testid="f-time-select">
                <TimeSelect value={timeSelect} onChange={setTimeSelect} start="08:30" end="18:00" stepMinutes={30} />
              </div>
            </FormRow>
          </Section>

          {/* ── 上传与富文本 ── */}
          <Section icon={UploadIcon} tone="text-emerald-500" title="上传与编辑器" desc="Upload / 富文本 / Markdown">
            <FormRow label="文件上传" hint="拖拽或点选；图片可预览">
              <Upload value={files} onChange={setFiles} maxCount={5} maxSizeMB={5} tip="支持 jpg/png/pdf，单个不超过 5MB" data-testid="f-upload" />
            </FormRow>

            <FormRow label="富文本" hint="Tiptap 所见即所得">
              <RichTextEditor value={html} onChange={setHtml} />
            </FormRow>

            <FormRow label="Markdown" hint="编辑 + 实时预览">
              <MarkdownEditor value={md} onChange={setMd} height={240} />
            </FormRow>
          </Section>

          {/* ── 展示与反馈 ── */}
          <Section icon={MessageSquare} tone="text-rose-500" title="展示与反馈" desc="Badge / Tag / Alert / Progress / Tooltip / Popover / Pagination">
            <FormRow label="徽标 / 标签" hint="Badge & Tag">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>默认</Badge>
                <Badge variant="secondary">次要</Badge>
                <Badge variant="destructive">危险</Badge>
                <Badge variant="outline">描边</Badge>
                <Badge variant="success">成功</Badge>
              </div>
            </FormRow>

            <FormRow label="进度条" hint="Progress">
              <div className="space-y-2 sm:max-w-md">
                <Progress value={35} />
                <Progress value={72} />
              </div>
            </FormRow>

            <FormRow label="提示条" hint="Alert">
              <div className="space-y-2">
                <Alert>
                  <AlertTitle>信息</AlertTitle>
                  <AlertDescription>这是一条普通提示信息。</AlertDescription>
                </Alert>
                <Alert variant="destructive">
                  <AlertTitle>警告</AlertTitle>
                  <AlertDescription>这是一条危险/错误提示。</AlertDescription>
                </Alert>
              </div>
            </FormRow>

            <FormRow label="文字提示 / 气泡" hint="Tooltip & Popover">
              <div className="flex flex-wrap items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm"><HelpCircle className="h-4 w-4" /> 悬停提示</Button>
                  </TooltipTrigger>
                  <TooltipContent>这是一段悬浮提示文字</TooltipContent>
                </Tooltip>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm"><Palette className="h-4 w-4" /> 点击浮层</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="text-sm font-medium">气泡卡片</div>
                    <p className="mt-1 text-xs text-muted-foreground">可承载任意内容的浮层，用于二次确认或信息补充。</p>
                  </PopoverContent>
                </Popover>
              </div>
            </FormRow>

            <FormRow label="分页" hint="Pagination">
              <Pagination page={page} pageSize={pageSize} total={237} onPageChange={setPage} onPageSizeChange={setPageSize} />
            </FormRow>
          </Section>

          {/* 底部操作 */}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline"><Sparkles className="h-4 w-4" /> 重置</Button>
            <Button type="button"><SlidersHorizontal className="h-4 w-4" /> 提交</Button>
          </div>
        </div>
        </ContentFrame>
      </div>
    </TooltipProvider>
  );
}
