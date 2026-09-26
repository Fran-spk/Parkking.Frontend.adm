import { useEffect, useState } from "react";
import { grupoFinancieroService } from "../../services/grupoFinancieroService";

/** @typedef {import("../../types").GrupoFinanciero} GrupoFinanciero */

export default function SelectorGrupos({ value = [], onChange }) {
  const [grupos, setGrupos] = useState(/** @type {GrupoFinanciero[]} */ ([]));

  useEffect(() => {
    grupoFinancieroService
      .getAll(false)
      .then((data) => setGrupos(Array.isArray(data) ? data : []))
      .catch(() => setGrupos([]));
  }, []);

  function toggle(id) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  if (grupos.length === 0) {
    return (
      <p className="text-xs text-ink-faint">
        No hay grupos activos. Las reglas igual pueden asignar uno al guardar.
      </p>
    );
  }

  return (
    <div>
      <p className="pk-label mb-1.5">Grupos a sumar</p>
      <div className="flex flex-wrap gap-2">
        {grupos.map((g) => {
          const on = value.includes(g.grupoFinancieroId);
          return (
            <label
              key={g.grupoFinancieroId}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold cursor-pointer border ${
                on ? "border-brand bg-brand-muted text-ink" : "border-line text-ink-muted"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(g.grupoFinancieroId)}
                className="border-line-strong text-brand"
              />
              {g.nombre}
            </label>
          );
        })}
      </div>
    </div>
  );
}
