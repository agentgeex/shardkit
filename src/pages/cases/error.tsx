/**
 * 页面案例：错误页 Error（404 / 500 / 403 三态示例）
 * ──────────────────────────────────────────────
 * 依赖：仅 shadcn {button} + lucide-react。用 `code` prop 切换 404 / 500 / 403 文案。
 */
import * as React from "react";
import { Link } from "react-router-dom";
import { Home, RotateCcw, ShieldAlert, FileQuestion, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentFrame } from "@/components/ui/content-frame";

const PRESETS = {
  "404": {
    title: "页面不存在",
    desc: "你访问的页面已被移除或从未存在。",
    icon: FileQuestion,
    tone: "text-sky-400",
    bg: "bg-sky-500/10 ring-sky-500/30",
  },
  "500": {
    title: "服务器错误",
    desc: "服务端出了点问题，请稍后重试或联系管理员。",
    icon: ServerCrash,
    tone: "text-destructive",
    bg: "bg-destructive/10 ring-destructive/30",
  },
  "403": {
    title: "无权访问",
    desc: "你没有权限查看该资源，请联系管理员开通。",
    icon: ShieldAlert,
    tone: "text-amber-400",
    bg: "bg-amber-500/10 ring-amber-500/30",
  },
} as const;

export default function ErrorPage() {
  const [code, setCode] = React.useState<keyof typeof PRESETS>("404");
  const p = PRESETS[code];
  const Icon = p.icon;

  return (
    <div data-testid="error-page" className="flex flex-col">
      <ContentFrame className="flex min-h-[60vh] flex-col gap-3">
        {/* 形态切换（原页头 actions；去页头后搬到框内顶部最右，否则功能消失） */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            标准错误状态页：切换下方标签查看 404 / 500 / 403 三种形态
          </p>
          <div className="flex gap-1">
            {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={k === code ? "default" : "secondary"}
                onClick={() => setCode(k)}
              >
                {k}
              </Button>
            ))}
          </div>
        </div>

      <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
        <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${p.bg}`}>
          <Icon className={`h-8 w-8 ${p.tone}`} />
        </div>
        <div className="text-5xl font-bold tracking-tight">{code}</div>
        <h2 className="mt-3 text-lg font-semibold">{p.title}</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{p.desc}</p>
        <div className="mt-6 flex gap-2">
          <Button asChild variant="outline"><Link to="/"><Home className="h-4 w-4" /> 返回首页</Link></Button>
          <Button onClick={() => window.location.reload()}><RotateCcw className="h-4 w-4" /> 重试</Button>
        </div>
      </div>
      </ContentFrame>
    </div>
  );
}
