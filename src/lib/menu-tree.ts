/**
 * lib/menu-tree.ts — 多级菜单示例（配置驱动 · 单一事实源）
 *
 * 用途（维护者本次需求：「做一个多级菜单例子，直接在菜单里面做，每个菜单对应一个空的页面」）：
 *   - 用一份 **nested 配置数组** 描述树形菜单（支持 2~3 级嵌套）
 *   - 侧边栏 `components/multi-level-menu.tsx` 按此配置递归渲染
 *   - 路由按叶子节点的 path 批量生成（App.tsx），每个叶子 → 一个空白占位页
 *
 * 约定：
 *   - 有 children 的节点 = 父节点（可展开/折叠，不可导航）
 *   - 无 children 的节点 = 叶子节点（可点击，导航到 path 对应的空页面）
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, BarChart3, FileText, CalendarDays, Wallet,
  TrendingUp, TrendingDown, ListChecks, LayoutGrid, Settings,
  Users, ShieldCheck, HelpCircle,
} from "lucide-react";

export interface MenuNode {
  /** 节点 id（唯一，用于展开态记录） */
  id: string;
  /** i18n 词条键（菜单名一律走词条文件，不在代码里写死文案） */
  labelKey: string;
  icon?: LucideIcon;
  /** 叶子节点的路由（父节点不设） */
  path?: string;
  children?: MenuNode[];
}

/**
 * 菜单树：3 个一级分支，最深 3 级（一级 → 二级 → 三级）
 *
 *  工作台
 *    ├─ 报表中心
 *    │    ├─ 日报            (叶子 /menu/reports/daily)
 *    │    ├─ 周报            (叶子 /menu/reports/weekly)
 *    │    └─ 财务报表        (二级父节点)
 *    │         ├─ 收入明细    (叶子 /menu/reports/finance/income)
 *    │         └─ 支出明细    (叶子 /menu/reports/finance/expense)
 *    └─ 任务管理
 *         ├─ 任务列表        (叶子 /menu/tasks/list)
 *         └─ 任务看板        (叶子 /menu/tasks/board)
 *  系统设置
 *    ├─ 用户管理            (叶子 /menu/settings/users)
 *    └─ 角色权限            (叶子 /menu/settings/roles)
 *  帮助                       (一级叶子 /menu/help)
 */
export const MENU_TREE: MenuNode[] = [
  {
    id: "workspace",
    labelKey: "menu.workspace",
    icon: LayoutDashboard,
    children: [
      {
        id: "reports",
        labelKey: "menu.reports",
        icon: BarChart3,
        children: [
          { id: "reports-daily", labelKey: "menu.reportsDaily", icon: FileText, path: "/menu/reports/daily" },
          { id: "reports-weekly", labelKey: "menu.reportsWeekly", icon: CalendarDays, path: "/menu/reports/weekly" },
          {
            id: "reports-finance",
            labelKey: "menu.finance",
            icon: Wallet,
            children: [
              { id: "finance-income", labelKey: "menu.financeIncome", icon: TrendingUp, path: "/menu/reports/finance/income" },
              { id: "finance-expense", labelKey: "menu.financeExpense", icon: TrendingDown, path: "/menu/reports/finance/expense" },
            ],
          },
        ],
      },
      {
        id: "tasks",
        labelKey: "menu.tasks",
        icon: ListChecks,
        children: [
          { id: "tasks-list", labelKey: "menu.tasksList", icon: ListChecks, path: "/menu/tasks/list" },
          { id: "tasks-board", labelKey: "menu.tasksBoard", icon: LayoutGrid, path: "/menu/tasks/board" },
        ],
      },
    ],
  },
  {
    id: "settings",
    labelKey: "menu.settings",
    icon: Settings,
    children: [
      { id: "settings-users", labelKey: "menu.users", icon: Users, path: "/menu/settings/users" },
      { id: "settings-roles", labelKey: "menu.roles", icon: ShieldCheck, path: "/menu/settings/roles" },
    ],
  },
  { id: "help", labelKey: "menu.help", icon: HelpCircle, path: "/menu/help" },
];

export interface MenuLeaf {
  /** 叶子路由 */
  path: string;
  /** 叶子名称（i18n 词条键） */
  labelKey: string;
  /** 从一级到叶子的层级路径（面包屑），元素为 i18n 词条键 */
  trailKeys: string[];
}

function walk(
  nodes: MenuNode[],
  parents: string[],
  visit: (node: MenuNode, parents: string[]) => void
) {
  for (const n of nodes) {
    visit(n, parents);
    if (n.children?.length) walk(n.children, [...parents, n.labelKey], visit);
  }
}

/** 所有叶子节点（供 App.tsx 批量生成路由） */
export const MENU_LEAVES: MenuLeaf[] = (() => {
  const out: MenuLeaf[] = [];
  walk(MENU_TREE, [], (node, parents) => {
    if (node.path && !node.children?.length) {
      out.push({ path: node.path, labelKey: node.labelKey, trailKeys: [...parents, node.labelKey] });
    }
  });
  return out;
})();

function walkNodes(nodes: MenuNode[], visit: (node: MenuNode) => void) {
  for (const n of nodes) {
    visit(n);
    if (n.children?.length) walkNodes(n.children, visit);
  }
}

/** 按路由找叶子节点 */
export function findMenuLeaf(path: string): MenuLeaf | undefined {
  return MENU_LEAVES.find((l) => l.path === path);
}

/** 按路由取面包屑（层级路径，元素为 i18n 词条键） */
export function menuTrailKeys(path: string): string[] {
  return findMenuLeaf(path)?.trailKeys ?? [];
}

/** 取某路由沿途所有祖先节点 id（用于自动展开当前分支） */
export function ancestorsOf(path: string): string[] {
  const ids: string[] = [];
  const dfs = (nodes: MenuNode[], trail: string[]): boolean => {
    for (const n of nodes) {
      if (n.path === path && !n.children?.length) return true;
      if (n.children?.length && dfs(n.children, [...trail, n.id])) {
        ids.push(n.id);
        return true;
      }
    }
    return false;
  };
  dfs(MENU_TREE, []);
  return ids;
}
