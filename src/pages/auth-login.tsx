/**
 * 独立认证页 AuthLogin（独立路由 /login，位于 AppShell 之外）
 * ────────────────────────────────────────────────────────────────────────────
 * 定位：**整页独立**的登录页 —— 不套用后台 Shell（无侧边栏 / 无工作区标签栏 /
 *       无页头页脚），是全屏自成一体的认证页面。
 *
 * 为什么独立于案例集外壳：
 *   认证页在真实应用里通常是「未登录」时的入口页，先于后台框架出现，
 *   因此本页放在 AppShell 之外，路由为 /login。
 *   案例集内部仍保留一个「认证页」案例卡（/auth，嵌在外壳内便于浏览），
 *   两者共用同一份视觉实现（pages/cases/auth.tsx），避免重复维护。
 *
 * 复用方式：
 *   1. 复制本文件到你的项目 src/pages/Login.tsx
 *   2. 依赖：shadcn {input,button,label,card,separator}
 *   3. 把 handleSubmit 换成你的登录 API；背景氛围光可按品牌改色。
 *   4. 在路由中把本页挂在 AppShell 之外，例如：
 *        <Route path="/login" element={<LoginPage />} />
 *        <Route path="/*" element={<AppShell>…</AppShell>} />
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, Lock, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AuthLoginPage() {
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: 换成你的登录 API，例如 await api.login(email, password)
    setTimeout(() => {
      setLoading(false);
      // 登录成功后进入后台首页（案例索引）
      navigate("/");
    }, 1200);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4">
      {/* 全屏氛围光背景（独立页自带，不依赖 Shell 的背景层） */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[320px] w-[320px] rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <Card className="w-full max-w-sm" data-testid="auth-login-page">
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
            <Button type="submit" className="w-full" data-testid="login-submit" disabled={loading}>
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
  );
}
