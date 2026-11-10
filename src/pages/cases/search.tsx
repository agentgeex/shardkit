/**
 * 页面案例：查询 —「查询面板 · 全部示例」
 * ──────────────────────────────────────────────────────────────
 * 参考项目：vue-element-plus-admin（vue-admin-tpl）
 *   src/views/Components/Search.vue（左侧导航「组件 → 查询」）
 *   src/components/Search/（Search.vue + ActionButton.vue，基于 Form 二次封装）
 *
 * 复刻要点（对齐 vue-admin-tpl 演示页的「形态切换」操作区）：
 *   1. 查询面板 = Schema 驱动多字段筛选表单 + 查询/重置按钮
 *   2. 栅格切换：单列(inline) ↔ 多列栅格(isCol)
 *   3. 按钮位置：内联 / 底部左 / 底部中 / 底部右
 *   4. 动态选项：异步拉取 Select 选项
 *   5. 动态字段：删除 / 还原某个字段
 *   6. 赋值：setValues 给字段填值
 *   7. 加载态：查询 / 重置按钮 loading
 *   8. 展开收起：字段超一屏自动折叠（expandField 分界）
 *   9. 空值过滤：提交时自动剔除空字段（对齐 removeNoValueItem）
 *
 * 路由：/search
 */
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  Search as SearchIcon, RotateCcw, LayoutGrid, AlignLeft, ArrowDownToLine,
  ChevronDown, ChevronUp, ListFilter, Wand2, Loader2, Trash2, Undo2, CircleCheck,
} from "lucide-react";
import { ContentFrame, ContentFrameSection } from "@/components/ui/content-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { mockFetchOptions } from "./search/options";

/* 日期格式化：Date -> YYYY-MM-DD */
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/* ── 字段 Schema（对齐 vue-admin-tpl schema reactive<FormSchema[]>） ── */

type FieldKind = "input" | "select" | "checkbox" | "date" | "time";

interface FieldSchema {
  field: string;
  label: string;
  kind: FieldKind;
  hidden?: boolean;
}

const BASE_SCHEMA: FieldSchema[] = [
  { field: "field1", label: "输入框", kind: "input" },
  { field: "field2", label: "下拉选择", kind: "select" },
  { field: "field3", label: "多选", kind: "checkbox" },
  { field: "field4", label: "日期", kind: "date" },
  { field: "field5", label: "时间", kind: "time" },
  { field: "field6", label: "标题", kind: "input" },
  { field: "field7", label: "作者", kind: "input" },
  { field: "field8", label: "来源", kind: "input" },
  { field: "field9", label: "标签", kind: "input" },
  { field: "field10", label: "备注", kind: "input" },
  { field: "field11", label: "扩展 A", kind: "input" },
  { field: "field12", label: "扩展 B", kind: "input" },
  { field: "field13", label: "扩展 C", kind: "input" },
  { field: "field14", label: "扩展 D", kind: "input" },
  { field: "field15", label: "扩展 E", kind: "input" },
];

type LayoutKind = "inline" | "bottom";
type Pos = "left" | "center" | "right";

