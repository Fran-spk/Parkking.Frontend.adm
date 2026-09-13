/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--pk-brand)",
          muted: "var(--pk-brand-muted)",
          soft: "var(--pk-brand-soft)",
          strong: "var(--pk-brand-strong)",
          foreground: "var(--pk-brand-fg)",
        },
        ink: {
          DEFAULT: "var(--pk-ink)",
          muted: "var(--pk-ink-muted)",
          faint: "var(--pk-ink-faint)",
        },
        surface: {
          page: "var(--pk-surface-page)",
          card: "var(--pk-surface-card)",
          elevated: "var(--pk-surface-elevated)",
          muted: "var(--pk-surface-muted)",
          overlay: "var(--pk-surface-overlay)",
        },
        line: {
          DEFAULT: "var(--pk-line)",
          subtle: "var(--pk-line-subtle)",
          strong: "var(--pk-line-strong)",
        },
        success: {
          DEFAULT: "var(--pk-success)",
          muted: "var(--pk-success-muted)",
          ink: "var(--pk-success-ink)",
        },
        warning: {
          DEFAULT: "var(--pk-warning)",
          muted: "var(--pk-warning-muted)",
          ink: "var(--pk-warning-ink)",
        },
        danger: {
          DEFAULT: "var(--pk-danger)",
          muted: "var(--pk-danger-muted)",
          ink: "var(--pk-danger-ink)",
        },
        info: {
          DEFAULT: "var(--pk-info)",
          muted: "var(--pk-info-muted)",
          ink: "var(--pk-info-ink)",
        },
      },
      borderRadius: {
        pk: "var(--pk-radius-md)",
        "pk-sm": "var(--pk-radius-sm)",
        "pk-lg": "var(--pk-radius-lg)",
        "pk-xl": "var(--pk-radius-xl)",
        "pk-2xl": "var(--pk-radius-2xl)",
        "pk-3xl": "var(--pk-radius-3xl)",
      },
      boxShadow: {
        "pk-card": "var(--pk-shadow-card)",
        "pk-modal": "var(--pk-shadow-modal)",
        "pk-soft": "var(--pk-shadow-soft)",
      },
      fontFamily: {
        sans: ["var(--pk-font-sans)"],
      },
      fontSize: {
        "pk-title": ["var(--pk-type-title)", { lineHeight: "var(--pk-type-title-lh)", letterSpacing: "var(--pk-type-title-tracking)", fontWeight: "800" }],
        "pk-heading": ["var(--pk-type-heading)", { lineHeight: "var(--pk-type-heading-lh)", letterSpacing: "var(--pk-type-heading-tracking)", fontWeight: "700" }],
        "pk-subhead": ["var(--pk-type-subhead)", { lineHeight: "var(--pk-type-subhead-lh)", fontWeight: "600" }],
        "pk-body": ["var(--pk-type-body)", { lineHeight: "var(--pk-type-body-lh)", fontWeight: "500" }],
        "pk-desc": ["var(--pk-type-desc)", { lineHeight: "var(--pk-type-desc-lh)", fontWeight: "500" }],
        "pk-label": ["var(--pk-type-label)", { lineHeight: "var(--pk-type-label-lh)", letterSpacing: "var(--pk-type-label-tracking)", fontWeight: "700" }],
        "pk-caption": ["var(--pk-type-caption)", { lineHeight: "var(--pk-type-caption-lh)", fontWeight: "500" }],
        "pk-amount": ["var(--pk-type-amount)", { lineHeight: "var(--pk-type-amount-lh)", letterSpacing: "var(--pk-type-amount-tracking)", fontWeight: "800" }],
      },
    },
  },
  plugins: [],
};
