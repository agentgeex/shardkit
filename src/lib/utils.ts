import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 拼接 public/ 下静态资源的 URL。
 *
 * 为什么需要：项目可以部署在根路径（dev、自托管），也可以部署在子路径
 * （GitHub Pages 项目页 = /shardkit/）。写死 "/logo.svg" 在子路径下会 404。
 *
 * `import.meta.env.BASE_URL` 由 Vite 在构建期按 `base` 配置替换，
 * dev 下是 "/"，`VITE_BASE=/shardkit/` 构建时是 "/shardkit/"。
 */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}
