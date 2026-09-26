import { useCallback, useEffect, useState } from "react";
import { Mail, Loader2, RefreshCw, AlertCircle, CheckCircle2, FlaskConical } from "lucide-react";
import { mensajeService } from "../../services/mensajeService";
import { reciboService } from "../../services/reciboService";

/** @typedef {import("../../types").Mensaje} Mensaje */

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

function EstadoBadge({ estado, simulado }) {
  const e = String(estado || "").toLowerCase();
  if (simulado || e === "simulado") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
        <FlaskConical size={10} /> Simulado
      </span>
    );
  }
  if (e === "enviado") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle2 size={10} /> Enviado
      </span>
    );
  }
  if (e === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
        <AlertCircle size={10} /> Error
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      {estado || "—"}
    </span>
  );
}

/**
 * Histórico de mensajes (emails) de un abono o de un recibo.
 * props: abonoId XOR reciboId; compact=true para lista más chica (Recibos).
 */
export default function HistorialMensajes({ abonoId, reciboId, compact = false, className = "" }) {
  const [items, setItems] = useState(/** @type {Mensaje[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = abonoId
        ? await mensajeService.porAbono(abonoId)
        : await mensajeService.porRecibo(reciboId);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      const data = e.response?.data;
      setError(
        (typeof data === "string" && data) ||
          data?.error ||
          "No se pudo cargar el historial de mensajes"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [abonoId, reciboId]);

  useEffect(() => {
    if (!abonoId && !reciboId) return;
    cargar();
  }, [abonoId, reciboId, cargar]);

  async function reenviar(m) {
    if (!m?.reciboId) return;
    try {
      setBusyId(m.mensajeId);
      setOkMsg(null);
      setError(null);
      const res = await reciboService.enviarEmail(m.reciboId);
      if (res?.simulado) {
        setOkMsg(`Simulado → ${res.destinatario}`);
      } else {
        setOkMsg(`Reenviado a ${res?.destinatario || m.destinatario}`);
      }
      await cargar();
    } catch (e) {
      const data = e.response?.data;
      setError(
        (typeof data === "string" && data) ||
          data?.error ||
          "No se pudo reenviar"
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div
      className={`bg-white rounded-xl border border-transparent overflow-hidden ${className}`}
    >
      <div className="px-4 sm:px-5 py-3 border-b border-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Mail size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">Mensajes enviados</h3>
            <p className="text-[11px] text-gray-400 truncate">
              Recibos y reportes con estado de entrega
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={loading}
          title="Actualizar"
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {(error || okMsg) && (
        <div
          className={`px-4 py-2 text-xs font-medium border-b ${
            error
              ? "bg-rose-50 text-rose-700 border-rose-100"
              : "bg-emerald-50 text-emerald-700 border-emerald-100"
          }`}
        >
          {error || okMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 px-5 py-6">
          <Loader2 size={14} className="animate-spin" /> Cargando…
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-gray-500">Todavía no hay envíos registrados.</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Aparecen al mandar un recibo por email (manual o al cobrar).
          </p>
        </div>
      ) : (
        <ul className={`divide-y divide-gray-50 ${compact ? "max-h-56 overflow-y-auto" : ""}`}>
          {items.map((m) => {
            const puedeReenviar =
              m.reciboId &&
              (String(m.estado).toLowerCase() === "error" ||
                String(m.estado).toLowerCase() === "simulado");
            return (
              <li
                key={m.mensajeId}
                className="px-4 sm:px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EstadoBadge estado={m.estado} simulado={m.simulado} />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      {m.tipo || "Mensaje"}
                    </span>
                    <span className="text-[11px] text-gray-400">{formatFecha(m.fecha)}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                    {m.asunto || "Sin asunto"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">→ {m.destinatario}</p>
                  {m.error && (
                    <p className="text-[11px] text-rose-600 mt-1 line-clamp-2" title={m.error}>
                      {m.error}
                    </p>
                  )}
                </div>
                {puedeReenviar && (
                  <button
                    type="button"
                    disabled={busyId === m.mensajeId}
                    onClick={() => reenviar(m)}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg disabled:opacity-40"
                  >
                    {busyId === m.mensajeId ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )}
                    Reenviar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
