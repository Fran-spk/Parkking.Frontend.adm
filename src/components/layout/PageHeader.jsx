/**
 * PageHeader — estándar de cabecera para TODA page de listado / operación.
 *
 * Usar siempre al crear páginas nuevas (no reinventar h1 + KPIs a mano).
 *
 * Estructura fija:
 *  1. Título (`pk-title`) + descripción (`pk-desc`) + acción opcional (`PageHeaderAction`)
 *  2. Mini resumen: 2–4 cards planas con `{ label, value, tone?, onClick? }`
 *
 * Tokens: brand / ink / surface / danger|warning|success (nunca indigo/gray crudos).
 *
 * @example
 * <PageHeader
 *   title="Abonos"
 *   description="Contratos activos…"
 *   action={<PageHeaderAction onClick={…}><Plus size={16} /> Nuevo</PageHeaderAction>}
 *   loading={loading}
 *   stats={[
 *     { label: "Listados", value: 12 },
 *     { label: "Activos", value: 10 },
 *     { label: "Con deuda", value: 2, tone: "danger" },
 *   ]}
 * />
 */

function isAlertValue(value) {
  if (typeof value === "number") return value > 0;
  if (typeof value === "string") {
    const n = Number(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n > 0 : value.trim().length > 0;
  }
  return Boolean(value);
}

function valueSize(value) {
  const len = String(value ?? "").length;
  if (len > 16) return "text-sm";
  if (len > 13) return "text-base";
  if (len > 10) return "text-lg";
  return "text-xl";
}

export default function PageHeader({
  title,
  description,
  action = null,
  stats = null,
  loading = false,
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="pk-title">{title}</h1>
          {description ? <p className="pk-desc mt-1">{description}</p> : null}
        </div>
        {action}
      </div>

      {!loading && Array.isArray(stats) && stats.length > 0 ? (
        <div
          className={`grid gap-3 w-full ${
            stats.length === 2
              ? "max-w-xl grid-cols-2"
              : stats.length >= 4
                ? "max-w-5xl grid-cols-2 lg:grid-cols-4"
                : "max-w-3xl grid-cols-3"
          }`}
        >
          {stats.map((s) => {
            const tone = s.tone || "default";
            const alert = isAlertValue(s.value);
            const isDanger = tone === "danger" && alert;
            const isWarning = tone === "warning" && alert;
            const isSuccess = tone === "success";

            return (
              <button
                key={s.label}
                type="button"
                onClick={s.onClick}
                disabled={!s.onClick}
                className={`text-left min-w-0 px-3 py-3 transition-colors ${
                  isDanger
                    ? "bg-danger-muted"
                    : isWarning
                      ? "bg-warning-muted"
                      : "bg-surface-card hover:bg-surface-muted/60"
                } ${s.onClick ? "cursor-pointer" : "cursor-default"}`}
              >
                <p
                  className={`pk-label ${
                    isDanger
                      ? "text-danger"
                      : isWarning
                        ? "text-warning"
                        : isSuccess
                          ? "text-success"
                          : ""
                  }`}
                >
                  {s.label}
                </p>
                <p
                  className={`font-black tracking-tight mt-1 tabular-nums leading-none whitespace-nowrap ${valueSize(s.value)} ${
                    isDanger
                      ? "text-danger-ink"
                      : isWarning
                        ? "text-warning-ink"
                        : isSuccess
                          ? "text-success-ink"
                          : "text-ink"
                  }`}
                >
                  {s.value}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** CTA primario del header (misma personalidad en todas las pages). */
export function PageHeaderAction({
  children,
  onClick,
  type = "button",
  className = "",
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-2 bg-brand hover:bg-brand-strong text-brand-foreground text-sm font-semibold px-4 py-2.5 transition-colors shrink-0 disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
