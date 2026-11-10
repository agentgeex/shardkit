import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./registry-items/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        // 描述列表标签列底色（2026-10-29 新增，只有一档明暗，不带 foreground）
        "table-head": "hsl(var(--table-head))",
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 状态语义色（新代码一律用语义 token，禁写 emerald-*/sky-*/amber-*）
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // 按钮「用途分色」（2026-10-28）：白底上靠色相区分动作，一律实底 + 白字
        "action-run": {
          DEFAULT: "hsl(var(--action-run))",
          foreground: "hsl(var(--action-run-foreground))",
        },
        "action-view": {
          DEFAULT: "hsl(var(--action-view))",
          foreground: "hsl(var(--action-view-foreground))",
        },
        "action-back": {
          DEFAULT: "hsl(var(--action-back))",
          foreground: "hsl(var(--action-back-foreground))",
        },
        // 导航外壳（A 品牌条 + C 菜单区）——深色侧栏体系
        chrome: {
          DEFAULT: "hsl(var(--chrome))",
          foreground: "hsl(var(--chrome-foreground))",
          hover: "hsl(var(--chrome-hover))",
          active: "hsl(var(--chrome-active))",
          "active-foreground": "hsl(var(--chrome-active-foreground))",
        },
      },
      // 区域分界线（比 --border 更重一档，用于 A|B|C|D 之间）
      borderColor: {
        strong: "hsl(var(--border-strong))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 字阶 6 档（语义名，加法不覆盖默认 xs/sm/base…）
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1rem" }], // 12px 辅助/说明
        body: ["0.875rem", { lineHeight: "1.5rem" }], // 14px 正文基准
        "body-lg": ["1rem", { lineHeight: "1.5rem" }], // 16px 强调正文
        subtitle: ["1.125rem", { lineHeight: "1.75rem" }], // 18px 区块标题
        title: ["1.375rem", { lineHeight: "1.875rem" }], // 22px 页面标题
        display: ["1.75rem", { lineHeight: "2.25rem" }], // 28px 大标题
      },
      // 阴影 3 档（静置 / 浮起 / 弹层）——禁散点取用 shadow-[Npx]
      boxShadow: {
        surface: "0 1px 3px 0 rgb(16 24 40 / 0.08), 0 1px 2px -1px rgb(16 24 40 / 0.06)",
        raised:
          "0 4px 12px -2px rgb(0 0 0 / 0.10), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
        overlay:
          "0 12px 32px -8px rgb(0 0 0 / 0.24), 0 4px 8px -4px rgb(0 0 0 / 0.12)",
      },
      // 固定 z 标尺（禁 z-[999] 等任意值）
      zIndex: {
        header: "30",
        dropdown: "40",
        overlay: "50",
        modal: "60",
        popover: "70",
        toast: "80",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
