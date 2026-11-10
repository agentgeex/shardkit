import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ShardKit SPA —— Vite 配置
// 说明：
// - registry-items/ 下的 demo.tsx 通过 Vite glob + alias 被动态加载。
// - 独立开源项目：零自定义注入，npm install 即可复现。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5178,
    fs: {
      // 允许加载仓库根下的 registry-items/ 源码
      allow: [path.resolve(__dirname, ".")],
    },
    // ⚠ 已知冲突：根目录的 components.json 会让 Vite 把 /components 当成该文件
    //（按 resolve.extensions 补 .json）→ 路由被吃掉，返回 JS 而非 SPA。
    // 这里对「浏览器导航」请求把 /components 改写成 /index.html，交给 SPA 路由。
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split("?")[0];
        const accept = String(req.headers.accept ?? "");
        if (url === "/components" && accept.includes("text/html")) {
          req.url = "/index.html";
        }
        next();
      });
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
