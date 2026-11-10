# Dialog 弹窗使用规范（头 / 体 / 尾三段式）

> 适用：所有基于 `src/components/ui/dialog.tsx` 的弹窗（含 copy-in 到下游产品的用法）
> 版本：2026-10-19 起（commit `7657ec4`）
> 维护：win_ui_lead

---

## 1. 一句话规则

**弹窗里只有「正文」滚动；标题、关闭按钮、底部操作按钮必须始终可见。**

要做到这一点，正文**必须**包在 `<DialogBody>` 里。不包 → 长内容会被窗口裁切（`overflow-hidden`）。

---

## 2. 结构图

```
┌────────────────────────────────────┐
│  标题                          ×   │  DialogHeader（shrink-0，border-b）
│  副标题/说明                        │
├────────────────────────────────────┤
│                                    │
│         正文（唯一滚动区）           │  DialogBody（flex-1，overflow-y-auto）
│                                    │
├────────────────────────────────────┤
│                  取消     确定      │  DialogFooter（shrink-0，border-t）
└────────────────────────────────────┘

整个弹窗：max-h-[90vh]，超出由 DialogBody 内部滚动
```

---

## 3. 标准写法

```tsx
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-xl">
    <DialogHeader>
      <DialogTitle>编辑产品</DialogTitle>
      <DialogDescription>修改字段后保存，列表即时刷新。</DialogDescription>
    </DialogHeader>

    {/* ★ 正文一定要包这里 */}
    <DialogBody>
      <ProductForm ... />
    </DialogBody>

    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
      <Button type="submit" form="product-form">保存</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 已有实现可直接参考

| 场景 | 文件 |
|---|---|
| 表单弹窗（新建/编辑） | `src/pages/cases/dialog-crud/ProductDialog.tsx` |
| 只读详情弹窗 | `src/pages/cases/dialog-crud/DetailDialog.tsx` |
| 确认类（危险操作） | `src/pages/cases/dialog-crud/DeleteConfirmDialog.tsx` |
| 自定义头（可拖拽/全屏） | `src/pages/cases/components.tsx`（`DemoDialog`） |
| 最小示例（registry） | `registry-items/dialog-basic/demo.tsx` |

---

## 4. 组件 API

| 组件 | 默认样式（关键部分） | 说明 |
|---|---|---|
| `Dialog` | — | Radix Root，受控 `open` / `onOpenChange` |
| `DialogContent` | `flex max-h-[90vh] flex-col overflow-hidden p-0` | **不再自行滚动**；高度上限 90vh |
| `DialogHeader` | `shrink-0 border-b px-6 py-4 pr-12` | 固定；`pr-12` 为关闭按钮留位 |
| `DialogBody` | `min-h-0 flex-1 overflow-y-auto px-6 py-4` | **唯一滚动区**；`min-h-0` 是 flex 下能滚的关键 |
| `DialogFooter` | `shrink-0 border-t px-6 py-3 gap-2` | 固定；窄屏自动纵向排列（`flex-col-reverse sm:flex-row`） |
| `DialogTitle` | `text-lg font-semibold` | 语义 `<h2>`，无障碍必需 |
| `DialogDescription` | `text-sm text-muted-foreground` | 可选；有则读屏会播报 |
| `DialogClose` | — | 关闭按钮；`DialogContent` 已内置右上角 × |

---

## 5. 四个常见错误

### ❌ 1. 正文没包 `DialogBody`

```tsx
<DialogContent className="max-w-xl">
  <DialogHeader>…</DialogHeader>
  <ProductForm />          {/* ✗ 长表单会被裁切，且无法滚动 */}
  <DialogFooter>…</DialogFooter>
</DialogContent>
```
→ 必须 `<DialogBody><ProductForm /></DialogBody>`。

### ❌ 2. 在 `DialogContent` 上加 `overflow-y-auto`

```tsx
<DialogContent className="max-h-[90vh] overflow-y-auto">  {/* ✗ 整窗滚，头尾全跟着跑 */}
```
→ 删掉；身高交给默认的 `max-h-[90vh]`，滚动交给 `DialogBody`。

### ❌ 3. 给 `DialogContent` 加 `p-6`

```tsx
<DialogContent className="p-6">  {/* ✗ 与头/尾的内边距叠加，出现双层留白 */}
```
→ 默认已是 `p-0`，内边距由 Header/Body/Footer 各自负责。

### ❌ 4. 自建头部却漏掉 `pr-12`

```tsx
<DialogHeader className="px-4">  {/* ✗ 长标题会钻到关闭按钮下面 */}
```
→ 至少保留 `pr-12`，或把标题 `max-w` 收紧。

---

## 6. 自检清单（提交前）

```bash
npx tsc -b                            # TSC=0
node scripts/check-ui-rules.mjs       # 质量闸通过（不新增原生色/space-*/h-screen）
node scripts/visual-baseline.mjs compare
```

浏览器手工验（小窗 1280×420 最有效）：

1. 打开弹窗 → 顶部有标题、右上有关闭 ×
2. 滚正文到底 → 标题、× 、底部按钮**位置不变**
3. 窄屏（< 640px）→ 底部按钮纵向堆叠、不溢出
4. Esc / 点遮罩 → 正常关闭，无焦点残留

Playwright 断言要点：对比滚动前后的 `title.getBoundingClientRect().top`、`close.top`、末尾按钮 `bottom`，三者应**完全相等**。

---

## 7. 变更记录

| 日期 | 变更 | 提交 |
|---|---|---|
| 2026-10-19 | `DialogContent` 由 `grid + p-6` 改为 `flex flex-col + max-h-[90vh] + p-0`；新增 `DialogBody`；Header/Footer 加 `shrink-0` 与分隔线；关闭按钮加 `z-10`；迁 9 处弹窗 | `7657ec4` |
| 2026-10-16 | 恢复弹层动效（`tailwindcss-animate`）+ 补全 Dialog 内容区 fade/zoom | `42c4a22` |

---

## 8. 附：一个 dev 环境专属的坑

根目录的 **`components.json`**（shadcn 配置）会让 Vite 把 `/components` **路由**解析成该文件（返回 JS）。

现象：浏览器打开 `/components` 看到 `export const $schema = ...`。

已在 `vite.config.ts` 的 `server.configureServer` 里加中间件：浏览器导航（`Accept: text/html`）访问 `/components` → 改写为 `/index.html`。

**新增根目录文件时，注意别与 SPA 路由同名。** 生产环境（SPA fallback）无此问题。
