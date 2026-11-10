# ShardKit / Win3 后端 API 契约草案（Draft v0.1）

> **状态：草案（未定稿）** —— 供 BFF 开发者与前端对齐使用。
> 本草案与前端现有 mock 数据模型（`src/mock/data.ts`）严格对应，
> 落地时后端按此实现，前端**只需把 `DataProvider` 指向 BFF 地址**。
>
> 维护者：win_ui_lead　最后更新：2026-09-29

---

## 0. 通用约定（Conventions）

| 项 | 约定 |
|----|------|
| **Base URL** | 生产 `https://api.win3.internal/v1`；前端经 `VITE_API_URL` 注入 |
| **协议** | HTTPS + JSON（`Content-Type: application/json`）|
| **鉴权** | `Authorization: Bearer <JWT>`（登录接口签发；无鉴权接口除外）|
| **租户** | JWT 内携带 `tenant_id`；服务端强制隔离，**不接受客户端传 tenant** |
| **分页** | 请求 `?_page=1&_limit=10`；响应头带 `X-Total-Count`（Refine `simple-rest` 约定）|
| **排序** | `?_sort=updatedAt&_order=desc` |
| **筛选** | 直接按字段过滤：`?status=active&category=消费电子&q=耳机` |
| **时间** | ISO-8601（`2026-09-29T20:00:00+08:00`），或 `YYYY-MM-DD`（纯日期字段）|
| **错误体** | `{ "error": { "code": "STRING_CODE", "message": "人类可读", "details": {} } }` |
| **HTTP 状态** | 200/201 成功，400 参数错，401 未认证，403 无权限，404 不存在，409 冲突，429 限流，5xx 服务端 |

> 🔑 **与 Refine 的对应**：本契约刻意贴合 `@refinedev/simple-rest` 的约定
> （`_page`/`_limit`/`X-Total-Count`/`_sort`/`_order`），这样前端用现成 provider 即可对接，零适配。

---

## 1. 资源清单（Resources）

| 资源 | 对应前端案例 | 说明 |
|------|-------------|------|
| `agents` | Dashboard | Agent 运行状态 |
| `runs` | Dashboard | 任务执行记录 |
| `products` | 列表页（弹窗式 / 页面式 CRUD）| 产品集合 |
| `orders` | 查询页 `/search/orders` | 订单查询 |
| `auth` | 登录页 / 用户菜单 | 鉴权 |

---

## 2. 数据模型（Schemas）

### 2.1 Agent
```ts
interface Agent {
  id: string;                                    // "agt_001"
  name: string;                                  // "选题猎手"
  role: "worker" | "project_manager" | "host_manager" | "workshop_manager";
  status: "online" | "offline" | "error";
  model: string;                                 // "gpt-4o"
  tasks: number;                                 // 累计任务数
  tokens: number;                                // 累计 token 消耗
}
```

### 2.2 Run（任务执行记录）
```ts
interface Run {
  id: string;                                    // "run_9001"
  agent: string;                                 // Agent 名称
  recipe: string;                                // 任务配方名
  status: "succeeded" | "failed" | "running";
  startedAt: string;                             // "09:12"（前端当前格式）
  duration: string;                              // "42s"
}
```

### 2.3 Product（产品）
```ts
interface Product {
  id: string;                                    // "P-1001"
  hs6: string;                                   // "8517.12" HS6 海关编码
  name: string;
  category: string;                              // "消费电子"
  platform: string;                              // "Amazon" | "Shopee" | ...
  price: number;                                 // 39.9
  status: "active" | "draft" | "offline";
  updatedAt: string;                             // "2026-09-15"
}
```

### 2.4 Order（订单 —— 查询页）
```ts
interface Order {
  id: string;                                    // 订单号
  product: string;                               // 产品名
  platform: string;
  amount: number;
  status: "paid" | "pending" | "refunded";
  createdAt: string;
}
```

### 2.5 Dashboard 统计（聚合接口）
```ts
interface DashboardStats {
  trend: { date: string; runs: number; tokens: number }[];
  roleDistribution: { name: string; value: number }[];
}
```

---

## 3. 端点（Endpoints）

### 3.1 鉴权 `/auth`

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| POST | `/auth/login` | 登录 | `{ username, password }` | `{ token, user: { id, name, role } }` |
| POST | `/auth/logout` | 登出 | — | `204` |
| GET  | `/auth/me` | 当前用户 | — | `{ id, name, role, tenant_id }` |
| POST | `/auth/refresh` | 刷新令牌 | `{ refresh_token }` | `{ token }` |

### 3.2 Agents `/agents`（标准 CRUD）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/agents?_page=1&_limit=10&_sort=name&_order=asc&status=online` | 分页列表（带 `X-Total-Count`）|
| GET | `/agents/:id` | 单条 |
| POST | `/agents` | 新建 |
| PATCH | `/agents/:id` | 局部更新 |
| DELETE | `/agents/:id` | 删除 |

### 3.3 Runs `/runs`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/runs?...` | 执行记录列表（支持筛选 status / agent）|
| GET | `/runs/:id` | 单条 |

