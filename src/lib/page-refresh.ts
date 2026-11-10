/**
 * lib/page-refresh.ts —— 页面刷新总线（导航栏「刷新」按钮的底座）
 *
 * 问题：中后台最常见的一句抱怨是「我点了刷新没反应」。
 *   根因是 **同路由 navigate 不会重新挂载** —— React 复用组件实例，
 *   不重跑 useEffect、不重取数据，看起来"刷新了"其实什么都没发生。
 *
 * 解法：版本号 + 外部 store 订阅，版本变化时用 `key` 重挂当前页面子树：
 *
 *   [按钮] → refreshPageData() 重取数据 → 成功才 notifyPageRefreshed() → 版本+1
 *          → <RefreshableRoutes key={版本}> 变 key = 当前页重新挂载 = 重新读数据
 *            （RefreshableRoutes 定义在 App.tsx —— 本文件是 .ts，不编 JSX）
 *          → 标签页 / 侧栏 / 滚动位置 / 主题 全部保留（不是 location.reload）
 *
 * 三条纪律：
 *   1. 必须用 `useSyncExternalStore`（React 18 官方订阅外部 store 的方式），
 *      不要手写 `useState + useEffect` —— 并发渲染下会 tearing / 漏更新；
 *   2. 广播必须在「数据确实取回来了」之后，点了就广播 = 页面重挂但数据是旧的；
 *   3. 单个订阅者抛异常要吞掉，一个页面写错不能让整条刷新链挂掉。
 *
 * 规范来源：agentos `webtools/client/src/lib/page-refresh.ts`（commit 4aaac38），
 * 见公告 note_cf70980bb4ed。
 */
import * as React from "react";

let version = 0;
let lastAt = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  lastAt = Date.now();
  for (const fn of [...listeners]) {
    try {
      fn();
    } catch {
      /* 单个订阅者异常不影响其他页面 */
    }
  }
}

export function subscribePageRefresh(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const pageRefreshVersion = () => version;
export const pageRefreshedAt = () => lastAt;

/** 数据已刷新完成 → 广播（由 refreshPageData 在取数成功后调用） */
export function notifyPageRefreshed(): void {
  emit();
}

/** 当前版本号：变化即触发重渲 / 重挂 */
export function usePageRefreshVersion(): number {
  return React.useSyncExternalStore(subscribePageRefresh, pageRefreshVersion, pageRefreshVersion);
}

/** 页面侧：刷新发生时执行自定义逻辑（不重挂页面）——给不能丢内部状态的页用 */
export function usePageRefreshed(fn: () => void): void {
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => subscribePageRefresh(() => ref.current()), []);
}
