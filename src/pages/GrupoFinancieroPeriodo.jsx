import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { grupoFinancieroService } from "../services/grupoFinancieroService";
import { etiquetaMovimiento } from "../types/finanzas.js";

/** @typedef {import("../types").GrupoFinancieroPeriodo} GrupoFinancieroPeriodo */

function formatPrecio(precio) {
  return Number(precio || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
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

export default function GrupoFinancieroPeriodoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [periodo, setPeriodo] = useState(/** @type {GrupoFinancieroPeriodo | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargar("", "");
  }, [id]);

  async function cargar(d, h) {
    try {
      setLoading(true);
      setError(null);
      const data = await grupoFinancieroService.periodo(id, d, h);
      setPeriodo(data);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo consultar el grupo");
    } finally {
      setLoading(false);
    }
  }

  const movimientos = periodo?.movimientos || [];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate("/grupos-financieros")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> Grupos financieros
      </button>

      <PageHeader
        title={periodo?.nombre || "Grupo financiero"}
        description="Ingresos, egresos y neto de los movimientos de este grupo. El signo es el del estacionamiento."
        loading={loading}
        stats={[
          { label: "Ingresos", value: formatPrecio(periodo?.totalIngresos) },
          {
            label: "Egresos",
            value: formatPrecio(periodo?.totalEgresos),
            tone: Number(periodo?.totalEgresos) > 0 ? "danger" : "default",
          },
          { label: "Neto", value: formatPrecio(periodo?.neto), tone: Number(periodo?.neto) < 0 ? "danger" : "success" },
          { label: "Movimientos", value: movimientos.length },
        ]}
      />

      <div className="bg-surface-card px-4 py-3 flex flex-wrap items-end gap-3">
        <label className="text-xs text-ink-muted">
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="mt-1 block text-sm border border-line-strong bg-surface-muted text-ink px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-ink-muted">
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="mt-1 block text-sm border border-line-strong bg-surface-muted text-ink px-2 py-1.5"
          />
        </label>
        <button type="button" onClick={() => cargar(desde, hasta)} className="text-xs font-semibold bg-brand text-brand-foreground px-3 py-2">
          Filtrar
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="bg-surface-card overflow-hidden">
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink-faint">Cargando...</p>
        ) : movimientos.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink-faint">No hay movimientos en este período</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pk-label px-4 py-3">Fecha</th>
                <th className="pk-label px-4 py-3">Tipo</th>
                <th className="pk-label px-4 py-3">Concepto</th>
                <th className="pk-label px-4 py-3 text-right">Importe</th>
                <th className="pk-label px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.movimientoId} className="border-b border-line-subtle">
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatFecha(m.fechaHora)}</td>
                  <td className="px-4 py-3 text-ink font-semibold">{etiquetaMovimiento(m)}</td>
                  <td className="px-4 py-3 text-ink">{m.concepto}</td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${Number(m.importe) < 0 ? "text-danger" : "text-ink"}`}>
                    {formatPrecio(m.importe)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/movimientos/${m.movimientoId}`}
                      title="Auditar movimiento"
                      className="inline-flex p-1.5 text-ink-faint hover:text-ink"
                    >
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
