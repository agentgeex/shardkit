# ShardKit 项目使用手册（面向未来的 Agent / 开发者）

> **用法速查 + 工程约定**。目标读者：接手本项目的**未来 Agent** 或人类开发者。
> 与 [`architecture.md`](./architecture.md)（架构/后端）、[`api-contract-draft.md`](./api-contract-draft.md)（接口契约）配套。
>
> 维护者：win_ui_lead　最后更新：2026-09-29

---

## 0. TL;DR（30 秒上手）

```bash
cd ~/shardkit
npm install
npm run dev          # → http://localhost:5178
npx tsc --noEmit     # 类型检查必须 TSC=0
npm run build        # 生产构建
```

- **这是什么**：一个**可检索、可预览的 UI 组件 + 成品页面案例集**（"活样板间"），**纯前端 SPA**。
- **技术栈**：React 18 + **Refine (headless)** + React Router 6 + **Tailwind** + **shadcn/ui** + TanStack Query + i18next。
- **消费方式**：**copy-in** —— 从本仓**复制源码**到目标项目，**不作为 npm 依赖安装**。
- **数据现状**：全部来自**前端内存 mock**；生产环境**切后端地址**即成（见 `architecture.md` §3）。

---

## 1. 目录地图（Where things live）

```
ui_component_library/
├── src/
│   ├── pages/                   页面
│   │   ├── index-page.tsx       案例索引（首页 /）
│   │   ├── auth-login.tsx       独立登录页（AppShell 之外）
│   │   ├── personal-center.tsx  个人中心
│   │   ├── menu-demo.tsx        多级菜单示例
│   │   └── cases/               ★ 各「成品页面案例」
│   │       ├── dashboard.tsx        仪表盘
│   │       ├── dialog-crud/         列表页·弹窗式 CRUD（自洽目录，零共享）
│   │       ├── page-crud/           列表页·页面式 CRUD（含 new/edit/detail）
│   │       ├── table/{basic,card}.tsx   表格页
│   │       ├── search.tsx / search-orders.tsx  查询页
│   │       ├── form.tsx / form-all.tsx          表单页
│   │       ├── detail.tsx / auth.tsx / error.tsx / blocks.tsx
│   │       ├── components.tsx       控件展厅
│   │       └── waterfall.tsx        瀑布流
│   ├── components/
│   │   ├── ui/                  ★ shadcn 原语 + 业务组件（40+）
│   │   │   ├── button/input/label/select/checkbox/radio-group/switch …
│   │   │   ├── table/pagination/card/badge/separator/progress/skeleton
│   │   │   ├── dialog/popover/tooltip/toast/dropdown
│   │   │   ├── date-picker/calendar/time-picker/input-number
│   │   │   ├── cascader/combobox/tree-select/transfer/input-tag/upload
│   │   │   ├── rich-text-editor.tsx (Tiptap)  markdown-editor.tsx
│   │   │   ├── password-input.tsx  form-field.tsx  waterfall.tsx
│   │   │   └── …
│   │   ├── shell.tsx            AppShell（侧边栏 + 顶栏 + 标签栏 + 页脚）
│   │   ├── tabs/                多窗口工作区标签（TabBar / TabsContext / tab-meta）
│   │   ├── page-header.tsx      页面标题组件
│   │   ├── multi-level-menu/    多级菜单
│   │   └── lock-screen/         锁屏
│   ├── lib/
│   │   ├── cases.ts             ★ 案例目录（单一事实源，驱动导航 + 索引）
│   │   ├── menu-tree.ts         多级菜单树
│   │   ├── registry.ts          组件注册表读取层
│   │   └── utils.ts             cn() 等工具
│   ├── mock/data.ts             ★ 演示数据（agents / runs / products / trend …）
│   ├── providers/               ★ 空目录：未来放 DataProvider / AuthProvider
│   ├── i18n/                    ★ 国际化
│   │   ├── index.ts             初始化 + changeLocale + SUPPORTED_LOCALES
│   │   └── locales/{zh-CN,en-US}.ts
│   ├── App.tsx                  路由 + Refine 装配
│   ├── main.tsx                 入口（import i18n）
│   └── index.css                Tailwind + 主题变量
├── registry-items/<id>/         ★ 组件注册条目：meta.json + index.tsx + demo.tsx
├── registry/index.json          构建产物（组件索引）
├── scripts/
│   ├── build-registry.mjs       扫描 registry-items → registry/index.json
│   ├── build-cases.mjs          扫描 cases.ts → public/r/*.json + bundles
│   └── verify_*.mjs             ★ Playwright 校验脚本
├── agent_doc/                   ★ 本文档目录
├── logs/                        测试产物截图/JSON（入库）
└── README.md / CONTRIBUTING.md
```

---

## 2. 核心工作流

