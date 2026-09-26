import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, Receipt, CreditCard, Calendar } from "lucide-react";
import { pagoService } from "../../services/pagoService";

/** @typedef {import("../../types").Pago} Pago */

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFechaHora(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio) || 0);
}

const ESTADO_CUOTA = {
  0: { label: "Pendiente", cls: "bg-amber-50 text-amber-700" },
  1: { label: "Parcial", cls: "bg-sky-50 text-sky-700" },
  2: { label: "Pagada", cls: "bg-emerald-50 text-emerald-700" },
  3: { label: "Anulada", cls: "bg-slate-100 text-slate-500" },
};

/**
 * Detalle de un pago (transacción) con desglose por período.
 * Acepta un pago ya cargado o solo `pagoId` (fetch).
 */
export default function ModalDetallePago({ pago: pagoInicial, pagoId, onClose, onVerRecibo }) {
  const [pago, setPago] = useState(/** @type {Pago | null} */ (pagoInicial || null));
  const [loading, setLoading] = useState(!pagoInicial?.detalles);
  const [error, setError] = useState(null);

  const id = pagoId ?? pagoInicial?.pagoId;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    // Si ya viene con detalles, no refetch obligatorio; igual refrescamos para datos frescos.
    setLoading(true);
    setError(null);
    pagoService
      .getDetalles(id)
      .then((data) => {
        if (!cancelled) setPago(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (pagoInicial) {
          setPago(pagoInicial);
        } else {
          const msg = err.response?.data;
          setError(typeof msg === "string" ? msg : "No se pudo cargar el detalle del pago");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const detalles = pago?.detalles || [];
  const monto = Number(pago?.monto || 0);
  const recargo = Number(pago?.recargo || 0);
  const total = monto + recargo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detalle de pago</p>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {pago ? `Pago #${pago.pagoId}` : "Pago"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {loading && !pago && (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Cargando…
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {pago && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 px-3.5 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Total</p>
                  <p className="text-xl font-black text-slate-900 tabular-nums">{formatPrecio(total)}</p>
                  {recargo > 0 && (
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      {formatPrecio(monto)} + {formatPrecio(recargo)} recargo
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-slate-50 px-3.5 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span>{formatFechaHora(pago.fechaHoraCarga)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <CreditCard size={14} className="text-slate-400 shrink-0" />
                    <span>{pago.metodoDePagoNombre || "Sin método"}</span>
                  </div>
                  {(pago.reciboNumero || pago.reciboId) && (
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Receipt size={14} className="text-slate-400 shrink-0" />
                      <span>Recibo {pago.reciboNumero || `#${pago.reciboId}`}</span>
                    </div>
                  )}
                </div>
              </div>

              {(pago.clienteNombre || pago.numeroCochera) && (
                <div className="text-sm text-slate-600">
                  {pago.clienteNombre && (
                    <p>
                      <span className="text-slate-400">Cliente · </span>
                      <span className="font-semibold text-slate-800">{pago.clienteNombre}</span>
                    </p>
                  )}
                  {pago.numeroCochera && (
                    <p className="mt-0.5">
                      <span className="text-slate-400">Cochera · </span>
                      <span className="font-semibold text-slate-800">{pago.numeroCochera}</span>
                    </p>
                  )}
                </div>
              )}

              {pago.observacion && (
                <div className="rounded-xl border border-slate-100 px-3.5 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                    Observación
                  </p>
                  <p className="text-sm text-slate-700">{pago.observacion}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
                  Períodos cubiertos · {detalles.length || 0}
                </p>
                {detalles.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3">Sin desglose de períodos</p>
                ) : (
                  <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
                    {detalles.map((d) => {
                      const est = ESTADO_CUOTA[d.estadoCuota] || ESTADO_CUOTA[0];
                      return (
                        <div
                          key={d.detallePagoId}
                          className="flex items-start justify-between gap-3 px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 capitalize">
                              {d.periodoLabel || formatFecha(d.periodoInicio)}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${est.cls}`}>
                                {est.label}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                Cuota {formatPrecio(d.montoCuota)}
                                {Number(d.saldoCuota) > 0
                                  ? ` · saldo ${formatPrecio(d.saldoCuota)}`
                                  : ""}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                            {formatPrecio(d.monto)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2">
          {onVerRecibo && pago && (
            <button
              type="button"
              onClick={() => onVerRecibo(pago)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Receipt size={14} /> Ver recibo
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
