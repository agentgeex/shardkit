/**
 * i18n 初始化（i18next + react-i18next）
 * ────────────────────────────────────────────────────────────────────────────
 * 方案 A：只翻「框架层」（导航 / 按钮 / 公共提示 / 页面标题描述）。
 * 语言包**打进 bundle**，运行时零外网请求（符合工程「资源零联网」约定）。
 *
 * 语言：zh-CN（源语言 / 兜底） · en-US —— 首次访问按浏览器偏好自动选
 * 持久化：localStorage["shardkit.locale"]
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN";
import enUS from "./locales/en-US";

export const LOCALE_STORAGE_KEY = "shardkit.locale";

export const SUPPORTED_LOCALES = [
  { key: "zh-CN", label: "简体中文", short: "中" },
  { key: "en-US", label: "English", short: "EN" },
] as const;

export type LocaleKey = (typeof SUPPORTED_LOCALES)[number]["key"];

export const DEFAULT_LOCALE: LocaleKey = "zh-CN";

/**
 * 按浏览器偏好猜语言：中文 → zh-CN；英文 → en-US；其它 → 英文。
 * ★ 开源调整（2026-11-09）：首次访问不再硬编码简中。开源受众以国际用户为主，
 *   一个日语/德语用户打开看到整屏中文会直接关掉；英文是这里最稳的公共语言。
 *   已保存过选择的用户不受影响（见 getStoredLocale）。
 */
export function detectBrowserLocale(): LocaleKey {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const raw of list) {
      if (!raw) continue;
      const tag = raw.toLowerCase();
      if (tag.startsWith("zh")) return "zh-CN";
      if (tag.startsWith("en")) return "en-US";
    }
  } catch {
    /* SSR / 隐私模式忽略 */
  }
  return "en-US";
}

/** 读取已保存语言（无 / 非法 → 按浏览器猜，再不行 → 英文） */
export function getStoredLocale(): LocaleKey {
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === "zh-CN" || v === "en-US") return v;
  } catch {
    /* SSR / 隐私模式忽略 */
  }
  return detectBrowserLocale();
}

/** 同步 <html lang>（无障碍 + 搜索引擎） */
export function applyHtmlLang(locale: string) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", locale);
  }
}

i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    "en-US": { translation: enUS },
  },
  lng: getStoredLocale(),
  // 缺失词的兜底链：先英文、再中文（源语言）。zh-CN 目前无缺键，英文多 6 条复数形式。
  fallbackLng: ["en-US", DEFAULT_LOCALE],
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyHtmlLang(i18n.language);

/** 切换语言：写 i18n + 持久化 + 更新 <html lang> */
export function changeLocale(locale: LocaleKey) {
  i18n.changeLanguage(locale);
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  applyHtmlLang(locale);
}

export default i18n;
