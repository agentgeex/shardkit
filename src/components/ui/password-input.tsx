/**
 * PasswordInput —— 密码输入框（含强度条）
 * ────────────────────────────────────────────────────────────────────────────
 * 对齐 vue-admin-tpl「组件 → 密码输入框」（components/InputPassword）：
 *   · 输入框 + 明文/密文切换（眼睛图标）
 *   · 可选强度条：4 段式（红→橙→黄绿→绿），随密码强度实时填充
 *
 * 强度打分：内置轻量算法（长度 + 字符种类 + 常见弱口令/连续序列惩罚），
 * 不依赖 zxcvbn，score ∈ 0..4；无输入时为 -1（不显示）。
 *
 * 用法：
 *   <PasswordInput value={pwd} onChange={e => setPwd(e.target.value)} />
 *   <PasswordInput value={pwd} onChange={...} strength />
 */
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, type InputProps } from "@/components/ui/input";

const WEAK = [
  "123456", "12345678", "123456789", "password", "qwerty", "111111", "abc123",
  "admin", "admin123", "letmein", "iloveyou", "000000", "666666", "888888",
];

/** 计算密码强度：score 0..4；空串返回 -1 */
export function passwordStrength(pwd: string): number {
  const v = pwd ?? "";
  if (!v) return -1;

  let score = 0;
  const len = v.length;

  // 长度维度
  if (len >= 6) score++;
  if (len >= 10) score++;
  if (len >= 14) score++;

  // 字符种类维度
  const kinds =
    (/[a-z]/.test(v) ? 1 : 0) +
    (/[A-Z]/.test(v) ? 1 : 0) +
    (/[0-9]/.test(v) ? 1 : 0) +
    (/[^a-zA-Z0-9]/.test(v) ? 1 : 0);
  if (kinds >= 2) score++;
  if (kinds >= 3) score++;
  if (kinds >= 4) score++;

  // 惩罚：常见弱口令
  const lower = v.toLowerCase();
  if (WEAK.some((w) => lower.includes(w))) score -= 2;

  // 惩罚：纯重复字符
  if (/^(.)\1+$/.test(v)) score -= 2;

  // 惩罚：连续序列（abc / 123 / qwe）
  if (/(abc|bcd|cde|123|234|345|456|567|678|789|qwe|asd|zxc)/i.test(v)) score -= 1;

  return Math.max(0, Math.min(4, score));
}

const BAR_COLOR = ["bg-red-500", "bg-red-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"];
const BAR_LABEL = ["很弱", "很弱", "一般", "较强", "很强"];

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  /** 是否显示强度条 */
  strength?: boolean;
  "data-testid"?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, strength = false, disabled, value, "data-testid": testId, ...props }, ref) => {
    const [show, setShow] = React.useState(false);
    const val = typeof value === "string" ? value : "";
    const score = strength ? passwordStrength(val) : -1;

    return (
      <div className={cn("w-full", className)} data-testid={testId ?? "password-input"}>
        <div className="relative">
          <Input
            ref={ref}
            type={show ? "text" : "password"}
            value={value}
            disabled={disabled}
            className="pr-9"
            {...props}
            data-testid="password-input-field"
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "隐藏密码" : "显示密码"}
            data-testid="password-input-toggle"
            className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {strength && (
          <div className="mt-2 flex items-center gap-2" data-testid="password-strength">
            <div className="flex h-1.5 flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 rounded-full transition-colors",
                    i <= score ? BAR_COLOR[score] : "bg-muted"
                  )}
                />
              ))}
            </div>
            {score >= 0 && (
              <span
                className={cn(
                  "w-8 shrink-0 text-right text-[11px]",
                  score <= 1 ? "text-red-500" : score === 2 ? "text-amber-500" : "text-emerald-500"
                )}
                data-testid="password-strength-label"
                data-score={score}
              >
                {BAR_LABEL[score]}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
