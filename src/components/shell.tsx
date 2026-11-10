import * as React from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Boxes, Menu, Sun, Moon, ChevronsLeft, ChevronsRight, ChevronRight, Github,
  Maximize2, Minimize2, Languages, Check, ChevronDown, User, BookOpen, Lock, LogOut,
} from "lucide-react";
import { CASES } from "@/lib/cases";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLockScreen } from "@/components/lock-screen";
import { MultiLevelMenu } from "@/components/multi-level-menu";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES, changeLocale, type LocaleKey } from "@/i18n";
import { MENU_LEAVES } from "@/lib/menu-tree";
import { TabBar } from "@/components/tabs/TabBar";
import { MENU_ICON_KEY } from "@/components/tabs/tab-meta";
import { useTabs } from "@/components/tabs/TabsContext";
import { caseTitle } from "@/lib/cases";

/** 导航分组:按页面类型组织案例(对齐 vue-element-plus-admin 的组织思路) */
export interface NavEntry {
  to: string;
  /** 中文 fallback 标签 */
  label: string;
  /** i18n key(缺省回退 label);用于「框架层」导航文案 */
  labelKey?: string;
  /** 关联案例 id:用于按语言解析案例标题 */
  caseId?: string;
  /** 分组内标题需剔除的前缀(中文/英文) */
  stripPrefix?: RegExp;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

interface NavGroup {
  key: string;
  label: string;
  labelKey: string;
  items: NavEntry[];
}

/**
 * 导航(2026-09-16 维护者二次纠偏后;2026-09-29 接入 i18n):
 *   - 取消独立「底层组件」层;组件下沉到案例页,不再有面向人类程序员的零件索引。
 *   - 「控件展厅」(/components) 是一个**成品页面案例**(表单/交互控件集中演示),进入例导航。
 *   - 分组标题走 i18n(labelKey);案例条目标题走 CASES 的 titleEn(caseTitle)。
 *
 * 2026-11-05 重排（维护者：「东西不要动，重新排一下」）：
 *   原「页面案例」一组塞 11 项（大小粒度混在一起，表格/查询/组件却各自成组）。
 *   按类型拆开：开始(仪表盘领先) → 表单 → 表格 → 查询 → 组件 → 列表页 → 综合示例 → 布局区块。
 *   只调顺序与归组，不改任何页面/路由/案例元信息。
 */

/** 按给定路由顺序取案例：顺序即菜单顺序，不受 CASES 定义顺序影响 */
function pick(...paths: string[]): NavEntry[] {
  return paths.map((p) => {
    const c = CASES.find((x) => x.to === p);
    if (!c) throw new Error(`NAV_GROUPS: unknown case route ${p}`);
    return {
      to: c.to,
      label: c.title,
      caseId: c.id,
      stripPrefix: /^(表格|Table|查询|Search|列表页|List) · /,
      icon: c.icon,
      tag: c.kind === "block" ? "block" : "page",
    };
  });
}

export const NAV_GROUPS: NavGroup[] = [
  {
    // 仪表盘领先（维护者 2026-11-05）；空白页是「标签全关」的兜底页，紧随其后
    key: "start",
    label: "开始",
    labelKey: "nav.sectionStart",
    items: [
      ...pick("/dashboard", "/blank"),
      { to: "/", label: "案例索引", labelKey: "index.title", icon: Boxes },
    ],
  },
  {
    key: "form",
    label: "表单",
    labelKey: "nav.sectionForm",
    items: pick("/form"),
  },
  {
    // 「表格」分组：对齐 vue-admin-tpl 左侧导航「表格」下的两个子页
    key: "table",
    label: "表格",
    labelKey: "nav.sectionTable",
    items: pick("/table", "/table/card"),
  },
  {
    // 「查询」分组：对齐 vue-admin-tpl 左侧导航「组件 → 查询」
    key: "search",
    label: "查询",
    labelKey: "nav.sectionSearch",
    items: pick("/search", "/search/orders"),
  },
  {
    // 「组件」分组：控件/可视化类页面；计划流程图与其自适应网格实验版相邻
    key: "components",
    label: "组件",
    labelKey: "nav.sectionComponents",
    items: pick("/components", "/waterfall", "/plan-flow", "/plan-flow-fit"),
  },
  {
    // 「完整示例」分组：两个列表页按「弹窗式 / 页面式」并列（原散在「页面案例」里）
    key: "list",
    label: "完整示例",
    labelKey: "nav.sectionList",
    items: pick("/list", "/list-page"),
  },
  {
    // 「综合示例」分组：原「页面案例」剩下的整页级案例（详情/认证/错误/多级菜单）
    key: "examples",
    label: "综合示例",
    labelKey: "nav.sectionExamples",
    items: pick("/detail", "/detail-view", "/auth", "/error", "/menu"),
  },
  {
    key: "blocks",
    label: "布局区块",
    labelKey: "nav.sectionBlocks",
    items: pick("/blocks"),
  },
];

/** 按语言解析一条导航项标题 */
export function resolveNavLabel(item: NavEntry, lang: string): string {
  if (item.labelKey) {
    // 调用处已用 t() 处理,此处仅作无 hook 场景 fallback
    return item.label;
  }
  if (item.caseId) {
    const c = CASES.find((x) => x.id === item.caseId);
    if (c) {
      const title = caseTitle(c, lang);
      return item.stripPrefix ? title.replace(item.stripPrefix, "") : title;
    }
  }
  return item.label;
}

/** 导航分组(已按语言解析标题)--供组件内使用 */
function useNavGroups() {
  const { t, i18n } = useTranslation();
  return React.useMemo(
    () =>
      NAV_GROUPS.map((g) => ({
        ...g,
        label: t(g.labelKey),
        items: g.items.map((i) => ({
          ...i,
          label: i.labelKey ? t(i.labelKey) : resolveNavLabel(i, i18n.language),
        })),
      })),
    [t, i18n.language]
  );
}

function matchKey(pathname: string): string {
  const all = NAV_GROUPS.flatMap((g) => g.items);
  const hit = all
    .filter((i) => i.to !== "/" && (pathname === i.to || pathname.startsWith(i.to + "/")))
    .sort((a, b) => b.to.length - a.to.length)[0];
  if (hit) return hit.to;
  return "/";
}

function useTheme() {
  const [dark, setDark] = React.useState<boolean>(() => {
    try {
      const t = localStorage.getItem("shardkit.theme");
      return t ? t === "dark" : true;
    } catch {
      return true;
    }
  });
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("shardkit.theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <Link
      to="/"
      className={cn(
        "flex h-14 items-center gap-2 border-b border-white/10 px-4 font-semibold text-white",
        collapsed && "justify-center px-2"
      )}
    >
      {/* 品牌标：public/logo.svg（唯一源，渐变底板 + 白色 K 字形由两片「碎片」与竖条构成）。
          2026-11-05 起不再用 lucide 图标拼贴，图片自带渐变，外层只保留光晕与描边环。 */}
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-[0_0_16px_-2px_rgba(99,102,241,0.8)]">
        <img src="/logo.svg" alt="ShardKit" width={28} height={28} className="h-7 w-7 rounded-lg" />
        <span className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
      </div>
      {!collapsed && (
        <span className="truncate text-sm font-semibold tracking-tight text-white">ShardKit</span>
      )}
    </Link>
  );
}

/**
 * HeaderActions - C 区(顶栏右侧)操作组
 *   对齐 vue-admin-tpl「ToolHeader」右侧:全屏 / 多语言 / 用户信息(+ 主题/仓库)
 *   说明:语言与用户设置为按钮占位,具体功能后续实现。
 */
const LANGUAGES = SUPPORTED_LOCALES;

function HeaderActions({ dark, toggle }: { dark: boolean; toggle: () => void }) {
  const { t, i18n } = useTranslation();
  const [full, setFull] = React.useState(false);
  const [langOpen, setLangOpen] = React.useState(false);
  const lang = i18n.language as LocaleKey;

  React.useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="flex items-center gap-1" data-testid="header-actions">
      {/* 全屏 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        title={full ? t("header.exitFullscreen") : t("header.fullscreen")}
        aria-label={full ? t("header.exitFullscreen") : t("header.fullscreen")}
        data-testid="header-fullscreen"
      >
        {full ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>

      {/* 语言切换 */}
      <Popover open={langOpen} onOpenChange={setLangOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" title={t("header.switchLanguage")} aria-label={t("header.switchLanguage")} data-testid="header-locale">
            <Languages className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40 p-1" data-testid="header-locale-menu">
          {LANGUAGES.map((l) => (
            <button
              key={l.key}
              type="button"
              data-testid={`locale-${l.key}`}
              onClick={() => {
                changeLocale(l.key);
                setLangOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                lang === l.key ? "text-primary" : "text-muted-foreground"
              )}
            >
              {l.label}
              {lang === l.key && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* 主题切换 */}
      <Button variant="ghost" size="icon" onClick={toggle} title={dark ? t("header.switchLight") : t("header.switchDark")} data-testid="header-theme">
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* 仓库 */}
      <a
        href="https://github.com/agentgeex/shardkit"
        target="_blank"
        rel="noreferrer"
        data-testid="header-repo"
        title={t("header.repo")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Github className="h-4 w-4" />
      </a>

      {/* 用户信息设置(对齐 vue-admin-tpl UserInfo:个人中心/文档/锁定屏幕/退出登录) */}
      <UserMenu />
    </div>
  );
}

/**
 * UserMenu - C 区右侧「用户信息」下拉(参考 vue-admin-tpl UserInfo)
 *   个人中心 → 路由跳转 /personal/center
 *   文档     → 新窗口打开
 *   锁定屏幕 → 弹锁屏密码对话框(LockScreenProvider)
 *   退出登录 → 二次确认后跳 /login
 */
function UserMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const navigate = useNavigate();
  const { requestLock } = useLockScreen();

  const go = (fn: () => void) => {
    setOpen(false);
    // 等 Popover 关闭后再执行,避免焦点抢占
    setTimeout(fn, 0);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid="header-user"
            title={t("header.settings")}
            className="ml-1 flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-accent"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
              F
            </span>
            <span className="hidden text-sm font-medium lg:inline">demo</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground lg:inline" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44 p-1" data-testid="header-user-menu">
          <button
            type="button"
            data-testid="user-profile"
            onClick={() => go(() => navigate("/personal/center"))}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <User className="h-3.5 w-3.5" />
            {t("header.profile")}
          </button>
          <button
            type="button"
            data-testid="user-doc"
            onClick={() => go(() => window.open("https://element-plus-admin-doc.cn/", "_blank", "noopener"))}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" />
            {t("header.document")}
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            data-testid="user-lock"
            onClick={() => go(requestLock)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Lock className="h-3.5 w-3.5" />
            {t("header.lock")}
          </button>
          <button
            type="button"
            data-testid="user-logout"
            onClick={() => go(() => setConfirmLogout(true))}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("header.logout")}
          </button>
        </PopoverContent>
      </Popover>

      {/* 退出登录二次确认 */}
      <Dialog open={confirmLogout} onOpenChange={setConfirmLogout}>
        <DialogContent data-testid="logout-confirm" className="max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{t("header.logout")}</DialogTitle>
          </DialogHeader>
          <DialogBody className="py-2">
            <p className="text-sm text-muted-foreground">{t("header.logoutPrompt")}</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              data-testid="logout-confirm-btn"
              onClick={() => {
                setConfirmLogout(false);
                navigate("/login");
              }}
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 三级路由 → 子页名（用于导航层级下钻，如 /list-page/:id/edit） */
const CRUMB_CHILD: Record<string, { zh: string; en: string }> = {
  new: { zh: "新建", en: "New" },
  edit: { zh: "编辑", en: "Edit" },
  recipe: { zh: "业务配方表单", en: "Recipe form" },
};

interface Crumb {
  label: string;
  /** 可点跳转；最后一级不带 to（当前页） */
  to?: string;
}

/**
 * ██ 面包屑 AppBreadcrumb
 * ────────────────────────────────────────────────────────────────────────
 * 2026-10-29 维护者定：顶栏左侧原先的「通用查询」框已删除（未接线的纯占位），
 * 空着难看 → 改成面包屑，承担「我现在在哪」。
 *
 * 为什么是面包屑而不是别的：
 *   ① 侧栏只高亮当前项，**层级关系看不出来**（页面案例 → 列表页 → 详情 是三层）；
 *   ② 多窗口标签栏只显示当前页名，**回不去上一级**（标签平铺，没有父子）；
 *   ③ 顶栏本来就有位置，不新增任何占位高度。
 *
 * 层级来源（唯一事实源，不另建一套映射）：
 *   - 一级：NAV_GROUPS 的 group.label（开始 / 页面案例 / 表格 / 查询 / 组件 / 布局区块）
 *   - 二级：NAV_GROUPS 里的导航项（与侧栏同一份数据）
 *   - 三级：路由剩余段（new / edit / recipe / 实体 id）
 *   - /menu/* 单独走 MENU_LEAVES（多级菜单示例，不在 NAV_GROUPS 里）
 *
 * ★ 弹窗不算一层 —— 面包屑只表达**页面**层级；新建/编辑/运行弹窗是页内浮层，
 *   不改 URL 也不该改面包屑（维护者明确「弹出框就不用了吧」）。
 */
function AppBreadcrumb() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isZh = lang.startsWith("zh");

  const crumbs = React.useMemo<Crumb[]>(() => {
    const path = pathname.replace(/\/+$/, "") || "/";

    // 多级菜单示例：/menu/*
    if (path.startsWith("/menu")) {
      const leaf = MENU_LEAVES.find((l) => l.path === path);
      return [
        { label: t("index.title"), to: "/" },
        { label: t("nav.multiLevel") },
        { label: leaf ? t(leaf.labelKey) : path, to: leaf ? undefined : "/menu" },
      ];
    }

    const HOME: Crumb = { label: t("index.title"), to: "/" };

    // ① 精确命中导航项 → （首页）/ 分组 / 页面
    for (const g of NAV_GROUPS) {
      const hit = g.items.find((it) => it.to === path);
      if (hit) {
        const tail = [
          { label: g.labelKey ? t(g.labelKey) : g.label },
          { label: resolveNavLabel(hit, lang) },
        ];
        // 根路径 = 首页本身，不再重复「开始 / 案例索引」
        return path === "/" ? [{ label: t("index.title") }] : [HOME, ...tail];
      }
    }

    // ② 子页：取「最长前缀命中」的导航项当父级，其余段当下钻层
    let parent: { group: NavGroup; item: NavEntry } | null = null;
    for (const g of NAV_GROUPS) {
      for (const it of g.items) {
        if (path.startsWith(it.to + "/") && (!parent || it.to.length > parent.item.to.length)) {
          parent = { group: g, item: it };
        }
      }
    }
    if (parent) {
      const rest = path.slice(parent.item.to.length + 1).split("/").filter(Boolean);
      const leaf = rest[rest.length - 1] ?? "";
      const named = CRUMB_CHILD[leaf];
      const leafLabel = named
        ? isZh
          ? named.zh
          : named.en
        : rest.length === 1
          ? t("common.detail")
          : leaf;
      return [
        HOME,
        { label: parent.group.labelKey ? t(parent.group.labelKey) : parent.group.label },
        { label: resolveNavLabel(parent.item, lang), to: parent.item.to },
        { label: leafLabel },
      ];
    }

    // ③ 兜底：分组 + 原路径（宁可见不丢）
    return [{ label: t("index.title"), to: "/" }, { label: path }];
  }, [pathname, lang, isZh, t]);

  return (
    <nav
      aria-label={t("header.breadcrumb")}
      data-testid="app-breadcrumb"
      className="hidden min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm md:flex"
    >
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <React.Fragment key={`${c.label}-${i}`}>
            {i > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
            )}
            {!last && c.to ? (
              <Link
                to={c.to}
                className="shrink-0 truncate rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {c.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className={cn(
                  "min-w-0 truncate",
                  last ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {c.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = React.useState(false);
  const { dark, toggle } = useTheme();
  const { pathname } = useLocation();
  const { open } = useTabs();
  const navGroups = useNavGroups();
  const activeKey = matchKey(pathname);

  /** 案例导航:Ctrl/⌘/中键 点击 → 在新增工作区标签打开(默认当前标签内导航) */
  const onNavClick = (e: React.MouseEvent, it: NavEntry) => {
    if (e.metaKey || e.ctrlKey || e.button === 1) {
      e.preventDefault();
      open({ key: it.to, title: it.label, iconKey: it.to.replace(/\//g, "") || "index" });
    }
  };

  /** 多级菜单叶子:同样支持新标签打开(key/title 取自菜单树) */
  const onMenuOpenNewTab = React.useCallback(
    (e: React.MouseEvent, leaf: { path: string; labelKey: string }) => {
      if (e.metaKey || e.ctrlKey || e.button === 1) {
        e.preventDefault();
        open({ key: leaf.path, title: t(leaf.labelKey), iconKey: MENU_ICON_KEY });
      }
    },
    [open, t]
  );

  const navLink = (it: NavEntry) => {
    const active = activeKey === it.to;
    return (
      <Link
        key={it.to}
        to={it.to}
        data-testid={`nav-${it.to.replace(/\//g, "") || "index"}`}
        title={`${it.label}（${t("nav.newTabHint")}）`}
        onClick={(e) => onNavClick(e, it)}
        className={cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-chrome-active font-semibold text-chrome-active-foreground shadow-raised"
            : "text-chrome-foreground hover:bg-chrome-hover hover:text-white",
          collapsed && "justify-center px-2"
        )}
      >
        <it.icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{it.label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <aside
        className={cn(
          "hidden h-dvh shrink-0 flex-col border-r border-strong bg-chrome text-chrome-foreground transition-all duration-200 md:flex",
          collapsed ? "w-[68px]" : "w-[208px]"
        )}
      >
        <Brand collapsed={collapsed} />
        <nav className="flex-1 space-y-4 overflow-y-auto p-2" data-nav-collapsed={collapsed}>
          {navGroups.map((g) => (
            <div key={g.key} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-chrome-foreground/75">
                  {g.label}
                </div>
              )}
              {g.items.map(navLink)}
            </div>
          ))}
          <Separator className="bg-white/10" />
          {/* 多级菜单示例：做进侧边栏导航（父级可展开/折叠，叶子对应空页面）。
              2026-11-05 维护者：整块从顶部下移到此处，不再抢在「仪表盘」前面。 */}
          <div className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-chrome-foreground/75">
                {t("nav.multiLevelDemo")}
              </div>
            )}
            <MultiLevelMenu collapsed={collapsed} onOpenNewTab={onMenuOpenNewTab} />
            {!collapsed && (
              <Link
                to="/menu"
                data-testid="menu-demo-link"
                className="block px-3 pt-1 text-[11px] text-chrome-foreground/75 hover:text-white"
              >
                {t("nav.leafCount", { count: MENU_LEAVES.length })} · {t("nav.viewDemoGuide")}
              </Link>
            )}
          </div>
        </nav>
        {/* 底部操作区:与右侧主区页脚等高且贴合(缩短高度:px-6 py-2 + border-t + text-xs) */}
        <div className="flex shrink-0 items-center justify-center border-t border-white/10 px-6 py-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center justify-center gap-2 text-xs text-chrome-foreground hover:text-white",
              collapsed && "gap-0"
            )}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> {t("nav.collapse")}</>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-strong bg-card px-4">
          <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <Boxes className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">ShardKit</span>
          </Link>
          {/* 面包屑：占原「通用查询」框的位置，回答"我在哪"（弹窗不算一层） */}
          <AppBreadcrumb />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <HeaderActions dark={dark} toggle={toggle} />
          </div>
        </header>

        {/* 多窗口工作区标签栏 */}
        <TabBar />

        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">{children ?? <Outlet />}</main>
        <footer className="shrink-0 border-t border-strong bg-card px-6 py-2 text-xs text-muted-foreground">
          {t("footer.builtWith")} · MIT © 2026
        </footer>
      </div>
    </div>
  );
}
