# ShardKit 架构说明(前后端 / 数据交互)

> 面向**未来的 Agent 与开发者**。回答三个问题:
> 1 这个项目是什么?2 生产环境服务器端长什么样?3 前端如何接后端(为什么"切个地址"就行)。
>
> 维护者:win_ui_lead 最后更新:2026-09-29

---

## 0. 一句话

ShardKit 是一个**纯前端 SPA**(React + Refine + Tailwind + shadcn),
当前**所有数据来自前端内存 mock**;生产环境**只需把数据层的后端地址接上**,
**页面代码一行都不用改** -- 这是 Refine `DataProvider` 抽象的意义。

> ⚠️ **前端永远不直连 MySQL / Redis。** 浏览器无法使用 MySQL(TCP) / Redis(RESP) 协议,
> 且凭证一旦进 bundle 就会被 F12 扒走。所有数据库/缓存访问都由**服务器端**完成。

---

## 1. 架构总览图

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                   浏览器(客户端)                              │
│                                                                              │
│   ┌──────────────────────────── ShardKit SPA (React) ─────────────────────┐   │
│   │  页面层  src/pages/**        案例页 / 表单 / 表格 / 查询 / 仪表盘 ...      │   │
│   │  组件层  src/components/ui/** shadcn 原语 + 业务组件 (waterfall / RTE...)  │   │
│   │  数据层  src/mock/**  ←── 当前:内存 mock(种子数据,刷新重置)          │   │
│   │          src/providers/** ←── 未来:真实 DataProvider / AuthProvider    │   │
│   │  底座    Refine (headless) + React Router + TanStack Query + i18next    │   │
│   └────────────────────────────────┬────────────────────────────────────────┘   │
│                                    │                                            │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
             1-a HTTPS / REST + JWT(主通道:CRUD / 查询)
             ─────────────────────────────▶  (客户端主动、一问一答)
             1-b WebSocket / SSE(支路:服务端主动推送,按需)
             ◀─────────────────────────────  (状态 / 进度 / 通知 / 日志流)
                                     │
                                     ▼
        ┌────────────────────────────────────────────────────────────┐
        │         Win3 BFF / API 服务(★ 这层要写/部署)               │
        │                                                            │
        │  定位:面向「本前端」定制的门面/聚合层(thin BFF)            │
        │  • 鉴权 (JWT/OAuth)   • 多租户隔离   • 限流 / 配额 / 计费    │
        │  • 审计日志           • 字段裁剪     • 聚合多个内网服务      │
        │  ⚠️ 不重复实现领域逻辑(task/agent/plan 的规则在下游内核)   │
        │                                                            │
        │  推荐框架:FastAPI(贴 Python/MCP 生态)或 NestJS(贴 TS)  │
        └───────┬─────────────────────────────┬──────────────────────┘
                │                             │
     2 MCP / HTTP (SSE 或 stdio)     3 内网私有协议(仅服务器侧)
                │                             │
                ▼                             ▼
   ┌────────────────────────┐     ┌───────────────────────────┐
   │  AgentOS 内核 (Python)  │     │  MySQL(持久化)           │
   │  MCP 工具集 ao_*        │     │  Redis(缓存 / 队列 / 事件)│
   │  (task / agent / plan)│     └───────────────────────────┘
   └────────────────────────┘
```

**关键边界:**

| 层 | 碰 MySQL | 碰 Redis | 对谁说话 |
|----|:---:|:---:|------|
| 浏览器 SPA | ❌ | ❌ | 对 **BFF** 说 REST(主)+ WebSocket/SSE(实时支路)|
| **Win3 BFF** | ✅(经 ORM)| ✅(经 client)| 对内 MCP/HTTP,对外 REST + 实时通道 |
| AgentOS 内核(MCP)| ✅ | ✅ | MCP(SSE/stdio)|

---

## 1.5 通信协议:REST 主干 + WebSocket/SSE 支路

> **BFF 与前端之间不是「只用 WebSocket」。主通道是 REST,WebSocket/SSE 是按需补充的实时支路。**

| 通道 | 协议 | 特征 | 承载 |
|------|------|------|------|
| **主通道** | **HTTP REST** | 客户端主动、一问一答 | 全部 CRUD / 查询(Refine `DataProvider` 打的就是它)-- **90% 流量** |
| **实时支路** | **WebSocket** | 长连接、双向、服务端可主动推 | 真正需要双向的实时光场景 |
| **实时支路** | **SSE**(Server-Sent Events)| HTTP 长连接、**单向**(服务端→前端)| 只推不收的场景:状态/进度/通知/日志流(**多数情况够用且更简单**)|

**什么时候才需要实时支路?** 本项目(AgentOS 商业控制台)的天然实时场景:
- Dashboard 上 **Agent 状态 / 任务执行进度实时刷新**(当前为静态 mock)
- 任务跑完的**通知推送**(后端 Redis 队列 + 事件机制已在)
- 长任务的**日志流**

> 用 REST **轮询**也能做(每隔几秒问一次),但费流量、有延迟;实时支路更合适。
> **选型:**只推不收 → **SSE**(更简单,纯 HTTP);真需双向 → **WebSocket**。

```
BFF
 ├─ /v1/*          REST              ← 主通道:所有 CRUD / 查询(Refine DataProvider)
 └─ /v1/events     SSE(或 /v1/ws WebSocket)← 实时支路:状态推送(按需开)
```

## 2. 服务器端要写什么?(分层回答)

**需要单独写服务器端** -- 即一个 **BFF(Backend-for-Frontend)**,
「**面向本前端定制的门面 / 聚合 / 鉴权层**」。

### ⚠️ 关于「BFF 不是业务后端」的准确表述(重要澄清)

> 早前文档曾写「BFF 非业务后端」,**这个措辞不够严谨,容易误导**。准确说法是:
>
> **BFF 当然承载业务**(鉴权/多租户/计费/审计都是业务职责),
> 但它的定位是「**为某个特定前端定制的门面层**」,而非「通用、可被多方复用的领域中台」。

| 维度 | BFF(门面层)| AgentOS 内核(领域核心)|
|------|------------|----------------------|
| **服务对象** | **一对一**服务某个前端(Win3 控制台)| 通用,被调度方/多 Agent 共用 |
| **承载内容** | 横切业务:鉴权 / 多租户 / 计费 / 审计 / 聚合裁剪 | 领域逻辑:task / agent / plan 的规则 |
| **厚度** | **薄**(thin BFF),只做转发与聚合 | 厚,真正的业务规则所在 |
| **可替换性** | 高(换前端则换 BFF;甚至可退化为网关)| 低(核心资产)|

**为什么强调「不叫通用业务后端」:**
1. **它是「前端专用」的** -- 换一个前端(如 Win3 移动版)就该有它自己的 BFF,不追求通用复用。
2. **领域逻辑在更下游** -- 业务规则(任务怎么调度、Agent 怎么建、权限模型)在 **AgentOS 内核**;
   BFF **不重复实现**领域逻辑。
3. **它可以很薄** -- 把领域逻辑写进 BFF 是**代码坏味的信号**;健康的 BFF 只做「鉴权→聚合→裁剪→转发」。

**一句话:** BFF 是「**前端专用的业务门面**」,承担**横切业务**(鉴权/多租户/计费/聚合);
**领域核心业务**在 AgentOS 内核。

### 2.1 AgentOS 内核层(已有,不用你写)
- 形态:**Python MCP 服务** + **MySQL** + **Redis**
- API 协议:**MCP 本身**(我们天天调的 `ao_get_task` / `ao_dispatch_task` 就是这套)
- 谁用:调度方、各 Agent。**客户前端不直接用它。**

### 2.2 Win3 商业控制台 BFF(★ 要新建的)
面向付费客户的 REST/GraphQL 服务,职责:
1. **鉴权**:登录、JWT 签发/校验、权限(`AuthProvider` 的对接方)
2. **多租户隔离**:客户 A 看不到客户 B 的数据
3. **聚合 & 裁剪**:把多个 MCP 调用合成一个前端友好的响应,隐藏内部字段
4. **配额 / 计费 / 限流 / 审计**:商业产品必须项
5. **对内适配**:通过 MCP 客户端(或内网 HTTP)调 AgentOS 内核

### 2.3 框架选型建议

| 路线 | 框架 | 适合场景 |
|------|------|---------|
| **Python** ⭐ | **FastAPI** | BFF 主要做"聚合 + 鉴权 + 转发 MCP";与 AgentOS 内核同语言,可复用 MCP 客户端与类型,**最顺** |
| **Node/TS** ⭐ | **NestJS** | 团队想前后端同一语言(类型从契约共享到前端);与 Refine 的 `@refinedev/nestjsx-crud` 天然配对 |
| 轻量 | Fastify / Express | 只做纯转发的小 BFF |
| 一体化 | Next.js API Routes | 前端也迁 Next 时(注意 SSR 耦合) |

> 💡 **本项目推荐**:先定 **API 契约(OpenAPI)**,BFF 用 **FastAPI**(贴 Python/MCP 生态)。
> 若团队强 TS 全栈,则 **NestJS**。

---

## 3. 前端如何接后端(为什么"切地址"就行)

Refine 是 **headless** 的:所有数据读写被抽象到一个 **`DataProvider`** 接口。
因此"接后端"= **换一个 DataProvider 实现**,**页面代码零改动**。

当前占位在 `src/App.tsx`(`registryDataProvider` 桩,返回空数据):

```ts
const registryDataProvider = {
  getList:  async () => ({ data: [], total: 0 }),
  getOne:   async ({ id }) => ({ data: { id } }),
  create/update/deleteOne: async () => ({ data: {} }),
  getApiUrl: () => "",
};
```

### 3.1 换成真实后端(示例)

```ts
// src/providers/dataProvider.ts
import { dataProvider as restProvider } from "@refinedev/simple-rest";
export const dataProvider = restProvider(import.meta.env.VITE_API_URL);
//       ↑ 生产地址来自环境变量:VITE_API_URL=https://api.win3.internal/v1
```

```ts
// src/App.tsx
<Refine
  dataProvider={dataProvider}          // ← 从桩换成真实实现
  authProvider={authProvider}          // ← 鉴权(登录/权限/登出)
  resources={[
    { name: "products", list: "/list", create: "/list/new", edit: "/list/:id/edit" },
    { name: "orders",   list: "/search/orders" },
  ]}
/>
```

### 3.2 "切地址"契约
- 前端只认环境变量 **`VITE_API_URL`**(`.env.production` / 部署时注入)。
- 只要 BFF 实现下列 REST 约定,**同一份前端代码可指向 mock / 测试 / 生产任意后端**。

---

## 4. 附录:数据交互相关的工程约定

| 能力 | 落地方式 |
|------|---------|
| 数据读写 | Refine `DataProvider`(getList/getOne/create/update/deleteOne...)|
| 鉴权 | Refine `AuthProvider`(login/logout/check/getPermissions)+ JWT |
| HTTP 客户端 | Refine 默认 fetch;需拦截器/自动带 token → 自研 DataProvider 包 axios/ky |
| 缓存 / 状态 | 已内置 `@tanstack/react-query`(自动缓存/失效/重试)|
| 实时（Agent 运行状态）| **SSE**（只推不收，更简单）或 **WebSocket**（需双向）；经 BFF 桥接 Redis 事件。见 §1.5 |
| 国际化 | `i18next` + `react-i18next`(见 README「国际化约定」)|
| 图标 | `lucide-react`(本地 SVG,零联网;见 README「图标方案约定」)|

> 数据交互的 **API 契约草案**见同目录 [`api-contract-draft.md`](./api-contract-draft.md);
> 项目**使用手册**见 [`usage-manual.md`](./usage-manual.md)。
