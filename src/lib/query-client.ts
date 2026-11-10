/**
 * lib/query-client.ts —— 唯一的 QueryClient 单例。
 *
 * 抽出来是为了让 `lib/page-refresh-data.ts` 的 `refreshPageData()`
 * 能在组件树之外拿到同一个实例做 `invalidateQueries()`。
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
