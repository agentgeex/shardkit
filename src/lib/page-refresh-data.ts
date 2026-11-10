/**
 * lib/page-refresh-data.ts —— `refreshPageData()`：刷新的**唯一入口**。
 *
 * 规范要求（agentos `providers/*.ts` 的同位职责）：
 *   · 重拉数据 → **成功才广播**（失败广播会让页面重挂却显示旧数据，比不刷新更困惑）
 *   · 失败不许静默，把结果原样返回，让按钮侧给明确文案
 *
 * ShardKit 没有 BFF，数据有两类来源，两类都要覆盖：
 *   ① React Query 缓存（Refine 的 useList / useOne 等）→ invalidateQueries 重取
 *   ② 页面自己 fetch 的静态 JSON（如 /plan_exports/*.graph.json）
 *      → 用 `dataVersion` 做缓存穿透号，订阅方据此重取
 */
import { notifyPageRefreshed, pageRefreshVersion } from "./page-refresh";
import { queryClient } from "./query-client";

export interface RefreshResult {
  ok: boolean;
  /** 401 / UNAUTHENTICATED 时为 true —— 按钮侧要提示「登录已过期」 */
  authRequired?: boolean;
  code?: string;
  status?: number;
  /** 本次刷新覆盖到的查询数（验收用：证明真的做了事，不是"只转了个圈"） */
  queries?: number;
  at?: number;
}

/** 静态 JSON 的缓存穿透号：每次刷新 +1，页面把它拼到 fetch url 上 */
let dataVersion = 0;
export const getDataVersion = () => dataVersion;

/**
 * 重取当前页数据。
 * ★ 只有成功才广播 —— 这是整套机制里最容易写错的一条。
 */
export async function refreshPageData(): Promise<RefreshResult> {
  try {
    const active = queryClient
      .getQueryCache()
      .getAll()
      .filter((q) => q.getObserversCount() > 0);

    await queryClient.invalidateQueries();

    dataVersion += 1;
    const at = Date.now();
    notifyPageRefreshed();

    return { ok: true, queries: active.length, at };
  } catch (e: unknown) {
    const status = (e as { status?: number })?.status;
    const raw = String((e as Error)?.message ?? e);
    const authRequired = status === 401 || /UNAUTHENTICATED|401/.test(raw);
    return {
      ok: false,
      authRequired,
      status,
      code: authRequired ? "UNAUTHENTICATED" : raw,
    };
  }
}

/** 当前刷新版本号（页面订阅用；变化即应重取自己的静态数据） */
export { pageRefreshVersion };