export default function SearchDemoCase() {
  const { t } = useTranslation();
  const [schema, setSchema] = React.useState<FieldSchema[]>(BASE_SCHEMA);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [isGrid, setIsGrid] = React.useState(false);
  const [layout, setLayout] = React.useState<LayoutKind>("inline");
  const [pos, setPos] = React.useState<Pos>("right");
  const [visible, setVisible] = React.useState(false); // 默认为收起（对齐 vue-admin-tpl 折叠语义；展开后显示全部字段）
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<string>("");

  const expandField = "field6"; // 折叠分界：index >= 该字段的隐藏

  // 空值过滤（对齐 removeNoValueItem）
  const filterEmpty = (m: Record<string, string>) =>
    Object.keys(m).reduce<Record<string, string>>((prev, k) => {
      const v = m[k];
      if (v !== undefined && v !== null && v !== "") prev[k] = v;
      return prev;
    }, {});

  const onSearch = () => {
    const filtered = filterEmpty(values);
    setSubmitted(JSON.stringify(filtered, null, 2));
  };

  const onReset = () => {
    setValues({});
    setSubmitted("");
  };

  const loadOptions = async () => {
    const res = await mockFetchOptions();
    setOptions(res);
  };

  const delField = (field: string) =>
    setSchema((s) => s.map((f) => (f.field === field ? { ...f, hidden: true } : f)));
  const restoreField = (field: string) =>
    setSchema((s) => s.map((f) => (f.field === field ? { ...f, hidden: false } : f)));

  const setField1 = () => setValues((v) => ({ ...v, field1: "Joy" }));

  const simulate = (setter: (b: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // 展开/收起：按 expandField 计算可见字段
  const visibleSchema = visible
    ? schema
    : (() => {
        const idx = schema.findIndex((f) => f.field === expandField);
        return schema.map((f, i) => (i >= idx ? { ...f, hidden: true } : f));
      })();

  const shown = visibleSchema.filter((f) => !f.hidden);

  const gridCols = isGrid ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1";

  // 左右结构：标题在左、控件在右（统一全站表单规范：8em 列宽 + 右对齐 + gap-3）
  const LEFT_FIELD = "grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center";

  const renderField = (f: FieldSchema) => {
    const val = values[f.field] ?? "";
    const set = (v: string) => setValues((prev) => ({ ...prev, [f.field]: v }));
    if (f.kind === "select") {
      return (
        <Select value={val} onValueChange={set}>
          <SelectTrigger data-testid={`field-${f.field}`}>
            <SelectValue placeholder={t("query.phPleaseSelect")} />
          </SelectTrigger>
          <SelectContent>
            {(options.length ? options : [{ label: "选项一", value: "1" }, { label: "选项二", value: "2" }]).map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (f.kind === "checkbox") {
      return (
        <div className="flex items-center gap-4" data-testid={`field-${f.field}`}>
          {["甲", "乙", "丙"].map((o) => (
            <label key={o} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={val.split(",").includes(o)}
                onCheckedChange={(c) =>
                  set(c ? [...val.split(",").filter(Boolean), o].join(",") : val.split(",").filter((x) => x !== o).join(","))
                }
              />
              {o}
            </label>
          ))}
        </div>
      );
    }
    if (f.kind === "date") {
      // 整框可点弹出自研日历（去掉浏览器原生日期图标）
      return (
        <DatePicker
          value={val ? new Date(val) : undefined}
          onChange={(d) => set(d ? toYmd(d) : "")}
          placeholder={t("query.phPickDate")}
          className="w-full"
          data-testid={`field-${f.field}`}
        />
      );
    }
    if (f.kind === "time") {
      // 整框可点弹出自研时间选择（去掉浏览器原生时间图标）
      return (
        <TimePicker
          value={val}
          onChange={set}
          placeholder={t("query.phPickTime")}
          className="w-full"
          data-testid={`field-${f.field}`}
        />
      );
    }
    return (
      <Input
        type="text"
        value={val}
        placeholder={t("query.phPleaseInput")}
        data-testid={`field-${f.field}`}
        onChange={(e) => set(e.target.value)}
      />
    );
  };

  const SearchButton = (
    <>
      <Button
        type="button"
        data-testid="search-btn"
        disabled={searchLoading}
        onClick={() => (searchLoading ? undefined : onSearch())}
      >
        {searchLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <SearchIcon className="mr-1 h-4 w-4" />}
        {t("query.submit")}
      </Button>
      <Button
        type="button"
        variant="outline"
        data-testid="reset-btn"
        disabled={resetLoading}
        onClick={() => (resetLoading ? undefined : onReset())}
      >
        {resetLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
        {t("common.reset")}
      </Button>
    </>
  );

  return (
    <div data-testid="search-demo-page" className="flex flex-col">
      {/* ── 操作区：形态切换（对齐 vue-admin-tpl 演示页一排按钮） ── */}
      <ContentFrame>
        <ContentFrameSection>
          <div className="mb-3 flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-base">
              <ListFilter className="h-4 w-4 text-sky-500" /> {t("query.opsTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("query.opsDesc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsGrid(true)} data-testid="op-grid">
              <LayoutGrid className="mr-1 h-4 w-4" /> {t("query.grid")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsGrid(false)}>
              <AlignLeft className="mr-1 h-4 w-4" /> {t("query.restoreGrid")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setLayout((l) => (l === "inline" ? "bottom" : "inline"))} data-testid="op-layout">
              <ArrowDownToLine className="mr-1 h-4 w-4" /> {t("query.buttonPos")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setLayout("bottom"); setPos("left"); }}>
              {t("query.posLeft")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setLayout("bottom"); setPos("center"); }}>
              {t("query.posCenter")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setLayout("bottom"); setPos("right"); }}>
              {t("query.posRight")}
            </Button>
            <Button size="sm" variant="outline" onClick={loadOptions} data-testid="op-dict">
              <Wand2 className="mr-1 h-4 w-4" /> {t("query.dynamicOptions")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => delField("field3")} data-testid="op-del">
              <Trash2 className="mr-1 h-4 w-4" /> {t("query.deleteField")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => restoreField("field3")}>
              <Undo2 className="mr-1 h-4 w-4" /> {t("query.restoreField")}
            </Button>
            <Button size="sm" variant="outline" onClick={setField1} data-testid="op-setvalue">
              <CircleCheck className="mr-1 h-4 w-4" /> {t("query.assign")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => simulate(setSearchLoading)}>
              {t("query.loadingSearch")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => simulate(setResetLoading)}>
              {t("query.loadingReset")}
            </Button>
          </div>
        </ContentFrameSection>

        {/* ── 查询面板 ── */}
        <ContentFrameSection data-testid="search-panel">
          <div className="mb-3 flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-base">
              <SearchIcon className="h-4 w-4 text-sky-500" /> {t("query.panelTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("query.panelDesc")}</p>
          </div>
          <div className="flex flex-col gap-4">
            {/* inline 布局：字段与按钮同行 */}
            {layout === "inline" ? (
              <div className={cn("grid gap-3", gridCols)}>
                {shown.map((f) => (
                  <div key={f.field} className={LEFT_FIELD}>
                    <Label className="w-full text-right text-muted-foreground">{f.label}</Label>
                    <div className="min-w-0">{renderField(f)}</div>
                  </div>
                ))}
                <div className="flex items-end gap-2 sm:col-span-full">{SearchButton}</div>
              </div>
            ) : (
              <>
                <div className={cn("grid gap-3", gridCols)}>
                  {shown.map((f) => (
                    <div key={f.field} className={LEFT_FIELD}>
                      <Label className="w-full text-right text-muted-foreground">{f.label}</Label>
                      <div className="min-w-0">{renderField(f)}</div>
                    </div>
                  ))}
                </div>
                <div
                  className={cn(
                    "flex gap-2",
                    pos === "left" && "justify-start",
                    pos === "center" && "justify-center",
                    pos === "right" && "justify-end"
                  )}
                >
                  {SearchButton}
                </div>
              </>
            )}

            {/* 展开 / 收起 */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                data-testid="expand-toggle"
                className="text-muted-foreground"
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                {visible ? t("query.collapse") : t("query.expand")}
              </Button>
            </div>

            {submitted && (
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <CircleCheck className="h-3.5 w-3.5 text-emerald-500" /> {t("query.submitted")}
                </p>
                <pre className="overflow-x-auto text-xs" data-testid="submitted-json">{submitted}</pre>
              </div>
            )}
          </div>
        </ContentFrameSection>
      </ContentFrame>
    </div>
  );
}
