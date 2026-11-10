#!/usr/bin/env node
/**
 * build-registry.mjs — 扫描 registry-items/ 生成 registry/index.json
 *
 * 机制：新增组件 = 放一份 registry-items/<id>/{meta.json,index.tsx,demo.tsx}
 * 跑本脚本即入索引，无需改页面代码。
 *
 * 用法：node scripts/build-registry.mjs
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ITEMS_DIR = join(ROOT, "registry-items");
const OUT = join(ROOT, "registry", "index.json");

const REQUIRED = ["id", "name", "category", "tags", "stack", "source", "complexity"];

function listDirs(p) {
  if (!existsSync(p)) return [];
  return readdirSync(p).filter((n) => statSync(join(p, n)).isDirectory());
}

function loadMeta(id, dir) {
  const metaPath = join(dir, "meta.json");
  if (!existsSync(metaPath)) {
    console.warn(`  ⚠︎ 跳过 ${id}：缺少 meta.json`);
    return null;
  }
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf8"));
  } catch (e) {
    console.warn(`  ⚠︎ 跳过 ${id}：meta.json 解析失败 - ${e.message}`);
    return null;
  }
  meta.id = meta.id || id;
  for (const k of REQUIRED) {
    if (meta[k] === undefined) console.warn(`  ⚠︎ ${id} 缺少必填字段 "${k}"`);
  }
  // 自动补全 files / demo 路径
  const files = ["index.tsx", "demo.tsx", "index.vue", "demo.vue"]
    .filter((f) => existsSync(join(dir, f)))
    .map((f) => `registry-items/${id}/${f}`);
  meta.files = meta.files || files;
  if (!meta.demo && existsSync(join(dir, "demo.tsx"))) meta.demo = `registry-items/${id}/demo.tsx`;
  if (!meta.createdAt) meta.createdAt = "2026-09-16";
  return meta;
}

function main() {
  const ids = listDirs(ITEMS_DIR);
  console.log(`[build-registry] 扫描 ${ITEMS_DIR} → ${ids.length} 个条目`);
  const items = ids.map((id) => loadMeta(id, join(ITEMS_DIR, id))).filter(Boolean);

  const out = {
    $schema: "./schema.json",
    generatedAt: new Date().toISOString().slice(0, 10),
    version: "0.0.1",
    count: items.length,
    items,
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`[build-registry] ✅ 写入 ${OUT}（${items.length} 条）`);

  // 同步一份到 public/registry.json，供静态部署消费（copy-in 消费者可直接拉取全量清单）
  const PUBLIC_OUT = join(ROOT, "public", "registry.json");
  writeFileSync(PUBLIC_OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`[build-registry] ✅ 写入 ${PUBLIC_OUT}`);
}

main();
