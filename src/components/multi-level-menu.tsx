/**
 * components/multi-level-menu.tsx — 多级菜单渲染器（递归 · 配置驱动）
 *
 * 说明（维护者需求：「多级菜单例子，直接在菜单里面做」）：
 *   - 数据来自 `lib/menu-tree.ts` 的 MENU_TREE（nested 配置）
 *   - 父节点：可展开/折叠（带展开箭头 + 层级缩进），点击只控制展开，不导航
 *   - 叶子节点：可点击，导航到 path 对应的空白占位页；当前选中项高亮
 *   - 进入某路由时，自动展开该分支的所有祖先节点
 *   - 侧边栏折叠态：仅显示图标（父节点点击跳转到其下第一个叶子）
 */
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { MENU_TREE, ancestorsOf, type MenuNode } from "@/lib/menu-tree";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

/** 取某父节点下的第一个叶子（折叠态点父节点时用） */
function firstLeaf(node: MenuNode): string | undefined {
  if (node.path && !node.children?.length) return node.path;
  for (const c of node.children ?? []) {
    const p = firstLeaf(c);
    if (p) return p;
  }
  return undefined;
}

function MenuBranch({
  node,
  depth,
  collapsed,
  activePath,
  expanded,
  onToggle,
  onOpenNewTab,
}: {
  node: MenuNode;
  depth: number;
  collapsed: boolean;
  activePath: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onOpenNewTab?: (e: React.MouseEvent, leaf: { path: string; labelKey: string }) => void;
}) {
  const { t } = useTranslation();
  const hasChildren = !!node.children?.length;
  const isActive = !hasChildren && node.path === activePath;
  /** 当前分支展开（自身展开 & 其子链含激活项） */
  const open = expanded.has(node.id);
  const Icon = node.icon;

  // 缩进：每级 14px（折叠态不缩进）
  const indent = collapsed ? 8 : 12 + depth * 14;

  const baseCls = cn(
    "group relative flex w-full items-center gap-2 rounded-md py-2 pr-3 text-sm font-medium transition-colors",
    collapsed && "justify-center px-2",
    isActive
      ? "bg-chrome-active font-semibold text-chrome-active-foreground shadow-raised"
      : "text-chrome-foreground hover:bg-chrome-hover hover:text-white"
  );

  /* ---- 叶子节点：可导航 ---- */
  if (!hasChildren) {
    return (
      <Link
        to={node.path!}
        data-testid={`menu-leaf-${node.id}`}
        title={`${t(node.labelKey)}${t("menu.openNewTabHint")}`}
        style={collapsed ? undefined : { paddingLeft: indent }}
        onClick={(e) => onOpenNewTab?.(e, { path: node.path!, labelKey: node.labelKey })}
        className={baseCls}
      >
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0" />
        ) : (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
        )}
        {!collapsed && <span className="truncate">{t(node.labelKey)}</span>}
      </Link>
    );
  }

  /* ---- 父节点：可展开/折叠 ---- */
  const handleClick = () => {
    if (collapsed) return; // 折叠态由 Link 处理
    onToggle(node.id);
  };

  const header = (
    <>
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-60" />
      )}
      {!collapsed && <span className="truncate">{t(node.labelKey)}</span>}
      {!collapsed && (
        <ChevronRight
          className={cn(
            "ml-auto h-3.5 w-3.5 shrink-0 text-current opacity-60 transition-transform",
            open && "rotate-90"
          )}
        />
      )}
    </>
  );

  return (
    <div data-testid={`menu-branch-${node.id}`}>
      {collapsed ? (
        <Link
          to={firstLeaf(node) ?? "/"}
          title={t(node.labelKey)}
          data-testid={`menu-toggle-${node.id}`}
          className={baseCls}
        >
          {header}
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-expanded={open}
          data-testid={`menu-toggle-${node.id}`}
          data-open={open}
          style={{ paddingLeft: indent }}
          className={cn(baseCls, "cursor-pointer")}
        >
          {header}
        </button>
      )}

      {!collapsed && open && (
        <div
          data-testid={`menu-children-${node.id}`}
          className="mt-0.5 space-y-0.5 border-l border-white/15"
          style={{ marginLeft: indent + 9 }}
        >
          {(node.children ?? []).map((c) => (
            <MenuBranch
              key={c.id}
              node={c}
              depth={depth + 1}
              collapsed={collapsed}
              activePath={activePath}
              expanded={expanded}
              onToggle={onToggle}
              onOpenNewTab={onOpenNewTab}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MultiLevelMenu({
  collapsed = false,
  className,
  onOpenNewTab,
}: {
  collapsed?: boolean;
  className?: string;
  onOpenNewTab?: (e: React.MouseEvent, leaf: { path: string; labelKey: string }) => void;
}) {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = React.useState<Set<string>>(
    () => new Set(ancestorsOf(pathname))
  );

  // 路由变化 → 自动展开当前分支的祖先
  React.useEffect(() => {
    const anc = ancestorsOf(pathname);
    if (!anc.length) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      anc.forEach((id) => next.add(id));
      return next;
    });
  }, [pathname]);

  const onToggle = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  return (
    <div className={cn("space-y-0.5", className)} data-testid="multi-level-menu">
      {MENU_TREE.map((n) => (
        <MenuBranch
          key={n.id}
          node={n}
          depth={0}
          collapsed={collapsed}
          activePath={pathname}
          expanded={expanded}
          onToggle={onToggle}
          onOpenNewTab={onOpenNewTab}
        />
      ))}
    </div>
  );
}
