/**
 * 页面案例：认证页 Auth（居中登录卡 + 表单）
 * ──────────────────────────────────────
 * 整页复用方式：
 *   1. 复制本文件到你的项目 src/pages/Login.tsx
 *   2. 依赖：shadcn {input,button,label,card,separator}
 *   3. 把 handleSubmit 换成你的登录 API；背景氛围光可按品牌改色。
 *
 * 注意：认证页通常独立于后台 Shell（不带侧边栏）。
 *   本页（/auth）是「案例集内部」的浏览态预览；**真正的整页独立认证页见 /login**
 *   —— 位于 AppShell 之外，无侧边栏 / 无标签栏，路由为 /login。
 */
import * as React from "react";
import { Link } from "react-router-dom";
import { Boxes, Lock, Mail, ArrowRight, ExternalLink } from "lucide-react";
import { ContentFrame } from "@/components/ui/content-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AuthPage() {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: 换成你的登录 API，例如 await api.login(email, password)
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div data-testid="auth-case" className="flex flex-col">
      <ContentFrame className="flex min-h-[70vh] flex-col">
      {/* 指向真正的独立认证页（AppShell 之外） */}
      <div
        className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
        data-testid="auth-standalone-banner"
      >
        <span className="text-muted-foreground">
          认证页已独立为整页路由（位于后台框架之外，无侧边栏 / 无标签栏）：
        </span>
        <Link to="/login" data-testid="to-standalone-login">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" /> 打开独立认证页 /login
          </Button>
        </Link>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/4 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <Card className="w-full max-w-sm shadow-none">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 text-white shadow-[0_0_20px_-2px_rgba(99,102,241,0.8)]">
            <Boxes className="h-5 w-5" />
          </div>
          <CardTitle>登录到控制台</CardTitle>
          <CardDescription>输入你的账号以继续</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-8" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">密码</Label>
                <a href="#" className="text-xs text-primary hover:underline">忘记密码？</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-8" required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中…" : <>登录 <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">或</span>
            <Separator className="flex-1" />
          </div>
          <Button variant="outline" className="w-full">使用 SSO 单点登录</Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            还没有账号？<a href="#" className="text-primary hover:underline">申请试用</a>
          </p>
        </CardContent>
      </Card>
      </div>
      </ContentFrame>
    </div>
  );
}
