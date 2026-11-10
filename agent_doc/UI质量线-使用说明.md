# UI 质量线 · 使用说明

> 目的：把「界面显廉价」的主观问题，变成**可执行、可回归**的两道自动闸 —— 让每个 PR 都过线。
> 状态：2026-10-16 建立（含脚本、预算文件、视觉基线）。维护：win_ui_lead。

---

## 0. 两道闸（总览）

| 闸 | 脚本 | 拦什么 | 退出码 |
|---|---|---|---|
| ① 静态规则闸 | `node scripts/check-ui-rules.mjs` | 原生色板 / 任意 z / `h-screen` / `space-*` **新增** | 超预算 → 1 |
| ② 视觉基线闸 | `node scripts/visual-baseline.mjs compare` | 关键路由的**视觉回归** + 控制台错误 | 有变化/错误 → 1 |

理念：**存量不挡路，只拦新增**。基线（预算）随修复**只降不升**（棘轮）。

---

## 1. 静态规则闸

### 用法
```bash
node scripts/check-ui-rules.mjs            # 检查（CI / 提交前）
node scripts/check-ui-rules.mjs --update   # 仅当你"降低"了存量后，刷新预算
```
预算文件：`ui-quality-budget.json`。实际计数 **> 预算** 即失败。

### 规则与依据
| key | 规则 | 依据 |
|---|---|---|
| `rawPalette` | 禁 `bg/text/border/ring-<色板>-<数字>` | shadcn《styling》「No raw color values」+ baseline-ui |
| `zArbitrary` | 禁 `z-[999]` 等任意值 | baseline-ui「fixed z-index scale」 |
| `hScreen` | 禁 `h-screen`（用 `h-dvh`） | baseline-ui「NEVER use h-screen」 |
| `spaceXY` | 禁新增 `space-x/y-*`（用 `gap-*`） | baseline-ui「flex 换行失效」 |

### 当前基线（2026-10-16 初始）
```
rawPalette 119 | zArbitrary 2 | hScreen 2 | spaceXY 89
```

### 棘轮工作法
修掉一批 → `--update` 下调数字 → 数字只降不升；CI 上永远跑**不加 update** 的版本。

---

## 2. 视觉基线闸（Playwright）

### 用法
```bash
# 需先起 dev server（默认 http://localhost:5178）
node scripts/visual-baseline.mjs capture    # 采集/刷新基线 → shots/
node scripts/visual-baseline.mjs compare    # 与基线比对
BASE_URL=http://localhost:xxxx node scripts/visual-baseline.mjs capture   # 指定地址
```
- 产物：`shots/<route>.png` + `shots/_report.json`（含 sha256 与控制台错误数）。
- `capture` 有控制台错误 → 退出 1；`compare` 有视觉变化或错误 → 退出 1。
- 关键路由清单在脚本顶部 `ROUTES`（当前：`/`、`/plan-flow`），按需增删。

> ⚠️ **`shots/` 必须入库，不能写进 `.gitignore`** —— 它就是基线本身。
> 忽略掉等于每次 clone 都没有基线可比，这道闸直接废掉。

> 说明：`compare` 用**内容哈希**判「是否变化」（变更探测器），非像素级 diff —— 足以在 PR 上提示"这里动了，请人工确认"。

#### 确定性的三道处理（2026-10-28 补）

哈希闸最容易死在"永远红"上 —— 不是页面变了，是渲染噪声。已做三层处理：

1. **截图关动画**：`page.screenshot({ animations: "disabled" })`。
   含 `animate-pulse` 的页面（`/plan-flow` 的当前节点、运行中状态点）否则每次截图都落在
   动画的不同相位，哈希必然不同。
2. **屏蔽零信息量浮层**：`ROUTES` 支持 `mask: [选择器]`，`/plan-flow` 屏蔽
   `.react-flow__minimap` 与 `.react-flow__attribution`（随视口 transform 亚像素重绘）。
3. **视口吸附整数**：`/plan-flow` 的 `fitView` 算出的位移是小数（实测 `120.208`），
   亚像素渲染会让抗锯齿噪点每次都不同 → 动画结束后把 x/y `Math.round`。

#### 残留噪声的容忍（阈值写死在脚本里）

即使做到上面三点，CSS 渐变 + 圆角在亚像素位置上仍会有十几像素抖动
（实测：用户头像的 28px 圆 + 渐变，两次截图差 **21 像素、最大通道差 28**，肉眼为零，哈希却完全不同）。

`compare` 发现哈希不同时，会再走一次像素判定（PIL），**三者同时满足**才判「一致（噪声已忽略）」：

| 条件 | 阈值 |
|---|---|
| 差异像素数 | ≤ 200 |
| 最大通道差 | ≤ 40 |
| 差异像素占比 | ≤ 0.1% |

任一不满足 → 判真变化。`python3` / PIL 不可用 → **退回严格哈希**（宁严不松）。

> 输出会明确区分三种结果，不静默放过：
> `✅ 一致` / `✅ 一致（亚像素噪声 21px / 最大通道差 28，已忽略）` / `⚠️ 视觉变化（差异 N px）`。

---

## 3. PR / 提交自检流程

```bash
npx tsc -b                              # ① 类型
node scripts/check-ui-rules.mjs         # ② 规则闸
npm run build:meta && npx vite build    # ③ 构建冒烟
node scripts/visual-baseline.mjs compare # ④ 视觉回归（需 dev server）
```
四条全绿 → 再提交。

---

## 4. 与 skill `baseline-ui` 的映射

`~/.agents/skills/baseline-ui` 是逐条可执行硬约束。本质量线覆盖其中**可静态检测**的部分；其余（动效 ≤200ms、只动 transform/opacity、空态有下一步等）属**人工/评审**项，建议对照该 skill 走查。已在本框架落地的对应项：

- ✅ 弹层动效（`tailwindcss-animate` 已装，`animate-in/out` 生效）
- ✅ `prefers-reduced-motion` 全局降级
- ✅ 统一 `EmptyState` 组件（`src/components/ui/empty-state.tsx`）
- ✅ 状态语义色 `success/warning/info`（Badge 已切）
- ✅ 字阶 / 阴影 / z 标尺令牌
- ⏳ 存量：原生色板 119 / `space-*` 89 / `h-screen` 2（见 §1 棘轮）

---

## 5. 后续

- 接入 CI（`.github/workflows` 或 Gitee Go）：`tsc -b` + 规则闸 + 视觉基线。
- 视觉基线扩展到更多关键路由（表格 / 表单 / 查询 / 详情）。
- 每修一批存量，跑 `--update` 收紧预算。
