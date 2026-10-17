import { ESTADOS_COCHERA } from "../../utils/cocheraHelpers";

/** Barra plana que reparte el total de cocheras por estado, con su leyenda. */
export default function BarraOcupacionCocheras({ porEstado, total }) {
  if (!total) return null;
  const tramos = Object.entries(ESTADOS_COCHERA)
    .map(([id, meta]) => ({ id, ...meta, valor: porEstado[id] || 0 }))
    .filter((t) => t.valor > 0);

  return (
    <div className="bg-surface-card px-4 py-3 space-y-2">
      <div className="flex h-2 w-full gap-px" role="img" aria-label="Distribución de cocheras por estado">
        {tramos.map((t) => (
          <div key={t.id} className={t.barra} style={{ width: `${(t.valor / total) * 100}%` }} title={`${t.label}: ${t.valor}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {tramos.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5 pk-caption text-ink-muted">
            <span className={`h-2 w-2 ${t.barra}`} />
            {t.label} <span className="text-ink font-semibold tabular-nums">{t.valor}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
