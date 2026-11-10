/**
 * 个人中心（/personal/center）—— 对齐 vue-admin-tpl「PersonalCenter」
 * ────────────────────────────────────────────────────────────────────────────
 * 两块：
 *   左：个人信息卡（头像 + 账号/昵称/手机/邮箱/角色）
 *   右：Tab（基本信息 / 修改密码）
 * 纯前端 demo：保存仅弹 toast，不落库。
 */
import * as React from "react";
import { ContentFrame } from "@/components/ui/content-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";

const ME = {
  username: "demo",
  realName: "Demo User",
  phone: "18888888888",
  email: "user@example.com",
  roles: ["超级管理员"],
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

export default function PersonalCenterPage() {
  const { toast } = useToast();
  const [active, setActive] = React.useState("basic");

  // 基本信息
  const [realName, setRealName] = React.useState(ME.realName);
  const [phone, setPhone] = React.useState(ME.phone);
  const [email, setEmail] = React.useState(ME.email);

  // 修改密码
  const [pwd, setPwd] = React.useState("");
  const [npwd, setNpwd] = React.useState("");
  const [npwd2, setNpwd2] = React.useState("");
  const [pwdErr, setPwdErr] = React.useState("");

  const saveBasic = () => {
    if (!realName.trim()) return toast({ title: "昵称不能为空", variant: "destructive" });
    toast({ title: "修改成功", description: "基本信息已保存", variant: "success" });
  };

  const savePwd = () => {
    if (!pwd || !npwd || !npwd2) {
      setPwdErr("请填写完整");
      return;
    }
    if (npwd !== npwd2) {
      setPwdErr("新密码与确认新密码不一致");
      return;
    }
    setPwdErr("");
    setPwd("");
    setNpwd("");
    setNpwd2("");
    toast({ title: "修改成功", description: "密码已更新", variant: "success" });
  };

  return (
    <div data-testid="personal-center" className="flex flex-col gap-2">
      {/* 个人中心 = 详情型：保留页头（实体身份），改为 inline 单行 */}
      <div className="mb-0 flex flex-wrap items-end gap-x-3 gap-y-1">
        <h1 className="text-xl font-semibold tracking-tight">个人中心</h1>
        <p className="text-sm text-muted-foreground">管理你的账号信息与登录密码</p>
      </div>

      <ContentFrame padding={5}>
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* 个人信息卡 */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">个人信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center py-2">
              <div
                data-testid="pc-avatar"
                className="group relative flex h-[120px] w-[120px] cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 text-4xl font-semibold text-white"
                title="点击更换头像（demo）"
              >
                F
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-3xl opacity-0 transition-opacity group-hover:opacity-100">
                  +
                </span>
              </div>
            </div>
            <Separator />
            <InfoRow label="账号">{ME.username}</InfoRow>
            <Separator />
            <InfoRow label="昵称">{ME.realName}</InfoRow>
            <Separator />
            <InfoRow label="手机号码">{ME.phone ?? "-"}</InfoRow>
            <Separator />
            <InfoRow label="用户邮箱">{ME.email ?? "-"}</InfoRow>
            <Separator />
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-muted-foreground">所属角色</span>
              <span className="flex gap-1">
                {ME.roles.map((r) => (
                  <Badge key={r} variant="info">
                    {r}
                  </Badge>
                ))}
              </span>
            </div>
            <Separator />
          </CardContent>
        </Card>

        {/* 基本资料 */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">基本资料</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={active} onValueChange={setActive}>
              <TabsList>
                <TabsTrigger value="basic" data-testid="pc-tab-basic">
                  基本信息
                </TabsTrigger>
                <TabsTrigger value="pwd" data-testid="pc-tab-pwd">
                  修改密码
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="pt-4">
                <div className="max-w-md space-y-4">
                  <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                    <Label htmlFor="pc-name" className="text-right">昵称</Label>
                    <Input id="pc-name" value={realName} onChange={(e) => setRealName(e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                    <Label htmlFor="pc-phone" className="text-right">手机号码</Label>
                    <Input id="pc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                    <Label htmlFor="pc-email" className="text-right">邮箱</Label>
                    <Input id="pc-email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <Button onClick={saveBasic} data-testid="pc-save-basic">
                    保存
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="pwd" className="pt-4">
                <div className="max-w-md space-y-4">
                  <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                    <Label htmlFor="pc-pwd" className="text-right">旧密码</Label>
                    <Input
                      id="pc-pwd"
                      type="password"
                      value={pwd}
                      onChange={(e) => setPwd(e.target.value)}
                      data-testid="pc-pwd"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                    <Label htmlFor="pc-npwd" className="text-right">新密码</Label>
                    <Input
                      id="pc-npwd"
                      type="password"
                      value={npwd}
                      onChange={(e) => setNpwd(e.target.value)}
                      data-testid="pc-npwd"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[8em_1fr] sm:items-center">
                    <Label htmlFor="pc-npwd2" className="text-right">确认新密码</Label>
                    <Input
                      id="pc-npwd2"
                      type="password"
                      value={npwd2}
                      onChange={(e) => setNpwd2(e.target.value)}
                      data-testid="pc-npwd2"
                    />
                  </div>
                  {pwdErr && (
                    <p className="text-sm text-destructive" data-testid="pc-pwd-err">
                      {pwdErr}
                    </p>
                  )}
                  <Button onClick={savePwd} data-testid="pc-save-pwd">
                    确认修改
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      </ContentFrame>
    </div>
  );
}