### 3.4 Products `/products`（列表 CRUD 的对接方）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/products?_page=1&_limit=10&_sort=id&_order=asc&q=耳机&category=消费电子&status=active` | 分页 + 关键字 + 筛选 |
| GET | `/products/:id` | 单条（详情页）|
| POST | `/products` | 新建（返回 201 + 完整实体）|
| PATCH | `/products/:id` | 局部更新 |
| DELETE | `/products/:id` | 删除单条 |
| DELETE | `/products?ids=P-1001,P-1002` | 批量删除（前端「批量删除」用）|
| GET | `/products/categories` | 类目下拉选项（对应 `getCategoryOptions`）|

### 3.5 Orders `/orders`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/orders?_page=1&_limit=10&q=...&status=paid&dateFrom=...&dateTo=...` | 订单查询 |

### 3.6 Dashboard `/dashboard`
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/dashboard/stats` | 聚合统计（trend + roleDistribution），对应 `DashboardStats` |

### 3.7 实时通道 `/events`（可选，见 architecture.md §1.5）

> 主通道仍是 REST；实时推送是**按需**开的支路。
> **只推不收 → SSE**（更简单）；**真需双向 → WebSocket**。

| 方式 | 端点 | 说明 |
|------|------|------|
| SSE | `GET /v1/events`（`Accept: text/event-stream`）| 服务端单向推送状态/进度/通知 |
| WebSocket | `wss://api.win3.internal/v1/ws` | 双向实时（如 Agent 日志交互）|

SSE 事件示例：
```
event: agent.status
data: {"id":"agt_001","status":"online"}

event: run.progress
data: {"id":"run_9002","percent":42}
```

---

## 4. 示例：请求 / 响应

### 4.1 登录
```http
POST /v1/auth/login
Content-Type: application/json

{ "username": "alice", "password": "******" }
```
```json
200 OK
{
  "token": "eyJhbGciOi...",
  "user": { "id": "u_001", "name": "Alice", "role": "admin" }
}
```

### 4.2 产品分页列表
```http
GET /v1/products?_page=1&_limit=10&_sort=updatedAt&_order=desc&status=active
Authorization: Bearer <JWT>
```
```json
200 OK
X-Total-Count: 42
Content-Type: application/json

[
  { "id": "P-1001", "hs6": "8517.12", "name": "无线蓝牙耳机 Pro",
    "category": "消费电子", "platform": "Amazon", "price": 39.9,
    "status": "active", "updatedAt": "2026-09-15" }
]
```

### 4.3 新建产品
```http
POST /v1/products
Authorization: Bearer <JWT>

{ "name": "新品 A", "hs6": "9999.99", "category": "测试",
  "platform": "Amazon", "price": 9.9, "status": "draft" }
```
```json
201 Created
{ "id": "P-1009", "name": "新品 A", "hs6": "9999.99", "category": "测试",
  "platform": "Amazon", "price": 9.9, "status": "draft",
  "updatedAt": "2026-09-29" }
```

### 4.4 错误响应
```json
401 Unauthorized
{ "error": { "code": "UNAUTHENTICATED", "message": "登录已过期，请重新登录" } }
```
```json
403 Forbidden
{ "error": { "code": "TENANT_FORBIDDEN", "message": "无权访问该资源" } }
```

---

## 5. 前端对接映射表（契约 → 代码）

| 契约 | 前端位置 | 说明 |
|------|---------|------|
| `VITE_API_URL` | `.env.production` | BFF 地址，唯一需改的配置 |
| REST CRUD | `src/providers/dataProvider.ts`（待建）| 用 `@refinedev/simple-rest` 包裹 |
| 鉴权 | `src/providers/authProvider.ts`（待建）| 对应 `/auth/*` |
| 资源声明 | `src/App.tsx` 的 `<Refine resources={[...]}>` | name 对应契约资源名 |
| 现有 mock | `src/mock/data.ts` / `*/productStore.ts` | 生产环境**替换**为 DataProvider 调用 |

---

## 6. OpenAPI 骨架（可选，供 Swagger 生成用）

```yaml
openapi: 3.0.3
info: { title: Win3 BFF API, version: 0.1.0-draft }
servers: [{ url: https://api.win3.internal/v1 }]
security: [{ bearerAuth: [] }]
components:
  securitySchemes:
    bearerAuth: { type: http, scheme: bearer, bearerFormat: JWT }
  schemas:
    Product:
      type: object
      required: [id, name, status]
      properties:
        id:        { type: string, example: "P-1001" }
        hs6:       { type: string, example: "8517.12" }
        name:      { type: string }
        category:  { type: string }
        platform:  { type: string }
        price:     { type: number, format: float }
        status:    { type: string, enum: [active, draft, offline] }
        updatedAt: { type: string, format: date }
paths:
  /products:
    get:
      summary: 产品分页列表
      parameters:
        - { name: _page,  in: query, schema: { type: integer, default: 1 } }
        - { name: _limit, in: query, schema: { type: integer, default: 10 } }
        - { name: _sort,  in: query, schema: { type: string } }
        - { name: _order, in: query, schema: { type: string, enum: [asc, desc] } }
        - { name: q,      in: query, schema: { type: string } }
      responses:
        "200":
          description: OK
          headers:
            X-Total-Count: { schema: { type: integer } }
          content:
            application/json:
              schema: { type: array, items: { $ref: "#/components/schemas/Product" } }
    post:
      summary: 新建产品
      response: { "201": { description: Created } }
```

> 📌 **待定项（TODO）**：错误码字典、限流阈值、**实时通道（SSE/WebSocket，见 architecture.md §1.5）**、
> 文件上传（图片/富文本）的存储方案（对象存储 presign URL）。
