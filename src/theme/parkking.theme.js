/**
 * Parkking design tokens — Parking Blue
 *
 * Fuente de verdad del look. Cambiá valores acá y (vía CSS vars + Tailwind)
 * se actualiza la UI migrada.
 *
 * Tipografía (usar clases utilitarias):
 * - pk-title / text-pk-title     → títulos de página
 * - pk-heading / text-pk-heading → cabeceras de sección / paneles
 * - pk-subhead / text-pk-subhead → subtítulos
 * - pk-body / text-pk-body       → texto principal
 * - pk-desc / text-pk-desc       → descripciones
 * - pk-label / text-pk-label     → labels de formulario (uppercase)
 * - pk-caption / text-pk-caption → metadatos / ayudas
 * - pk-amount / text-pk-amount   → montos destacados (compactos)
 */

export const parkkingTheme = {
  name: "parking-blue",

  colors: {
    brand: {
      DEFAULT: "#1d4ed8",
      muted: "#eff6ff",
      soft: "#bfdbfe",
      strong: "#1e3a8a",
      foreground: "#ffffff",
    },
    ink: {
      DEFAULT: "#0f172a",
      muted: "#64748b",
      faint: "#94a3b8",
    },
    surface: {
      page: "#f8fafc",
      card: "#ffffff",
      elevated: "#ffffff",
      muted: "#f1f5f9",
      overlay: "rgba(15, 23, 42, 0.55)",
    },
    line: {
      subtle: "#f1f5f9",
      DEFAULT: "#e2e8f0",
      strong: "#cbd5e1",
    },
    success: {
      DEFAULT: "#059669",
      muted: "#ecfdf5",
      ink: "#047857",
    },
    warning: {
      DEFAULT: "#d97706",
      muted: "#fffbeb",
      ink: "#b45309",
    },
    danger: {
      DEFAULT: "#e11d48",
      muted: "#fff1f2",
      ink: "#be123c",
    },
    info: {
      DEFAULT: "#2563eb",
      muted: "#eff6ff",
      ink: "#1d4ed8",
    },
  },

  /** Escala tipográfica del sistema (compacta / operativa). */
  type: {
    title: { size: "1.25rem", weight: "800", lineHeight: "1.25", tracking: "-0.02em" }, // 20px
    heading: { size: "1rem", weight: "700", lineHeight: "1.3", tracking: "-0.01em" }, // 16px
    subhead: { size: "0.875rem", weight: "600", lineHeight: "1.35", tracking: "0" }, // 14px
    body: { size: "0.8125rem", weight: "500", lineHeight: "1.45", tracking: "0" }, // 13px
    description: { size: "0.75rem", weight: "500", lineHeight: "1.45", tracking: "0" }, // 12px
    label: { size: "0.625rem", weight: "700", lineHeight: "1.2", tracking: "0.12em" }, // 10px
    caption: { size: "0.6875rem", weight: "500", lineHeight: "1.35", tracking: "0" }, // 11px
    amount: { size: "1.5rem", weight: "800", lineHeight: "1.15", tracking: "-0.02em" }, // 24px
  },

  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.75rem",
    pill: "9999px",
  },

  shadow: {
    card: "0 8px 30px rgb(0, 0, 0, 0.015)",
    modal: "0 25px 50px -12px rgb(0, 0, 0, 0.25)",
    soft: "0 1px 12px rgba(0, 0, 0, 0.03)",
  },

  font: {
    sans: '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  },
};

/** Flat map for CSS custom properties / recibo HTML. */
export function themeToCssVars(theme = parkkingTheme) {
  const { colors: c, radius: r, shadow: s, font: f, type: t } = theme;
  return {
    "--pk-brand": c.brand.DEFAULT,
    "--pk-brand-muted": c.brand.muted,
    "--pk-brand-soft": c.brand.soft,
    "--pk-brand-strong": c.brand.strong,
    "--pk-brand-fg": c.brand.foreground,

    "--pk-ink": c.ink.DEFAULT,
    "--pk-ink-muted": c.ink.muted,
    "--pk-ink-faint": c.ink.faint,

    "--pk-surface-page": c.surface.page,
    "--pk-surface-card": c.surface.card,
    "--pk-surface-elevated": c.surface.elevated,
    "--pk-surface-muted": c.surface.muted,
    "--pk-surface-overlay": c.surface.overlay,

    "--pk-line": c.line.DEFAULT,
    "--pk-line-subtle": c.line.subtle,
    "--pk-line-strong": c.line.strong,

    "--pk-success": c.success.DEFAULT,
    "--pk-success-muted": c.success.muted,
    "--pk-success-ink": c.success.ink,

    "--pk-warning": c.warning.DEFAULT,
    "--pk-warning-muted": c.warning.muted,
    "--pk-warning-ink": c.warning.ink,

    "--pk-danger": c.danger.DEFAULT,
    "--pk-danger-muted": c.danger.muted,
    "--pk-danger-ink": c.danger.ink,

    "--pk-info": c.info.DEFAULT,
    "--pk-info-muted": c.info.muted,
    "--pk-info-ink": c.info.ink,

    "--pk-type-title": t.title.size,
    "--pk-type-title-weight": t.title.weight,
    "--pk-type-title-lh": t.title.lineHeight,
    "--pk-type-title-tracking": t.title.tracking,

    "--pk-type-heading": t.heading.size,
    "--pk-type-heading-weight": t.heading.weight,
    "--pk-type-heading-lh": t.heading.lineHeight,
    "--pk-type-heading-tracking": t.heading.tracking,

    "--pk-type-subhead": t.subhead.size,
    "--pk-type-subhead-weight": t.subhead.weight,
    "--pk-type-subhead-lh": t.subhead.lineHeight,

    "--pk-type-body": t.body.size,
    "--pk-type-body-weight": t.body.weight,
    "--pk-type-body-lh": t.body.lineHeight,

    "--pk-type-desc": t.description.size,
    "--pk-type-desc-weight": t.description.weight,
    "--pk-type-desc-lh": t.description.lineHeight,

    "--pk-type-label": t.label.size,
    "--pk-type-label-weight": t.label.weight,
    "--pk-type-label-lh": t.label.lineHeight,
    "--pk-type-label-tracking": t.label.tracking,

    "--pk-type-caption": t.caption.size,
    "--pk-type-caption-weight": t.caption.weight,
    "--pk-type-caption-lh": t.caption.lineHeight,

    "--pk-type-amount": t.amount.size,
    "--pk-type-amount-weight": t.amount.weight,
    "--pk-type-amount-lh": t.amount.lineHeight,
    "--pk-type-amount-tracking": t.amount.tracking,

    "--pk-radius-sm": r.sm,
    "--pk-radius-md": r.md,
    "--pk-radius-lg": r.lg,
    "--pk-radius-xl": r.xl,
    "--pk-radius-2xl": r["2xl"],
    "--pk-radius-3xl": r["3xl"],
    "--pk-radius-pill": r.pill,

    "--pk-shadow-card": s.card,
    "--pk-shadow-modal": s.modal,
    "--pk-shadow-soft": s.soft,

    "--pk-font-sans": f.sans,
  };
}

/** Apply tokens as CSS variables on :root (call once at app boot). */
export function applyParkkingTheme(theme = parkkingTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const vars = themeToCssVars(theme);
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.dataset.theme = theme.name;
}

export default parkkingTheme;
