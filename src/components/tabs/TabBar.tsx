/**
 * components/tabs/TabBar.tsx — 多窗口工作区标签栏。
 *
 * 迁自 5300（refine-shadcn-admin）的 TabBar，做了 ShardKit 适配：
 *   - 图标集换成 ShardKit 的案例/菜单图标（未知 key 给中性圆点兜底）
 *   - 品牌解绑（不出现任何 Win3 字样）
 *
 * 能力：
 *   - 切换 / 关闭 / 固定
 *   - 刷新：栏尾常驻一键按钮（四态：idle/running/ok/fail）+ 右键菜单同一动作
 *   - 右键菜单：刷新当前、固定/取消固定、关闭、关闭其他、关闭右侧、关闭全部
 *   - 横向滚动、激活态渐变光效
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  X, Pin, PinOff, RotateCw, ChevronsRight, ChevronsLeft,
  Boxes, LayoutDashboard, LayoutList, ClipboardList, Component, FileText,
  Lock, AlertTriangle, Blocks, FolderTree, Rows3, SquareDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/toast";
import { refreshPageData } from "@/lib/page-refresh-data";
import { useTabs, type WorkTab } from "./TabsContext";
import { resolveTabMeta } from "./tab-meta";

const ICONS: Record<string, React.ReactNode> = {
  index: <Boxes className="h-3.5 w-3.5" />,
  dashboard: <LayoutDashboard className="h-3.5 w-3.5" />,
  list: <LayoutList className="h-3.5 w-3.5" />,
  "list-page": <Rows3 className="h-3.5 w-3.5" />,
  form: <ClipboardList className="h-3.5 w-3.5" />,
  components: <Component className="h-3.5 w-3.5" />,
  detail: <FileText className="h-3.5 w-3.5" />,
  auth: <Lock className="h-3.5 w-3.5" />,
  error: <AlertTriangle className="h-3.5 w-3.5" />,
  blocks: <Blocks className="h-3.5 w-3.5" />,
  blank: <SquareDashed className="h-3.5 w-3.5" />,
  menu: <FolderTree className="h-3.5 w-3.5" />,
};

interface MenuState {
  x: number;
  y: number;
  tab: WorkTab;
}

export function TabBar() {
  const { tabs, activeKey, close, closeOthers, closeRight, closeAll, togglePin } = useTabs();
  const { t, i18n } = useTranslation();
  // 标签标题按当前语言实时解析（语言切换即刻重渲，无需改存储态）
  const tabTitle = (tab: WorkTab) => resolveTabMeta(tab.key, i18n.language, t).title;
  const navigate = useNavigate();
  const [menu, setMenu] = React.useState<MenuState | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // ── 刷新（规范：agentos TabBar 的同名实现）──────────────────────────
  // 四态：视觉即反馈，不等 toast 也知道「在刷 / 刷成了 / 刷挂了」
  type RefreshState = "idle" | "running" | "ok" | "fail";
  const [refreshing, setRefreshing] = React.useState<RefreshState>("idle");
  const { toast } = useToast();
  const resetTimer = React.useRef<number | undefined>(undefined);
  React.useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  // ★ 在途去重必须用 ref 判断：state 是异步的，连点时闭包里读到的还是旧值 "idle"，
  //   用 state 守卫挡不住连点（实测连点三下打了三份请求）。
  const inFlight = React.useRef(false);
  // 本地静态数据几乎瞬时返回，running 态一闪而过 → 看起来"点了没反应"。
  // 给转圈一个最短展示时长，既是可观测的反馈，也不会拖慢真正的刷新。
  const MIN_SPIN_MS = 420;

  const doRefresh = React.useCallback(async () => {
    if (inFlight.current) return; // ★ 在途去重：连点会打出多份快照
    inFlight.current = true;
    setRefreshing("running");
    const startedAt = Date.now();
    try {
      const r = await refreshPageData();
      const rest = MIN_SPIN_MS - (Date.now() - startedAt);
      if (rest > 0) await new Promise((res) => window.setTimeout(res, rest));
      if (r.ok) {
        setRefreshing("ok");
        toast({
          title: t("tabMenu.refreshed"),
          description: t("tabMenu.refreshedDesc", {
            time: new Date().toLocaleTimeString(i18n.language === "en-US" ? "en-US" : "zh-CN", { hour12: false }),
          }),
          variant: "success",
        });
      } else {
        setRefreshing("fail");
        toast({
          title: t("tabMenu.refreshFailed"),
          description: r.authRequired ? t("tabMenu.refreshAuth") : r.code || t("tabMenu.refreshBackend"),
          variant: "destructive",
        });
      }
    } finally {
      inFlight.current = false;
      // 状态灯留 1.2s 再回 idle（太快回弹用户看不到结果）
      window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setRefreshing("idle"), 1200);
    }
  }, [toast, t, i18n.language]);

  React.useEffect(() => {
    const closeMenu = () => setMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, []);

  /**
   * 视口边界钳制：菜单渲染后（布局阶段，绘制前）测量尺寸。
   * 优先「翻转」（贴近右/下边缘时向左/上翻），仍溢出则「收拢」进视口。
   * 修正前菜单因 backdrop-filter 包含块问题整体偏移，此处同时兜底保证
   * 任何情况下都不会溢出屏幕。
   */
  React.useLayoutEffect(() => {
    const el = menuRef.current;
    if (!menu || !el) return;
    const MARGIN = 8;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = menu.x;
    let top = menu.y;
    // 水平：右边缘溢出 → 翻转向左展开
    if (left + w > vw - MARGIN) left = menu.x - w;
    // 仍溢出（或翻到左边界外）→ 收拢
    if (left + w > vw - MARGIN) left = vw - MARGIN - w;
    if (left < MARGIN) left = MARGIN;
    // 垂直：下边缘溢出 → 翻转向上展开
    if (top + h > vh - MARGIN) top = menu.y - h;
    if (top + h > vh - MARGIN) top = vh - MARGIN - h;
    if (top < MARGIN) top = MARGIN;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [menu]);

  const scrollBy = (dx: number) => scrollRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  const onContextMenu = (e: React.MouseEvent, tab: WorkTab) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, tab });
  };

  return (
    <div
      data-testid="tabbar"
      className="relative flex h-11 shrink-0 items-center gap-1 border-b border-strong bg-card"
    >
      <button
        onClick={() => scrollBy(-180)}
        data-testid="tabbar-scroll-left"
        className="flex h-full w-7 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title={t("tabMenu.scrollLeft")}
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>

      <div
        ref={scrollRef}
        className="scrollbar-thin flex h-full flex-1 items-center gap-1 overflow-x-auto scroll-smooth px-1"
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <div
              key={tab.key}
              data-testid={`tab-${tab.key}`}
              data-active={active ? "true" : "false"}
              data-pinned={tab.pinned ? "true" : "false"}
              onClick={() => navigate(tab.key)}
              onContextMenu={(e) => onContextMenu(e, tab)}
              className={cn(
                "group relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all",
                active
                  ? "border-primary/40 bg-primary/10 text-foreground shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_0_18px_-6px_hsl(var(--primary)/0.55)]"
                  : "border-border/70 bg-muted/40 text-muted-foreground hover:border-border hover:bg-accent hover:text-accent-foreground"
              )}
              title={tabTitle(tab)}
            >
              {active && (
                <span className="pointer-events-none absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
              )}
              <span className={cn(active ? "text-primary" : "text-muted-foreground")}>
                {ICONS[tab.iconKey ?? ""] ?? (
                  <span className="block h-3.5 w-3.5 rounded-full border border-current opacity-40" />
                )}
              </span>
              <span className="max-w-[140px] truncate">{tabTitle(tab)}</span>
              {tab.pinned ? (
                <Pin className="h-3 w-3 shrink-0 text-primary/70" />
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    close(tab.key);
                  }}
                  className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                  title={t("common.close")}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => scrollBy(180)}
        data-testid="tabbar-scroll-right"
        className="flex h-full w-7 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        title={t("tabMenu.scrollRight")}
      >
        <ChevronsRight className="h-4 w-4" />
      </button>

      {/* 刷新：标签栏最右、border-l 与标签区隔开。
          放这里而不是内容区顶部 —— 每页工具栏布局不同，位置会漂；标签栏是唯一稳定的横向条。 */}
      <button
        onClick={() => void doRefresh()}
        disabled={refreshing === "running"}
        data-testid="tabbar-refresh"
        data-state={refreshing}
        aria-label={t("tabMenu.refresh")}
        title={t("tabMenu.refreshTitle")}
        className={cn(
          "flex h-full w-9 shrink-0 items-center justify-center border-l border-strong transition-colors",
          // ⚠️ 只 hover 变色底，不 hover 变字色：否则鼠标停在按钮上时
          //    hover:text-accent-foreground 会把 running/ok/fail 三态的颜色盖掉，
          //    用户点完鼠标还在上面，就看不到"转圈变蓝 / 成功变绿"了。
          "hover:bg-accent disabled:cursor-progress",
          refreshing === "running" && "text-primary",
          refreshing === "ok" && "text-success",
          refreshing === "fail" && "text-destructive",
          refreshing === "idle" && "text-muted-foreground"
        )}
      >
        <RotateCw className={cn("h-4 w-4 transition-transform", refreshing === "running" && "animate-spin")} />
      </button>

      {/* 右键菜单：createPortal 到 document.body，脱离 TabBar 的 backdrop-filter 包含块 */}
      {menu &&
        createPortal(
        <div
          ref={menuRef}
          data-testid="tab-context-menu"
          className="fixed z-50 min-w-[168px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem
            testid="menu-refresh"
            icon={<RotateCw className="h-3.5 w-3.5" />}
            onClick={() => {
              navigate(menu.tab.key);
              setMenu(null);
              void doRefresh();
            }}
          >
            {t("tabMenu.refresh")}
          </MenuItem>
          <MenuItem
            testid="menu-pin"
            icon={menu.tab.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            onClick={() => {
              togglePin(menu.tab.key);
              setMenu(null);
            }}
          >
            {menu.tab.pinned ? t("tabMenu.unpin") : t("tabMenu.pin")}
          </MenuItem>
          <div className="my-1 h-px bg-border" />
          <MenuItem
            testid="menu-close"
            icon={<X className="h-3.5 w-3.5" />}
            disabled={menu.tab.home}
            onClick={() => {
              close(menu.tab.key);
              setMenu(null);
            }}
          >
            {t("tabMenu.close")}
          </MenuItem>
          <MenuItem
            testid="menu-close-others"
            icon={<Component className="h-3.5 w-3.5" />}
            onClick={() => {
              closeOthers(menu.tab.key);
              setMenu(null);
            }}
          >
            {t("tabMenu.closeOthers")}
          </MenuItem>
          <MenuItem
            testid="menu-close-right"
            icon={<ChevronsRight className="h-3.5 w-3.5" />}
            onClick={() => {
              closeRight(menu.tab.key);
              setMenu(null);
            }}
          >
            {t("tabMenu.closeRight")}
          </MenuItem>
          <MenuItem
            testid="menu-close-all"
            icon={<X className="h-3.5 w-3.5" />}
            onClick={() => {
              closeAll();
              setMenu(null);
            }}
          >
            {t("tabMenu.closeAll")}
          </MenuItem>
        </div>,
        document.body
      )}
    </div>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
  disabled,
  testid,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  testid?: string;
}) {
  return (
    <button
      data-testid={testid}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
