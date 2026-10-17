/**
 * Grupo de botones pegados para elegir una sola opción.
 * `opciones` es `{ value, label, cantidad? }[]`.
 */
export default function FiltroSegmentado({ value, onChange, opciones, ariaLabel }) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap text-xs font-semibold border border-line-strong">
      {opciones.map((o) => {
        const activo = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(o.value)}
            className={`px-2.5 py-1.5 tabular-nums border-l border-line-strong first:border-l-0 ${
              activo ? "bg-ink text-surface-card" : "text-ink-muted hover:text-ink hover:bg-surface-muted"
            }`}
          >
            {o.label}
            {o.cantidad != null ? <span className={activo ? "" : "text-ink-faint"}> {o.cantidad}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
