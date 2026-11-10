/**
 * components/tabs/TabsContext.tsx — 多窗口（多标签页）工作区状态管理。
 *
 * 迁自 5300（refine-shadcn-admin）的 TabsContext，做了 ShardKit 适配：
 *   - 首页 Tab = `/`（案例索引），不再硬编码 5300 的 `/dashboard`
 *   - 标签标题/图标通过 `resolveTabMeta(pathname)` 解析，兼容 ShardKit 的
 *     两套导航（案例导航 + 多级菜单），未知路径用 pathname 兜底
 *   - localStorage key 独立：`shardkit.worktabs.v1`
 *
 * 设计要点：
 *   - 纯前端状态（localStorage 持久化），标签的 path 与 location.pathname 联动
 *   - 一个 Tab = 一条访问路径（标题、图标 key、是否固定、是否首页）
 *   - 提供 open / close / closeOthers / closeRight / closeAll / togglePin / 切换
 *   - 默认标签（/blank 空白页）不可关闭；标签全关后回落到它
 */
import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HOME_PATH, resolveTabMeta } from "./tab-meta";

export interface WorkTab {
  /** 唯一键 = 路由 path（含 query） */
  key: string;
  /** 标题 */
  title: string;
  /** 图标 key（用于 TabBar 渲染图标） */
  iconKey?: string;
  /** 固定（不可被"关闭其他"清掉，且始终排在前面） */
  pinned?: boolean;
  /** 首页（不可关闭） */
  home?: boolean;
}

interface TabsCtx {
  tabs: WorkTab[];
  activeKey: string;
  open: (tab: WorkTab) => void;
  close: (key: string) => void;
  closeOthers: (key: string) => void;
  closeRight: (key: string) => void;
  closeAll: () => void;
  togglePin: (key: string) => void;
}

const Ctx = React.createContext<TabsCtx | null>(null);
const STORAGE_KEY = "shardkit.worktabs.v1";

/**
 * 固定标签永远排在前面（稳定排序：pinned 组内保持原相对次序）。
 * 这是 5300 注释里声明的语义（「固定…且始终排在前面」），原实现未落地，
 * 这里补上，使「关闭右侧 / 关闭其他」的边界可预期。
 */
/**
 * 固定标签永远排在前面（稳定排序：pinned 组内保持原相对次序）。
 * 这是 5300 注释里声明的语义（「固定…且始终排在前面」），原实现未落地，
 * 这里补上，使「关闭右侧 / 关闭其他」的边界可预期。
 */
function normalize(list: WorkTab[]): WorkTab[] {
  return [...list.filter((t) => t.pinned), ...list.filter((t) => !t.pinned)];
}

/**
 * 当前路由应挂靠到的标签 key。
 *  - 普通路由：即 pathname（+search）→ 自成/命中一个标签
 *  - 带 tabKey 别名的路由（如 /list-page/new）：挂靠到父标签（/list-page），
 *    这样点击「页面式新建」不会新开标签，而是与列表页共用同一个标签。
 */
function resolveActiveKey(rawPath: string): string {
  const meta = resolveTabMeta(rawPath);
  return meta.tabKey ?? rawPath;
}

/**
 * 默认标签 = 空白兜底页（/blank）。
 * 语义：所有标签被关闭（closeAll / 关到最后一张）后回落到它；它固定且不可关闭。
 * 「案例索引 /」不再是首页，降为普通可关闭标签（仍从左侧导航可达）。
 */
const HOME_TAB: WorkTab = {
  key: HOME_PATH,
  title: "空白页",
  iconKey: "blank",
  pinned: true,
  home: true,
};

function load(): WorkTab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [HOME_TAB];
    const parsed = JSON.parse(raw) as WorkTab[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [HOME_TAB];
    // 保证首页存在且被固定
    const hasHome = parsed.some((t) => t.key === HOME_TAB.key);
    const list = parsed.map((t) => (t.key === HOME_TAB.key ? { ...t, pinned: true, home: true } : t));
    return normalize(hasHome ? list : [HOME_TAB, ...list]);
  } catch {
    return [HOME_TAB];
  }
}

export function TabsProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [tabs, setTabs] = React.useState<WorkTab[]>(() => load());
  // ★ 当前激活标签 = 路由挂靠后的 key（隐藏子路由归并到父标签，见 resolveActiveKey）
  const activeKey = resolveActiveKey(location.pathname + location.search);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
    } catch {
      /* ignore */
    }
  }, [tabs]);

  const open = React.useCallback(
    (tab: WorkTab) => {
      setTabs((prev) => (prev.some((t) => t.key === tab.key) ? prev : [...prev, tab]));
      navigate(tab.key);
    },
    [navigate]
  );

  const close = React.useCallback(
    (key: string) => {
      setTabs((prev) => {
        const target = prev.find((t) => t.key === key);
        if (!target || target.home) return prev;
        const next = prev.filter((t) => t.key !== key);
        if (key === activeKey) {
          // 关闭当前：切到相邻 tab
          const idx = prev.findIndex((t) => t.key === key);
          const fallback = next[Math.max(0, idx - 1)] ?? next[0] ?? HOME_TAB;
          navigate(fallback.key);
        }
        return next;
      });
    },
    [activeKey, navigate]
  );

  const closeOthers = React.useCallback(
    (key: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.pinned || t.key === key);
        if (!next.some((t) => t.key === activeKey)) navigate(next[next.length - 1]?.key ?? HOME_TAB.key);
        return next;
      });
    },
    [activeKey, navigate]
  );

  const closeRight = React.useCallback(
    (key: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.key === key);
        const next = prev.filter((t, i) => i <= idx || t.pinned);
        if (!next.some((t) => t.key === activeKey)) navigate(next[next.length - 1]?.key ?? HOME_TAB.key);
        return next;
      });
    },
    [activeKey, navigate]
  );

  const closeAll = React.useCallback(() => {
    setTabs((prev) => prev.filter((t) => t.home || t.pinned));
    navigate(HOME_TAB.key);
  }, [navigate]);

  const togglePin = React.useCallback((key: string) => {
    setTabs((prev) => normalize(prev.map((t) => (t.key === key ? { ...t, pinned: !t.pinned } : t))));
  }, []);

  // 路由变化 → 自动登记 tab（标题/图标按 ShardKit 信息架构解析）
  // ★ 带 tabKey 别名的路由（/list-page/new 等）不新开标签，仅复用父标签（/list-page）
  React.useEffect(() => {
    const key = resolveActiveKey(location.pathname + location.search);
    setTabs((prev) => {
      if (prev.some((t) => t.key === key)) return prev;
      const meta = resolveTabMeta(key);
      return [...prev, { key, title: meta.title, iconKey: meta.iconKey }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const value: TabsCtx = { tabs, activeKey, open, close, closeOthers, closeRight, closeAll, togglePin };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTabs() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useTabs must be used within TabsProvider");
  return ctx;
}
