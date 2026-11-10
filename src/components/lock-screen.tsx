/**
 * LockScreen —— 锁屏遮罩（对齐 vue-admin-tpl「LockDialog + LockPage」）
 * ────────────────────────────────────────────────────────────────────────────
 * 流程：
 *   1) 点「锁定屏幕」→ 弹 LockDialog 输入锁定密码
 *   2) 确认后 → 显示全屏锁定层（LockPage），需输入同一密码解锁
 * 纯前端 demo：密码仅保存在组件状态里。
 */
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type LockCtx = {
  /** 弹出「锁定屏幕」密码对话框 */
  requestLock: () => void;
};

const Ctx = React.createContext<LockCtx | null>(null);

export function useLockScreen(): LockCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useLockScreen must be used within <LockScreenProvider>");
  return ctx;
}

export function LockScreenProvider({ children }: { children: React.ReactNode }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [lockPwd, setLockPwd] = React.useState("");
  const [locked, setLocked] = React.useState(false);
  const [unlockInput, setUnlockInput] = React.useState("");
  const [err, setErr] = React.useState("");

  const requestLock = React.useCallback(() => {
    setLockPwd("");
    setDialogOpen(true);
  }, []);

  const confirmLock = () => {
    if (!lockPwd.trim()) {
      setErr("请输入锁定密码");
      return;
    }
    setErr("");
    setDialogOpen(false);
    setLocked(true);
    setUnlockInput("");
  };

  const unlock = () => {
    if (unlockInput === lockPwd) {
      setLocked(false);
      setErr("");
    } else {
      setErr("密码错误，请重试");
    }
  };

  return (
    <Ctx.Provider value={{ requestLock }}>
      {children}

      {/* 锁定密码输入对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="lock-dialog" className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>锁定屏幕</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 text-2xl font-semibold text-white">
                F
              </div>
              <span className="text-sm text-muted-foreground">demo</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lock-pwd">锁屏密码</Label>
              <Input
                id="lock-pwd"
                type="password"
                autoFocus
                value={lockPwd}
                onChange={(e) => setLockPwd(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmLock()}
                data-testid="lock-pwd"
              />
              {err && <p className="text-sm text-destructive">{err}</p>}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={confirmLock} data-testid="lock-confirm">
              锁定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 全屏锁定层 */}
      {locked && (
        <div
          data-testid="lock-page"
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-5 bg-background/95 backdrop-blur-xl"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-fuchsia-500 text-3xl font-semibold text-white">
            F
          </div>
          <span className="text-base font-medium">demo</span>
          <div className="w-64 space-y-2">
            <Input
              type="password"
              autoFocus
              placeholder="请输入锁屏密码解锁"
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
              data-testid="unlock-pwd"
            />
            {err && (
              <p className="text-center text-sm text-destructive" data-testid="unlock-err">
                {err}
              </p>
            )}
            <Button className="w-full" onClick={unlock} data-testid="unlock-btn">
              解锁
            </Button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
