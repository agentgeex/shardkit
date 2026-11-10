/**
 * 订单查询案例 · mock 数据
 */
export type OrderStatus = "paid" | "pending" | "shipped" | "refund";

export interface Order {
  id: string;
  no: string;
  customer: string;
  channel: string;
  channelLabel: string;
  date: string;
  amount: number;
  status: OrderStatus;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "已支付",
  pending: "待付款",
  shipped: "已发货",
  refund: "已退款",
};

export const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  paid: "default",
  pending: "secondary",
  shipped: "outline",
  refund: "destructive",
};

const CHANNEL_LABEL: Record<string, string> = { web: "官网", app: "App", agent: "代理" };

const CUSTOMERS = ["星海科技", "云图数据", "拓维信息", "容大实业", "恒瑞医药", "青云智造"];
const RAW: Array<Partial<Order> & { date: string; customer: string; amount: number; status: OrderStatus; channel: string }> = [];
const statuses: OrderStatus[] = ["paid", "pending", "shipped", "refund"];
const channels = ["web", "app", "agent"];

// 生成 42 条确定性 mock
for (let i = 0; i < 42; i++) {
  const d = new Date(2026, 8, 1 + (i % 28));
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const ch = channels[i % 3];
  RAW.push({
    date: ymd,
    customer: CUSTOMERS[i % CUSTOMERS.length],
    amount: 1200 + ((i * 733) % 88000),
    status: statuses[i % 4],
    channel: ch,
  });
}

export const ORDERS: Order[] = RAW.map((r, i) => ({
  id: `ord_${i + 1}`,
  no: `ORD-2026-${String(1000 + i)}`,
  customer: r.customer,
  channel: r.channel,
  channelLabel: CHANNEL_LABEL[r.channel] ?? r.channel,
  date: r.date,
  amount: r.amount,
  status: r.status,
}));