### 2.1 新增一个「成品页面案例」

1. 在 `src/pages/cases/<id>.tsx` 写页面（**和真实应用一模一样**，顶部**不带**任何"取用/元数据"UI）。
2. 在 `src/lib/cases.ts` 的 `CASES` 数组加一条定义（`to/id/title/desc/titleEn/descEn/icon/kind/tags/tone`）。
   - **导航 + 案例索引自动出现**（`shell.tsx` / `index-page.tsx` 都读 `CASES`）。
3. 在 `src/App.tsx` 加路由 `<Route path="/<id>" element={<XxxCase />} />`。
4. （可选）在 `scripts/build-cases.mjs` 的 `CASES` 里登记，供打包产物生成。

> ⚠️ **单一事实源**：案例的元信息只在 `src/lib/cases.ts` 定义，不要在导航里手写重复。

### 2.2 新增一个「UI 组件（零件）」

1. 建目录 `registry-items/<id>/`：
   - `index.tsx`（源码，复制即用）
   - `demo.tsx`（预览用）
   - `meta.json`（示例见下）
2. 跑 `npm run build:registry` → `registry/index.json` 自动收录（**无需改页面代码**）。
3. 条目出现在「组件」相关列表。

`meta.json` 模板：
```json
{
  "id": "waterfall",
  "name": "瀑布流",
  "category": "03-layout",
  "tags": ["waterfall", "masonry", "layout", "infinite-scroll"],
  "stack": "shardkit",
  "source": "shardkit",
  "complexity": "组件",
  "scene": ["画廊", "图片流", "信息流"],
  "status": "可用",
  "usability": "开箱可用",
  "deps": [],
  "installCmd": "",
  "targetDir": "src/components/ui"
}
```
分类取值（`src/lib/registry.ts`）：`01-basic` 基础元素 / `02-form` 表单 / `03-layout` 布局 /
`04-navigation` 导航 / `05-data-display` 数据展示 / `06-feedback` 反馈 / `07-overlay` 浮层 / `08-advanced` 高级。

### 2.3 copy-in：把本仓资产搬进你的项目

- **最小可复制单元** = 一个 `registry-items/<id>/` 目录（源码 + demo + meta）。
- 按 `meta.json` 的 `deps` 装依赖，把 `index.tsx` 复制到 `targetDir`。
- **无需**把整个 ShardKit 装成依赖。

---

## 3. 工程约定（Team conventions）

### 3.1 校验流程（改代码后必走）
```bash
npx tsc --noEmit                    # 必须 TSC=0
npm run dev                         # 起 dev（5178）
node scripts/verify_<feature>.mjs   # 新功能必配一个校验脚本
# 全回归：把 scripts/verify_*.mjs 逐个跑，末行必须 ALL PASS
```
- 校验脚本约定：Playwright 驱动，逐条 `[PASS]/[FAIL]`，末行 `ALL PASS` / `SOME FAIL`，退出码 0/1。
- **本项目的滚动容器是 `<main>`（AppShell 内容区），不是 `window`** ——
  测试滚动要 `document.querySelector('main').scrollBy(...)`。

### 3.2 代码风格
- **Schema 驱动**：能用 `cases.ts` / `registry-items` 配置生成的，不手写重复 CRUD。
- **成熟组件优先**：Refine / Tailwind / shadcn，**不手写重复 CSS**。
- **响应式**：用 `sm:` 降级，小屏单列。
- **共享原语改动一次性全站生效**；**演示能力只放演示层**。

### 3.3 图标（见 README「图标方案约定」）
- **首选 `lucide-react`**（本地 SVG，运行时**零联网**）。
- 跨库才引 `@iconify/react`，**必须配 `@iconify-json/<set>` 离线模式**，**禁止**默认在线 API。
- 挑图标：<https://lucide.dev/icons/>；跨库浏览：<https://icon-sets.iconify.design/>。

### 3.4 国际化（见 README「国际化约定」）
- 语言：**zh-CN（默认）+ en-US**，**不做繁体**。
- 只翻**框架层**（导航/标签栏/页面标题/公共按钮/页脚/用户菜单）；
  **业务示例文案保持中文**（案例卡 tag、demo 菜单树、案例页内业务文案）。
- 加文案：`src/i18n/locales/zh-CN.ts` 与 `en-US.ts` 的**同名命名空间**各加一条（key 严格一致）→ 组件 `t("ns.key")`。
- 案例标题/描述走 `src/lib/cases.ts` 的 `titleEn/descEn` + `caseTitle/caseDesc(c, lang)`。

### 3.5 Git 提交信息格式
```
style(表单): ...     feat(组件): ...     fix(组件): ...
revert(表单): ...    docs(规范): ...     feat(i18n): ...
```
- 提交前：`git checkout -- logs/` 还原回归产生的 byte-diff 噪声；**只 `git add` 新增/有效的图**。
- 远程：`github.com:agentgeex/shardkit.git`（分支 `main`）。

