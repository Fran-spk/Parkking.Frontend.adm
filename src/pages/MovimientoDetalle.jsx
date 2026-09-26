import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { movimientoService } from "../services/movimientoService";
import { etiquetaMovimiento } from "../types/finanzas.js";

/** @typedef {import("../types").MovimientoDetalle} MovimientoDetalle */

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

export default function MovimientoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movimiento, setMovimiento] = useState(/** @type {MovimientoDetalle | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    movimientoService
      .getById(id)
      .then(setMovimiento)
      .catch((e) => {
        const msg = e.response?.data;
        setError(typeof msg === "string" ? msg : "No se pudo abrir el movimiento");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const auditorias = movimiento?.auditorias || [];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> Volver
      </button>

      <PageHeader
        title={movimiento ? etiquetaMovimiento(movimiento) : "Movimiento"}
        description="Detalle y auditoría. El importe es el del estacionamiento y del grupo."
        loading={loading}
        stats={
          movimiento
            ? [
                { label: "Importe", value: formatPrecio(movimiento.importe), tone: Number(movimiento.importe) < 0 ? "danger" : "success" },
                { label: "Usuario", value: movimiento.usuarioId },
              ]
            : null
        }
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      {movimiento && (
        <div className="bg-surface-card p-5 space-y-4">
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="pk-label">Concepto</dt>
              <dd className="text-ink font-semibold mt-1">{movimiento.concepto}</dd>
            </div>
            <div>
              <dt className="pk-label">Fecha</dt>
              <dd className="text-ink mt-1">{formatFecha(movimiento.fechaHora)}</dd>
            </div>
            <div>
              <dt className="pk-label">Cliente</dt>
              <dd className="mt-1">
                {movimiento.clienteId ? (
                  <Link to={`/clientes/${movimiento.clienteId}/cuenta-corriente`} className="font-semibold text-ink hover:underline">
                    #{movimiento.clienteId}
                  </Link>
                ) : (
                  <span className="text-ink-faint">Sin cliente</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="pk-label">Grupos</dt>
              <dd className="text-ink mt-1">
                {(movimiento.grupoFinancieroIds || []).length
                  ? movimiento.grupoFinancieroIds.map((gid) => (
                      <Link key={gid} to={`/grupos-financieros/${gid}`} className="mr-2 font-semibold hover:underline">
                        #{gid}
                      </Link>
                    ))
                  : "Sin grupo"}
              </dd>
            </div>
          </dl>

          <div>
            <h2 className="text-sm font-bold text-ink mb-2">Auditoría</h2>
            {auditorias.length === 0 ? (
              <p className="text-xs text-ink-faint">Sin registros de auditoría</p>
            ) : (
              <ul className="divide-y divide-line">
                {auditorias.map((a) => (
                  <li key={a.auditoriaMovimientoId} className="py-3">
                    <p className="text-sm font-semibold text-ink">{a.detalle}</p>
                    <p className="text-xs text-ink-muted mt-1">
                      {formatFecha(a.fechaHora)} · usuario {a.usuarioId}
                      {a.ip ? ` · ${a.ip}` : ""}
                    </p>
                    {a.userAgent && <p className="text-[11px] text-ink-faint mt-1 break-all">{a.userAgent}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
