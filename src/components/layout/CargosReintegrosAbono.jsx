import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { operacionFinancieraService } from "../../services/operacionFinancieraService";
import { abonoIdOf } from "../../utils/abonoHelpers";

/** @typedef {import("../../types").Cargo} Cargo */
/** @typedef {import("../../types").Reintegro} Reintegro */
/** @typedef {import("../../types").Abono} Abono */

function formatPrecio(precio) {
  return Number(precio || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CargosReintegrosAbono({ abono }) {
  const navigate = useNavigate();
  const abonoId = abonoIdOf(abono);
  const [cargos, setCargos] = useState(/** @type {Cargo[]} */ ([]));
  const [reintegros, setReintegros] = useState(/** @type {Reintegro[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (abonoId) cargar();
  }, [abonoId]);

  async function cargar() {
    try {
      setError(null);
      const [cargosData, reintegrosData] = await Promise.all([
        operacionFinancieraService.cargosPorAbono(abonoId),
        operacionFinancieraService.reintegrosPorAbono(abonoId),
      ]);
      setCargos(Array.isArray(cargosData) ? cargosData : []);
      setReintegros(Array.isArray(reintegrosData) ? reintegrosData : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar cargos y reintegros");
    } finally {
      setLoading(false);
    }
  }

  const filas = [
    ...cargos.map((c) => ({
      key: `c-${c.cargoId}`,
      tipo: "Cargo",
      detalle: c.concepto,
      importe: c.importe,
      fecha: c.fechaHora,
    })),
    ...reintegros.map((r) => ({
      key: `r-${r.reintegroId}`,
      tipo: "Reintegro",
      detalle: `${r.motivo} · ${r.medio}`,
      importe: -Math.abs(Number(r.importe) || 0),
      fecha: r.fechaHora,
    })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <section className="border-t border-line">
          <div className="px-4 sm:px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-ink">Cargos y reintegros</h3>
          <p className="text-xs text-ink-faint mt-0.5">
            Generados desde este abono. El cargo es una obligación; el reintegro ya impacta la cuenta.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/pagosAbono/${abonoId}/cargo`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-surface-muted text-ink px-3 py-2 hover:bg-brand-muted"
          >
            <Plus size={13} /> Cargo
          </button>
          <button
            type="button"
            onClick={() => navigate(`/pagosAbono/${abonoId}/reintegro`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-brand text-brand-foreground px-3 py-2 hover:bg-brand-strong"
          >
            <Plus size={13} /> Reintegro
          </button>
        </div>
      </div>

      {error && <p className="px-5 pb-3 text-xs text-danger">{error}</p>}

      {loading ? (
        <p className="px-5 pb-4 text-xs text-ink-faint">Cargando...</p>
      ) : filas.length === 0 ? (
        <p className="px-5 pb-5 text-xs text-ink-faint">Todavía no hay cargos ni reintegros</p>
      ) : (
        <ul className="divide-y divide-line">
          {filas.map((f) => (
            <li key={f.key} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink">
                  {f.tipo}
                  <span className="font-medium text-ink-faint"> · {formatFecha(f.fecha)}</span>
                </p>
                <p className="text-sm text-ink-muted truncate">{f.detalle}</p>
              </div>
              <p
                className={`text-sm font-bold tabular-nums shrink-0 ${
                  f.importe < 0 ? "text-danger" : "text-ink"
                }`}
              >
                {formatPrecio(f.importe)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