### 3.6 资源零联网原则
- 图标、语言包、示例图（内联 SVG data-URI）**全部打进 bundle**，运行时**无外网请求**（内网/离线可跑）。

### 3.7 表单字体与排布（详见 [`表单字体与排布规范.md`](./表单字体与排布规范.md)）
- **标签与输入内容同字号（14px）**，层级只靠字重：标签 `text-sm font-medium`、输入框 `text-sm`。
- **不要**给 `Input` 加 `text-base` / `text-lg` / `font-medium`；**不要**给 `Label` 加 `text-lg`。
- 排布一律用原语 `FormRow` / `FormGrid` / `FormField`（`src/components/ui/form-field.tsx`）：标签右对齐、列宽固定 `8em`、间距 `gap-3`、窄屏自动上下。
- 参考页面：`/form`（`src/pages/cases/form-all.tsx`）。

### 3.8 布局四区与台面层次（详见 [`布局与台面层次规范.md`](./布局与台面层次规范.md)）
- 外壳四区必须能一眼分出：**A 品牌条 + C 菜单区 = `bg-chrome`（深色 #001529）；B 顶栏/标签栏 + 卡片 = `bg-card`（白）；D 主区 = `bg-background`（灰画布）**。
- **页写页面不自带底色**，内容一律包 `Card`；区域分界用 `border-strong`，常规分界用 `border`。
- 禁止：`--card` 与 `--background` 同值、外壳用半透明 `bg-card/60`、全屏模糊光斑。
- 校验：`node scripts/verify_surfaces.mjs`（末行 `ALL PASS`）。

---

## 4. 数据交互：从 mock 切到真实后端

> 详见 [`architecture.md`](./architecture.md) §3 与 [`api-contract-draft.md`](./api-contract-draft.md)。

**现状**：数据来自 `src/mock/data.ts` 与各案例私有 `productStore.ts`（内存 store，`useSyncExternalStore` 订阅）。
`src/App.tsx` 的 `registryDataProvider` 是**空桩**（返回空数据），`src/providers/` **空目录** —— 都是留给后端的插槽。

**切换步骤（页面代码零改动）**：
1. 在 `src/providers/` 建 `dataProvider.ts`（如 `@refinedev/simple-rest` 包 `VITE_API_URL`）与 `authProvider.ts`。
2. `src/App.tsx` 把 `registryDataProvider` 换成真实 `dataProvider`，加 `authProvider` + `resources`。
3. 部署时注入环境变量 `VITE_API_URL=https://api.win3.internal/v1`。

> ⚠️ **前端永远不直连 MySQL / Redis**；只对 BFF 的 REST 接口说话。

---

## 5. 常见任务速查（Cookbook）

| 我要… | 怎么做 |
|------|--------|
| 加一个页面案例 | `src/pages/cases/x.tsx` + `cases.ts` 加条目 + `App.tsx` 加路由 |
| 加一个 UI 零件 | `registry-items/<id>/`（meta+index+demo）→ `npm run build:registry` |
| 加一个可翻文案 | 两个 locale 文件同名命名空间各加一条 → 组件 `t()` |
| 加一个案例英文名 | `cases.ts` 里该案例加 `titleEn` / `descEn` |
| 接后端 | 见 §4（换 DataProvider + `VITE_API_URL`）|
| 起服务 | `npm run dev`（5178）/ `npm run preview`（4178）|
| 校验 | `npx tsc --noEmit` + 跑 `scripts/verify_*.mjs`（须 ALL PASS）|

---

## 6. 关联文档

| 文档 | 内容 |
|------|------|
| [`README.md`](../README.md) | 项目定位 / 核心机制 / 图标方案 / 国际化约定 |
| [`表单字体与排布规范.md`](./表单字体与排布规范.md) | 表单标签/输入框字号字重 + 左右式排布 + 常见反例 |
| [`布局与台面层次规范.md`](./布局与台面层次规范.md) | 外壳 A/B/C/D 四区对比 + 台面令牌 + 实测对比度 |
| [`图标撞图检测.md`](./图标撞图检测.md) | 图标查重判据 + `scripts/detect_collision.py` 用法（同一屏作用域） |
| [`Dialog-弹窗使用规范.md`](./Dialog-弹窗使用规范.md) | 弹窗头/体/尾三段式，仅正文滚动 |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | 贡献指南 |
| [`architecture.md`](./architecture.md) | 前后端架构图 / 服务器端选型 / 数据交互 |
| [`api-contract-draft.md`](./api-contract-draft.md) | BFF REST API 契约草案（OpenAPI 骨架）|
