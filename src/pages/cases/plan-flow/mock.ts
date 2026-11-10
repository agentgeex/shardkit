/**
 * 计划任务流程图 —— Mock 数据
 * ──────────────────────────────────────────────────────────────
 * 严格对齐 docs/PROJECT_MANAGEMENT.md §3.2 的 plan JSON schema：
 *   plan { plan_id, project_id, description, steps[] }
 *   step { run_uuid, task_id, agent_id, instruction,
 *          parent_run_uuid, children[], timeout_seconds, scheduled_at }
 *
 * 覆盖 §3.5 的全部六种拓扑：
 *   模式一 串行流水线 / 模式二 扇出并行 / 模式三 扇入汇聚
 *   模式四 混合拓扑 / 模式五 定时串行 / 模式六 层级计划
 */

export type RunStatus = "draft" | "pending" | "running" | "succeeded" | "failed" | "cancelled";

export interface PlanStep {
  run_uuid: string;
  task_id?: string;
  agent_id: string;
  instruction: string;
  parent_run_uuid?: string | null;
  children?: string[];
  /** 执行顺序前置任务（文档 §1.3）。与 parent_run_uuid 互斥（不可同时设在同一 step） */
  prev_task?: string;
  next_task?: string;
  timeout_seconds?: number;
  scheduled_at?: string;
  /** 运行态（真实场景来自 ao_task_execution.run_status） */
  status?: RunStatus;
  /** 展示名（真实场景可由 task_id 映射任务目录得到） */
  label?: string;
  /** 执行耗时秒（可选） */
  duration_seconds?: number;
}

export interface Plan {
  plan_id: string;
  project_id: string;
  description: string;
  git_branch?: string;
  plan_status?: RunStatus;
  steps: PlanStep[];
}

/* ── 示例一：书籍创作主计划（层级计划 · 模式六；内部混用 扇出/汇聚/串行）── */
export const PLAN_BOOK: Plan = {
  plan_id: "plan_parent_book",
  project_id: "proj_book",
  description: "书籍创作主计划 —— 3 章并行创作（层级计划示例）",
  git_branch: "feat/book-create",
  plan_status: "running",
  steps: [
    {
      run_uuid: "run_deploy_self",
      agent_id: "agt_super_pm",
      instruction: "部署主计划 plan_parent_book 自身",
      children: ["run_deploy_ch01", "run_deploy_ch02", "run_deploy_ch03"],
      status: "succeeded",
      label: "部署主计划",
      timeout_seconds: 1800,
    },
    { run_uuid: "run_deploy_ch01", agent_id: "agt_super_pm", instruction: "为第1章生成创作计划并部署", parent_run_uuid: "run_deploy_self", status: "succeeded", label: "部署·第1章", timeout_seconds: 1800 },
    { run_uuid: "run_deploy_ch02", agent_id: "agt_super_pm", instruction: "为第2章生成创作计划并部署", parent_run_uuid: "run_deploy_self", status: "succeeded", label: "部署·第2章", timeout_seconds: 1800 },
    { run_uuid: "run_deploy_ch03", agent_id: "agt_super_pm", instruction: "为第3章生成创作计划并部署", parent_run_uuid: "run_deploy_self", status: "failed", label: "部署·第3章", timeout_seconds: 1800 },

    { run_uuid: "run_activate_ch01", agent_id: "agt_super_pm", instruction: "激活计划 plan_ch01，等待第1章全部完成", prev_task: "run_deploy_ch01", status: "running", label: "执行·第1章", timeout_seconds: 7200 },
    { run_uuid: "run_activate_ch02", agent_id: "agt_super_pm", instruction: "激活计划 plan_ch02，等待第2章全部完成", prev_task: "run_deploy_ch02", status: "pending", label: "执行·第2章", timeout_seconds: 7200 },
    { run_uuid: "run_activate_ch03", agent_id: "agt_super_pm", instruction: "激活计划 plan_ch03，等待第3章全部完成", prev_task: "run_deploy_ch03", status: "cancelled", label: "执行·第3章", timeout_seconds: 7200 },

    { run_uuid: "run_merge", agent_id: "agt_super_pm", instruction: "合并三章，产出成书（等 3 章全部完成）", parent_run_uuid: "run_deploy_self", prev_task: "run_activate_ch01", status: "pending", label: "合并成书", timeout_seconds: 1800 },
  ],
};

/* ── 示例二：项目创建（混合拓扑 · 模式四 的简化）── */
export const PLAN_PROJECT: Plan = {
  plan_id: "plan_trendyfam_create",
  project_id: "proj_trendyfam",
  description: "创建 trendyfam 项目并部署 Agent 团队（混合拓扑示例）",
  plan_status: "succeeded",
  steps: [
    { run_uuid: "run_project_create", agent_id: "agentos_projectmother", instruction: "创建项目 trendyfam，短视频创作类", children: ["run_agent_create"], status: "succeeded", label: "创建项目", timeout_seconds: 1800 },
    { run_uuid: "run_agent_create", agent_id: "agentos_agentfather", instruction: "为 trendyfam 创建 7 个 Agent", parent_run_uuid: "run_project_create", children: ["run_deploy_admin", "run_deploy_workers"], status: "succeeded", label: "创建 Agent 团队", timeout_seconds: 1800 },
    { run_uuid: "run_deploy_admin", agent_id: "agentos_host", instruction: "部署 agent trendyfam_admin", parent_run_uuid: "run_agent_create", status: "succeeded", label: "部署·管理员", timeout_seconds: 1800 },
    { run_uuid: "run_deploy_workers", agent_id: "agentos_host", instruction: "部署其余 6 个 worker agent", parent_run_uuid: "run_agent_create", status: "succeeded", label: "部署·6 个 worker", timeout_seconds: 600 },
  ],
};

/* ── 示例三：定时串行（模式五）── */
export const PLAN_SCHEDULED: Plan = {
  plan_id: "plan_daily_batch",
  project_id: "proj_stock",
  description: "股票每日批处理（定时串行示例）",
  plan_status: "pending",
  steps: [
    { run_uuid: "run_s1", agent_id: "agt_data", instruction: "拉取行情数据", scheduled_at: "2026-06-17 14:15:00", status: "pending", label: "拉取行情" },
    { run_uuid: "run_s2", agent_id: "agt_data", instruction: "清洗数据", scheduled_at: "2026-06-17 14:17:00", status: "pending", label: "清洗数据" },
    { run_uuid: "run_s3", agent_id: "agt_quant", instruction: "计算指标", scheduled_at: "2026-06-17 14:19:00", status: "pending", label: "计算指标" },
    { run_uuid: "run_s4", agent_id: "agt_quant", instruction: "生成信号", scheduled_at: "2026-06-17 14:21:00", status: "pending", label: "生成信号" },
    { run_uuid: "run_s5", agent_id: "agt_report", instruction: "汇总日报", scheduled_at: "2026-06-17 14:23:00", status: "pending", label: "汇总日报" },
  ],
};

export const PLAN_PRESETS: { key: string; name: string; plan: Plan }[] = [
  { key: "book", name: "书籍创作（层级计划）", plan: PLAN_BOOK },
  { key: "project", name: "项目创建（混合拓扑）", plan: PLAN_PROJECT },
  { key: "scheduled", name: "每日批处理（定时串行）", plan: PLAN_SCHEDULED },
];

export const STATUS_LABEL: Record<RunStatus, string> = {
  draft: "草稿",
  pending: "待执行",
  running: "执行中",
  succeeded: "已完成",
  failed: "失败",
  cancelled: "已取消",
};
