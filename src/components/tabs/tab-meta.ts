/**
 * components/tabs/tab-meta.ts — 路由 → 标签元信息解析（ShardKit 信息架构适配）
 *
 * 作用：把「一条访问路径」解析为工作区标签所需的 { title, iconKey }。
 *
 * 适配点（相对 5300 的硬编码）：
 *   - ShardKit 的「默认标签」是 `/blank`（空白兜底页），不是 5300 的 `/dashboard`。
 *     标签全部关闭后回落到它；它是固定不可关的默认标签。
 *   - 「案例索引」`/` 降为普通过程标签（可从左侧导航打开 / 关闭）。
 *   - ShardKit 有两套导航：
 *       ① 案例导航 NAV_GROUPS（CASES 驱动，路径 = /blank /dashboard /list …）
 *       ② 多级菜单 MENU_TREE（路径 = /menu/** + /menu 示例页）
 *   - 因此这里统一按「默认页/案例索引 → 案例 → 菜单 → 兜底」四级解析，
 *     标题与图标 key 都能正确映射；未知路径用 pathname 兜底，图标由 TabBar 渲染为中性圆点。
 */
import { CASES, caseTitle } from "@/lib/cases";
import { MENU_LEAVES, findMenuLeaf } from "@/lib/menu-tree";

/** 翻译函数签名（兼容 i18next 的 t） */
export type TFn = (key: string) => string;

/** 默认标签 key（= 空白兜底页路由）；与 TabsContext.HOME_TAB 保持一致 */
export const HOME_PATH = "/blank";

/** 多级菜单分支的统一图标 key（在 TabBar 里映射为 FolderTree 图标） */
export const MENU_ICON_KEY = "menu";

export interface TabMeta {
  title: string;
  iconKey?: string;
  /**
   * 标签归属 key（可选）：当前路由应挂靠到哪个已有标签，而不是新开一个。
   * 典型场景：/list-page 的隐藏子路由（/list-page/new、/list-page/:id、/list-page/:id/edit）
   * 应由列表页标签「承载」，与列表页共用同一个标签（维护者验收反馈 2026-09-28）。
   * 不返回时表示本路由自成一个标签。
   */
  tabKey?: string;
}

/** 路径 → {标题, 图标key}（lang/t 可选：传入则标题按语言解析） */
export function resolveTabMeta(rawPath: string, lang = "zh-CN", t?: TFn): TabMeta {
  // 拆掉 query/hash，用纯路径匹配
  const path = rawPath.split(/[?#]/)[0] || HOME_PATH;
  const L = (zh: string, key: string) => (t ? t(key) : zh);

  if (path === HOME_PATH) return { title: L("空白页", "tab.blank"), iconKey: "blank" };
  if (path === "/") return { title: L("案例索引", "index.title"), iconKey: "index" };

  // ① 命中页面/区块案例
  const c = CASES.find((x) => x.to === path);
  if (c) return { title: caseTitle(c, lang), iconKey: c.id };

  // ①.5 列表页 · 页面式 CRUD 的隐藏子路由（/list-page/new、/list-page/:id、/list-page/:id/edit）
  // ★ 维护者验收反馈（2026-09-28）：这些页面 **不新开标签**，而是**与列表页共用同一个标签**
  //    （tabKey = /list-page）。这样「新建/保存/回到列表」全程都在同一个标签内完成，
  //    标签栏不会因为页面式 CRUD 而不断堆积衍生标签。
  if (path === "/list-page/new") return { title: L("新建产品", "tab.newProduct"), iconKey: "list-page", tabKey: "/list-page" };
  if (/^\/list-page\/[^/]+\/edit$/.test(path)) return { title: L("编辑产品", "tab.editProduct"), iconKey: "list-page", tabKey: "/list-page" };
  if (/^\/list-page\/[^/]+$/.test(path)) return { title: L("产品详情", "tab.productDetail"), iconKey: "list-page", tabKey: "/list-page" };

  // ①.6 表单页的业务配方表单（/form/recipe）与「全部示例」（/form）共用同一标签
  if (path === "/form/recipe") return { title: L("表单页 · 业务配方", "tab.formRecipe"), iconKey: "form", tabKey: "/form" };

  // ①.7 个人中心（顶栏「用户设置 → 个人中心」目标页）
  //   此前未登记 → 标签标题会退化成原始路径 "/personal/center"（实测）
  if (path === "/personal/center") return { title: L("个人中心", "tab.profileCenter") };

  // ② 命中多级菜单叶子
  const leaf = findMenuLeaf(path);
  if (leaf) return { title: L(leaf.labelKey, leaf.labelKey), iconKey: MENU_ICON_KEY };

  // ③ 多级菜单示例落地页
  if (path === "/menu") return { title: L("多级菜单", "nav.multiLevel"), iconKey: MENU_ICON_KEY };

  // ④ 兜底：用路径当标题，图标走中性圆点
  return { title: path };
}

/** 供测试/文档使用：所有已知的「会开标签」的路由标题表 */
export function knownTabTitles(): Record<string, string> {
  const out: Record<string, string> = { [HOME_PATH]: "空白页", "/": "案例索引" };
  for (const c of CASES) out[c.to] = c.title;
  out["/menu"] = "多级菜单";
  // 注意：MENU_LEAVES 的 labelKey 是词条键，此处无 t，故返回键名（仅测试/文档用）
  for (const l of MENU_LEAVES) out[l.path] = l.labelKey;
  // 列表页 · 页面式 CRUD 子路由（静态已知的仅 /list-page/new；带 :id 的动态路由不入表）
  out["/list-page/new"] = "新建产品";
  return out;
}
