import { Badge } from "@/components/ui/badge";

const MAP: Record<string, { variant: "success" | "warning" | "destructive" | "info" | "secondary"; label: string }> = {
  success: { variant: "success", label: "成功" },
  succeeded: { variant: "success", label: "成功" },
  online: { variant: "success", label: "在线" },
  active: { variant: "success", label: "启用" },
  running: { variant: "info", label: "运行中" },
  pending: { variant: "warning", label: "待处理" },
  draft: { variant: "secondary", label: "草稿" },
  offline: { variant: "secondary", label: "离线" },
  failed: { variant: "destructive", label: "失败" },
  error: { variant: "destructive", label: "异常" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = MAP[status] ?? { variant: "secondary" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
