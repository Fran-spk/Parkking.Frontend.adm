import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { movimientoService } from "../services/movimientoService";
import { etiquetaMovimiento } from "../types/finanzas.js";
import { plata, fechaCorta } from "../utils/clienteHelpers";
import { bordeMov } from "../utils/finanzasHelpers";

/** @typedef {import("../types").MovimientoDetalle} MovimientoDetalle */

function hora(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
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
  const importe = Number(movimiento?.importe || 0);

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> Volver
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando movimiento…</span>
        </div>
      ) : (
        <>
          <PageHeader
            title={movimiento ? etiquetaMovimiento(movimiento) : "Movimiento"}
            description="Detalle y auditoría. El importe es el del estacionamiento y del grupo."
            stats={
              movimiento
                ? [
                    { label: "Importe", value: plata(importe), tone: importe < 0 ? "danger" : "success" },
                    { label: "Usuario", value: movimiento.usuarioId },
                    { label: "Fecha", value: fechaCorta(movimiento.fechaHora) },
                  ]
                : null
            }
          />

          {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

          {movimiento && (
            <>
              <div className={`bg-surface-card px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-l-[3px] ${bordeMov(importe)}`}>
                <div>
                  <p className="pk-label">Concepto</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">{movimiento.concepto}</p>
                </div>
                <div>
                  <p className="pk-label">Hora</p>
                  <p className="text-sm font-semibold text-ink tabular-nums mt-0.5">{hora(movimiento.fechaHora)}</p>
                </div>
                <div>
                  <p className="pk-label">Cliente</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {movimiento.clienteId ? (
                      <Link to={`/clientes/${movimiento.clienteId}/cuenta-corriente`} className="text-ink hover:text-brand">
                        Cliente #{movimiento.clienteId}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">Sin cliente</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="pk-label">Abono</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {movimiento.abonoId ? (
                      <Link to={`/pagosAbono/${movimiento.abonoId}`} className="text-ink hover:text-brand">
                        Abono #{movimiento.abonoId}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">Sin abono</span>
                    )}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="pk-label">Grupos</p>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {(movimiento.grupoFinancieroIds || []).length ? (
                      movimiento.grupoFinancieroIds.map((gid) => (
                        <Link key={gid} to={`/cuenta-corriente?grupo=${gid}`} className="px-1.5 py-0.5 bg-surface-muted text-[11px] font-bold text-ink hover:text-brand">
                          #{gid}
                        </Link>
                      ))
                    ) : (
                      <span className="text-ink-faint text-sm">Sin grupo</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-surface-card overflow-hidden">
                <div className="px-4 py-3 border-b border-line">
                  <h2 className="pk-label">Auditoría</h2>
                </div>
                {auditorias.length === 0 ? (
                  <p className="px-4 py-10 text-center pk-caption">Sin registros de auditoría</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {auditorias.map((a) => (
                      <li key={a.auditoriaMovimientoId} className="px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{a.detalle}</p>
                        <p className="pk-caption mt-0.5">
                          {fechaCorta(a.fechaHora)} {hora(a.fechaHora)} · usuario {a.usuarioId}
                          {a.ip ? ` · ${a.ip}` : ""}
                        </p>
                        {a.userAgent && <p className="pk-caption mt-0.5 break-all">{a.userAgent}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
