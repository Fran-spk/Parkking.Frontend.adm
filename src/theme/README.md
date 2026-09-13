# Theme Parkking

Fuente de verdad: [`parkking.theme.js`](./parkking.theme.js) (**Parking Blue**).

## Cómo usarlo

1. Tokens viven en JS (`parkkingTheme`).
2. Al boot, `applyParkkingTheme()` escribe CSS vars `--pk-*` en `:root`.
3. Tailwind mapea esas vars a clases semánticas.

## Clases preferidas (código nuevo)

| Evitar | Usar |
|--------|------|
| `bg-indigo-600`, `text-indigo-*`, teal hardcodeado | `bg-brand`, `text-brand`, `bg-brand-muted`, `hover:bg-brand-strong` |
| `bg-gray-50` (fondo página) | `bg-surface-page` |
| `bg-white` (cards) | `bg-surface-card` |
| `text-slate-800` / `text-gray-900` | `text-ink` |
| `text-slate-400` / `text-gray-400` | `text-ink-muted` / `text-ink-faint` |
| `border-gray-100` | `border-line` / `border-line-subtle` |
| `bg-rose-*` errores | `bg-danger-muted`, `text-danger` |
| `bg-amber-*` avisos | `bg-warning-muted`, `text-warning` |
| `bg-emerald-*` ok | `bg-success-muted`, `text-success` |

## Tipografía

| Clase | Uso | Tamaño |
|-------|-----|--------|
| `pk-title` | Títulos de página | 20px |
| `pk-heading` | Cabeceras de panel/sección | 16px |
| `pk-subhead` | Subtítulos / valores de campo | 14px |
| `pk-body` | Texto principal | 13px |
| `pk-desc` | Descripciones | 12px |
| `pk-label` | Labels de form (uppercase) | 10px |
| `pk-caption` | Metadatos / ayudas | 11px |
| `pk-amount` | Montos destacados | 24px |

También: `text-pk-title`, `text-pk-heading`, etc. vía Tailwind.
