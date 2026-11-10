/**
 * App.tsx — ShardKit SPA
 *
 * 形态（2026-09-16 维护者二次纠偏后）：**成品页面案例集**。
 *  - 左侧导航按页面类型组织（仪表盘 / 列表 / 表单 / 详情 / 认证 / 错误 / 组件 / 区块）
 *  - 每个导航项 = 一个完整可运行的页面案例，打开即见整页效果
 *  - **组件已下沉到各案例页**，不再有独立「底层组件」导航层
 *  - **不含面向人类程序员的辅助陈列**（「本页零件」/「零件反向索引」已移除）——
 *    本 demo 面向 Agent：Agent 直接读案例页源码即知其用法
 *
 * 路由分层（2026-09-28 维护者验收反馈：认证页独立化）：
 *  - **独立认证页 `/login`**：位于 AppShell 之外，全屏自成一体的登录页，
 *    不带侧边栏 / 工作区标签栏（真实应用里先于后台框架出现）。
 *  - **其余路由**：均在 AppShell 之内（含侧边栏 + 多窗口标签栏）。
 *
 * 技术栈：Refine (Headless core) + React Router + Tailwind + shadcn 底座。
 */
import { Refine } from "@refinedev/core";
import routerBindings, {
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import * as React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import { AppShell } from "@/components/shell";
import { AppDocumentTitle } from "@/components/app-document-title";
import { TabsProvider } from "@/components/tabs/TabsContext";
import { LockScreenProvider } from "@/components/lock-screen";
import { ToastProvider } from "@/components/ui/toast";
import IndexPage from "@/pages/index-page";

// 独立认证页（位于 AppShell 之外）
import AuthLoginPage from "@/pages/auth-login";

import DashboardCase from "@/pages/cases/dashboard";
// 列表页 · 弹窗式 CRUD：本案例自洽目录 dialog-crud/（零共享）
import ListCase from "@/pages/cases/dialog-crud";
// 列表页 · 页面式 CRUD：本案例自洽目录 page-crud/（零共享）
import ListPageCase from "@/pages/cases/page-crud";
import ProductNewPage from "@/pages/cases/page-crud/new";
import ProductEditPage from "@/pages/cases/page-crud/edit";
import ProductDetailPage from "@/pages/cases/page-crud/detail";
// 空白页：标签全关后的默认兜底页（固定标签，见 TabsContext）
import BlankCase from "@/pages/cases/blank";
import FormCase from "@/pages/cases/form";
import FormAllCase from "@/pages/cases/form-all";
// 表格页：/table 基础示例 + /table/card 卡片表格（对齐 vue-admin-tpl 左侧「表格」）
import TableBasicCase from "@/pages/cases/table/basic";
import TableCardCase from "@/pages/cases/table/card";
// 计划任务流程图：/plan-flow（React Flow + dagre，可视化计划 step 的 1:1 / 1:N / N:1 依赖）
import PlanFlowCase from "@/pages/cases/plan-flow";
// 计划流程图 · 自适应网格（实验，研究原型；与生产页零耦合）
import PlanFlowFitCase from "@/pages/cases/plan-flow-fit";
// 查询页：/search 查询面板·全部示例（对齐 vue-admin-tpl「组件→查询」）+ /search/orders 产品化订单查询
import SearchDemoCase from "@/pages/cases/search";
import OrderSearchCase from "@/pages/cases/search-orders";
import DetailCase from "@/pages/cases/detail";
// 详情页 · 表格型：纯只读描述列表（/detail-view，不改动 /detail）
import DetailViewCase from "@/pages/cases/detail-view";
import AuthCase from "@/pages/cases/auth";
import ErrorCase from "@/pages/cases/error";
import ComponentsCase from "@/pages/cases/components";
import WaterfallCase from "@/pages/cases/waterfall";
import BlocksCase from "@/pages/cases/blocks";
import MenuDemoPage from "@/pages/menu-demo";
import MenuPlaceholderPage from "@/pages/menu-placeholder";
import PersonalCenterPage from "@/pages/personal-center";
import { MENU_LEAVES } from "@/lib/menu-tree";
import { queryClient } from "@/lib/query-client";
import { usePageRefreshVersion } from "@/lib/page-refresh";

/**
 * 刷新重挂包装（规范：agentos App.tsx 的 RefreshableRoutes）
 * 版本号变化 = key 变化 = 当前页面子树卸载重挂 → 页面内 useEffect 重跑、数据重读。
 * 局部重挂 ≠ location.reload：标签页 / 侧栏 / 滚动位置 / 主题全部保留。
 * ⚠️ 只包业务页，不包 /login（登录页不该被刷新按钮牵着重挂）。
 */
function RefreshableRoutes({ children }: { children: React.ReactNode }) {
  const v = usePageRefreshVersion();
  return <React.Fragment key={v}>{children}</React.Fragment>;
}


const registryDataProvider = {
  getList: async () => ({ data: [] as any[], total: 0 }),
  getOne: async ({ id }: { id: string | number }) => ({ data: { id } as any }),
  create: async () => ({ data: {} as any }),
  update: async () => ({ data: {} as any }),
  deleteOne: async () => ({ data: {} as any }),
  getApiUrl: () => "",
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
        <Refine
          dataProvider={registryDataProvider}
          routerProvider={routerBindings}
          resources={[{ name: "index", list: "/", meta: { label: "案例索引" } }]}
          options={{ syncWithLocation: false, warnWhenUnsavedChanges: false }}
        >
          <Routes>
            {/* ★ 独立认证页：位于 AppShell 之外（无侧边栏 / 无标签栏） */}
            <Route path="/login" element={<AuthLoginPage />} />

            {/* ★ 其余全部路由：包在 AppShell（含 TabsProvider）之内 */}
            <Route
              path="*"
              element={
                <TabsProvider>
                  <LockScreenProvider>
                  <AppShell>
                    {/* ★ 刷新重挂边界：只包业务路由树，AppShell（侧栏/标签栏）在外层，刷新时不动 */}
                    <RefreshableRoutes>
                    <Routes>
                      {/* 入口：案例索引 */}
                      <Route path="/" element={<IndexPage />} />

                      {/* 页面案例（各为一个完整可运行页面） */}
                      {/* 空白页：标签全关后的默认兜底页（也是新会话的默认标签） */}
                      <Route path="/blank" element={<BlankCase />} />
                      <Route path="/dashboard" element={<DashboardCase />} />
                      {/* 列表页 · 弹窗式 CRUD：页面实现在 cases/dialog-crud/（本案例自洽目录） */}
                      <Route path="/list" element={<ListCase />} />
                      {/* 列表页 · 页面式 CRUD：页面实现在 cases/page-crud/ 目录；新建/编辑/详情为 hidden 子路由（不进菜单） */}
                      {/* 路由顺序：静态 /list-page/new 必须在动态 /list-page/:id 之前 */}
                      <Route path="/list-page" element={<ListPageCase />} />
                      <Route path="/list-page/new" element={<ProductNewPage />} />
                      <Route path="/list-page/:id/edit" element={<ProductEditPage />} />
                      <Route path="/list-page/:id" element={<ProductDetailPage />} />
                      {/* 表单页：/form 为「全部示例」控件总览（对齐 vue-admin-tpl）；/form/recipe business 业务配方表单作为补充分支 */}
                      <Route path="/form" element={<FormAllCase />} />
                      <Route path="/form/recipe" element={<FormCase />} />
                      <Route path="/table" element={<TableBasicCase />} />
                      <Route path="/table/card" element={<TableCardCase />} />
                      <Route path="/search" element={<SearchDemoCase />} />
                      <Route path="/search/orders" element={<OrderSearchCase />} />
                      <Route path="/plan-flow" element={<PlanFlowCase />} />
                      <Route path="/plan-flow-fit" element={<PlanFlowFitCase />} />
                      <Route path="/detail" element={<DetailCase />} />
                      {/* 详情页 · 表格型：标签列浅灰底的只读描述列表 */}
                      <Route path="/detail-view" element={<DetailViewCase />} />
                      <Route path="/auth" element={<AuthCase />} />
                      <Route path="/error" element={<ErrorCase />} />
                      <Route path="/components" element={<ComponentsCase />} />
                      <Route path="/waterfall" element={<WaterfallCase />} />
                      <Route path="/blocks" element={<BlocksCase />} />

                      {/* 个人中心（顶栏「用户设置 → 个人中心」目标页，对齐 vue-admin-tpl） */}
                      <Route path="/personal/center" element={<PersonalCenterPage />} />

                      {/* 多级菜单示例：示例落地页 + N 个叶子占位页（配置驱动批量生成） */}
                      <Route path="/menu" element={<MenuDemoPage />} />
                      {MENU_LEAVES.map((leaf) => (
                        <Route key={leaf.path} path={leaf.path} element={<MenuPlaceholderPage />} />
                      ))}

                      {/* 兼容旧路径 */}
                      <Route path="/gallery" element={<Navigate to="/components" replace />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </RefreshableRoutes>
                  </AppShell>
                  </LockScreenProvider>
                </TabsProvider>
              }
            />
          </Routes>
          <UnsavedChangesNotifier />
          {/* 标签页标题：页面名复用标签栏映射（resolveTabMeta）→「<页面名> · ShardKit」。
              换掉 refine 的 DocumentTitleHandler —— 它在未配置 title 时把标题写成 "Refine"。 */}
          <AppDocumentTitle />
        </Refine>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
