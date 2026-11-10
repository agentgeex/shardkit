/**
 * 自定义节点：计划步骤卡（StepNode）
 * ──────────────────────────────────────────────────────────────
 * 两级视觉（2026-10-27 第二档）：
 *   父任务（容器）  240×92 · 2px 实描边 · 标题加粗 · 右上「N 子」可折叠徽标
 *   子任务（从属）  200×92 · 1px 淡描边 · 底色下沉一档 · 标题常规 · 无徽标
 * 父与子的「管着 / 被管」不再只靠位置暗示，卡片本身就分得出层级。
 *
 * ── 两类连接口 ────────────────────────────────────────────────
 *   next-in  ← 左  时序：上一个主链步推进过来
 *   next-out → 右  时序：推进到下一个主链步
 *   struct-in ← 上 结构：我是某个父任务的子任务
 *   struct-out↓ 下 结构：我下面挂着 N 个子任务
 * 「先后」走水平通道、「包含」走垂直通道，两类关系方向可分。
 *
 * 折叠：父节点徽标即开关（默认全部展开）。折叠时隐藏整棵子树，
 *       父卡换成虚线边框 + 右向箭头，表示「里面还有东西，只是收起」。
 */
import * as React from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Layers, Workflow, Clock, Bot, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_COLOR, type StepNodeData } from "./adapter";
import { STATUS_LABEL } from "./mock";

export function StepNode({ data, selected }: NodeProps<Node<StepNodeData>>) {
  const { step, status, isHierarchy, childCount, isChild, collapsed, onToggleCollapse, active, done } = data;
  const c = STATUS_COLOR[status];
  const hasKids = (childCount ?? 0) > 0;

  return (
    <div
      data-active={active ? "1" : undefined}
      data-parent={hasKids ? "1" : undefined}
      data-child={isChild ? "1" : undefined}
      data-collapsed={collapsed ? "1" : undefined}
      className={cn(
        "relative flex h-[92px] flex-col rounded-lg bg-card px-3 py-2.5 transition-all duration-200",
        // ── 父 / 子 两级视觉 ──
        isChild
          ? "w-[200px] border-border bg-background pl-4 shadow-none"
          : "w-[240px] border-2 pl-4 shadow-sm",
        !isChild && !hasKids && c.ring,
        hasKids && "border-foreground/25",
        hasKids && collapsed && "border-dashed border-border",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        status === "running" && !active && "shadow-md",
        done && !active && "border-emerald-500/70",
        active &&
          "border-[3px] border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.25),0_8px_24px_-4px_rgba(239,68,68,0.5)] animate-[pulse_1.6s_ease-in-out_infinite]"
      )}
    >
      {/* 层级色条：父=主色粗条（强锚点），子=淡细条（从属） */}
      {hasKids && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r bg-primary/70" aria-hidden />}
      {isChild && <span className="absolute inset-y-3 left-0 w-[2px] rounded-r bg-foreground/20" aria-hidden />}

      {/* 时序通道：主链推进（水平） */}
      <Handle id="next-in" type="target" position={Position.Left} className="!h-2 !w-2 !bg-muted-foreground" />
      {/* 结构通道：父子归属（垂直） */}
      <Handle id="struct-in" type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            active ? "bg-red-500 animate-pulse" : c.dot,
            !active && status === "running" && "animate-pulse"
          )}
        />
        <span className={cn("truncate", isChild ? "text-[13px] font-medium" : "text-sm font-semibold")}>
          {step.label ?? step.run_uuid}
        </span>

        {hasKids ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse?.(step.run_uuid);
            }}
            title={collapsed ? "展开子任务" : "折叠子任务"}
            className={cn(
              "nodrag ml-auto flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors",
              collapsed
                ? "bg-foreground/10 text-foreground/70 hover:bg-foreground/20"
                : "bg-foreground/10 text-foreground/80 hover:bg-foreground/20"
            )}
          >
            <Layers className="h-3 w-3" />
            {childCount} 子
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", collapsed && "-rotate-90")} />
          </button>
        ) : (
          !isChild && isHierarchy && <Layers className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />
        )}
      </div>

      <div className={cn("mt-1.5 flex-1 space-y-0.5 text-[11px] text-muted-foreground", isChild && "text-[10.5px]")}>
        <div className="flex items-center gap-1">
          <Bot className="h-3 w-3 shrink-0" />
          <span className="truncate">{step.agent_id}</span>
        </div>
        <div className="flex items-center gap-1">
          <Workflow className="h-3 w-3 shrink-0" />
          <span className="truncate">{step.run_uuid}</span>
        </div>
        {step.scheduled_at && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{step.scheduled_at.slice(5, 16)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-medium",
            isChild ? "text-[10.5px]" : "text-[11px]",
            active ? "text-red-500" : c.text
          )}
        >
          {active ? "执行中…" : STATUS_LABEL[status]}
        </span>
        {hasKids && collapsed && (
          <span className="text-[10px] text-muted-foreground">已折叠</span>
        )}
      </div>

      <Handle id="next-out" type="source" position={Position.Right} className="!h-2 !w-2 !bg-muted-foreground" />
      <Handle id="struct-out" type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-muted-foreground/40" />
    </div>
  );
}
