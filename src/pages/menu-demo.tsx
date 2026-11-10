/**
 * pages/menu-demo.tsx — 多级菜单示例页（/menu）
 *
 * 说明（维护者需求：「做一个多级菜单例子，直接在菜单里面做」）：
 *   - 多级菜单本体做进了**侧边栏导航**（components/shell.tsx 里的 MultiLevelMenu）
 *   - 本页作为该示例的「落地页 / 说明页」：
 *       1) 再嵌一份完整展开的多级菜单（同一套配置，展示折叠态与递归渲染效果）
 *       2) 列出所有叶子菜单 → 对应的空页面链接，方便逐个点验
 *   - 菜单树为配置驱动（lib/menu-tree.ts），新增/调整菜单只改配置
 */
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, FolderTree, FileText, MousePointerClick } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContentFrame } from "@/components/ui/content-frame";
import { MultiLevelMenu } from "@/components/multi-level-menu";
import { MENU_LEAVES, MENU_TREE } from "@/lib/menu-tree";
import { useTranslation } from "react-i18next";

function countNodes(nodes: typeof MENU_TREE): { total: number; depth: number } {
  let total = 0;
  let depth = 0;
  const dfs = (ns: typeof MENU_TREE, d: number) => {
    depth = Math.max(depth, d);
    for (const n of ns) {
      total++;
      if (n.children?.length) dfs(n.children, d + 1);
    }
  };
  dfs(nodes, 1);
  return { total, depth };
}

export default function MenuDemoPage() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { total, depth } = countNodes(MENU_TREE);

  return (
    <div data-testid="menu-demo" className="flex flex-col">
      <ContentFrame>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
        <FolderTree className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">
          {t("menu.demoIntro")}
        </span>
        <Badge variant="secondary" className="ml-auto font-normal">{t("menu.demoNodeCount", { count: total })}</Badge>
        <Badge variant="secondary" className="font-normal">{t("menu.demoDepth", { count: depth })}</Badge>
        <Badge variant="secondary" className="font-normal">{t("menu.demoLeafCount", { count: MENU_LEAVES.length })}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 左：多级菜单本体（完整展开） */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClick className="h-4 w-4 text-primary" /> {t("menu.demoTreeTitle")}
            </CardTitle>
            <CardDescription>
              {t("menu.demoTreeDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card/60 p-2">
              <MultiLevelMenu />
            </div>
          </CardContent>
        </Card>

        {/* 右：全部叶子页面清单 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" /> {t("menu.demoListTitle")}
            </CardTitle>
            <CardDescription>{t("menu.demoListDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {MENU_LEAVES.map((leaf) => {
              const active = pathname === leaf.path;
              return (
                <Link
                  key={leaf.path}
                  to={leaf.path}
                  data-testid={`leaf-link-${leaf.path.replace(/\//g, "-")}`}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="flex flex-1 items-center gap-1 text-muted-foreground">
                    {leaf.trailKeys.map((key, i) => (
                      <span key={`${key}-${i}`} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
                        <span className={i === leaf.trailKeys.length - 1 ? "font-medium text-foreground" : ""}>
                          {t(key)}
                        </span>
                      </span>
                    ))}
                  </span>
                  {active && <Badge variant="secondary" className="font-normal">{t("menu.current")}</Badge>}
                  <code className="text-xs text-muted-foreground">{leaf.path}</code>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
      </ContentFrame>
    </div>
  );
}
