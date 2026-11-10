# Contributing to ShardKit

感谢参与。ShardKit 靠"加条目"长大，**加一个组件 = 放一个目录 + 跑一次脚本**。

## 新增一个组件条目

1. 在 `registry-items/` 下新建目录 `<id>/`（`id` 用小写连字符，如 `button-primary`）。
2. 放入三样东西：

   ```
   registry-items/<id>/
   ├── index.tsx     # 组件源码 —— 必须"复制即用"（见下）
   ├── demo.tsx      # 预览用示例（详情页实时渲染它）
   └── meta.json     # 元数据（依赖 / 放置说明 / 标签）
   ```

3. `meta.json` 最少包含（完整字段见 `registry/schema.json`）：

   ```json
   {
     "id": "button-primary",
     "name": "主按钮",
     "category": "01-basic",
     "tags": ["button", "primary"],
     "stack": "shadcn",
     "source": "shadcn-official",
     "complexity": "组件",
     "scene": ["general", "form"],
     "status": "可用",
     "usability": "copy-paste",
     "deps": ["@radix-ui/react-slot", "class-variance-authority", "lucide-react"]
   }
   ```

4. 跑构建，刷新索引：

   ```bash
   node scripts/build-registry.mjs
   ```

5. 提交 PR。**无需改任何页面代码** —— 注册表驱动，条目自动进画廊/检索。

## 「复制即用」硬要求（copy-in 约定）

每个条目的 `index.tsx` 必须满足：

- **不依赖 ShardKit 仓库内的私有文件**；只允许引用标准别名（如 `@/lib/utils`）或 `deps` 中声明的公共依赖。
- 复制到消费方工程后，**按 `deps` 装依赖即可运行**。
- `usability` 如实标注：`copy-paste`（拿来即用）/ `需适配`（要改路径或样式）/ `需依赖`（需额外环境）。

## 分类与标签

主分类见 `registry/schema.json` 的 `category` 枚举；`stack` 支持跨栈（shadcn/vue/antd/mui/coreui/vanilla），
便于把历史资产（JSP/PHP/Vue）也纳入同一检索台。

## License

贡献即表示同意以本项目的 [MIT License](./LICENSE) 发布你的贡献。
