/** mock 数据 —— 页面案例的演示数据（改这里即可换成你自己的数据/接口） */

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "error";
  model: string;
  tasks: number;
  tokens: number;
}

export const agents: Agent[] = [
  { id: "agt_001", name: "选题猎手", role: "worker", status: "online", model: "gpt-4o", tasks: 128, tokens: 42100 },
  { id: "agt_002", name: "文案生成器", role: "worker", status: "online", model: "claude-3.5", tasks: 96, tokens: 88200 },
  { id: "agt_003", name: "海外渠道运营", role: "project_manager", status: "online", model: "deepseek-reasoner", tasks: 54, tokens: 21030 },
  { id: "agt_004", name: "合规审核", role: "worker", status: "error", model: "gpt-4o-mini", tasks: 12, tokens: 5400 },
  { id: "agt_005", name: "数据清洗", role: "worker", status: "offline", model: "qwen-max", tasks: 301, tokens: 156000 },
  { id: "agt_006", name: "投放优化", role: "worker", status: "online", model: "glm-4", tasks: 77, tokens: 33120 },
];

export interface Run {
  id: string;
  agent: string;
  recipe: string;
  status: "succeeded" | "failed" | "running";
  startedAt: string;
  duration: string;
}

export const runs: Run[] = [
  { id: "run_9001", agent: "选题猎手", recipe: "每日选题生成", status: "succeeded", startedAt: "09:12", duration: "42s" },
  { id: "run_9002", agent: "文案生成器", recipe: "商品文案批量生成", status: "running", startedAt: "09:20", duration: "3m" },
  { id: "run_9003", agent: "合规审核", recipe: "文案合规检查", status: "failed", startedAt: "09:22", duration: "8s" },
  { id: "run_9004", agent: "投放优化", recipe: "广告出价调优", status: "succeeded", startedAt: "08:55", duration: "1m12s" },
  { id: "run_9005", agent: "数据清洗", recipe: "类目数据去重", status: "succeeded", startedAt: "08:40", duration: "5m01s" },
];

export const trendData = [
  { date: "09-10", runs: 18, tokens: 12400 },
  { date: "09-11", runs: 22, tokens: 15100 },
  { date: "09-12", runs: 19, tokens: 13900 },
  { date: "09-13", runs: 27, tokens: 19800 },
  { date: "09-14", runs: 24, tokens: 17600 },
  { date: "09-15", runs: 30, tokens: 22100 },
  { date: "09-16", runs: 26, tokens: 17400 },
];

export const roleDistribution = [
  { name: "worker", value: 4 },
  { name: "project_manager", value: 1 },
  { name: "host_manager", value: 1 },
];

export interface Product {
  id: string;
  hs6: string;
  name: string;
  category: string;
  platform: string;
  price: number;
  status: "active" | "draft" | "offline";
  updatedAt: string;
}

export const products: Product[] = [
  { id: "P-1001", hs6: "8517.12", name: "无线蓝牙耳机 Pro", category: "消费电子", platform: "Amazon", price: 39.9, status: "active", updatedAt: "2026-09-15" },
  { id: "P-1002", hs6: "9405.21", name: "LED 桌面氛围灯", category: "家居照明", platform: "Shopee", price: 15.5, status: "active", updatedAt: "2026-09-14" },
  { id: "P-1003", hs6: "6109.10", name: "纯棉圆领 T 恤", category: "服饰", platform: "TikTok Shop", price: 8.8, status: "draft", updatedAt: "2026-09-16" },
  { id: "P-1004", hs6: "3304.99", name: "补水保湿精华液", category: "美妆个护", platform: "Amazon", price: 22.0, status: "active", updatedAt: "2026-09-12" },
  { id: "P-1005", hs6: "9503.00", name: "儿童益智积木", category: "玩具", platform: "eBay", price: 12.3, status: "offline", updatedAt: "2026-09-10" },
  { id: "P-1006", hs6: "8471.30", name: "便携式笔记本电脑支架", category: "办公用品", platform: "Amazon", price: 18.6, status: "active", updatedAt: "2026-09-15" },
  { id: "P-1007", hs6: "4202.92", name: "防泼水双肩背包", category: "箱包", platform: "Shopee", price: 27.9, status: "active", updatedAt: "2026-09-13" },
  { id: "P-1008", hs6: "8518.30", name: "头戴式降噪耳机", category: "消费电子", platform: "Amazon", price: 59.0, status: "draft", updatedAt: "2026-09-16" },
];
