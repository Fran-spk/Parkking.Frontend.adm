import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Filter,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { mensajeService } from "../services/mensajeService";

/** @typedef {import("../types").Mensaje} Mensaje */

const TIPOS = [
  { value: "", label: "Todos los tipos" },
  { value: "Recibo", label: "Envío de recibo" },
  { value: "Reporte", label: "Envío de reporte" },
  { value: "ActualizacionTarifas", label: "Actualización de tarifas" },
];

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "Enviado", label: "Enviado" },
  { value: "Error", label: "Error" },
  { value: "Simulado", label: "Simulado" },
];

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

function labelTipo(tipo) {
  return TIPOS.find((t) => t.value === tipo)?.label || tipo || "—";
}

function EstadoBadge({ estado, simulado }) {
  const e = String(estado || "").toLowerCase();
  if (simulado || e === "simulado") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
        <FlaskConical size={11} /> Simulado
      </span>
    );
  }
  if (e === "enviado") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
        <CheckCircle2 size={11} /> Enviado
      </span>
    );
  }
  if (e === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
        <AlertCircle size={11} /> Error
      </span>
    );
  }
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
      {estado || "—"}
    </span>
  );
}

function EstadoConError({ mensaje }) {
  const [abierto, setAbierto] = useState(false);
  const tieneError = Boolean(mensaje.error);

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
        <EstadoBadge estado={mensaje.estado} simulado={mensaje.simulado} />
        {tieneError && (
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="inline-flex items-center gap-0.5 text-[11px] text-rose-600 hover:text-rose-800 font-medium"
            aria-expanded={abierto}
          >
            {abierto ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {abierto ? "Ocultar" : "Detalle"}
          </button>
        )}
      </div>
      {tieneError && abierto && (
        <p className="text-[11px] text-rose-600 mt-1.5 max-w-xs break-words bg-rose-50/80 border border-rose-100 rounded-lg px-2 py-1.5">
          {mensaje.error}
        </p>
      )}
    </div>
  );
}

export default function MensajesEnviados() {
  const [items, setItems] = useState(/** @type {Mensaje[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mensajeService.listar({
        tipo: tipo || undefined,
        estado: estado || undefined,
        take: 200,
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      const data = e.response?.data;
      setError(
        (typeof data === "string" && data) ||
          data?.error ||
          "No se pudieron cargar los mensajes"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [tipo, estado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Mail size={20} className="text-indigo-600" />
            Mensajes enviados
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Auditoría de emails del estacionamiento: recibos, reportes y avisos.
          </p>
        </div>
        <button
          type="button"
          onClick={cargar}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white border border-transparent rounded-xl px-4 py-3">
        <Filter size={14} className="text-gray-400" />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          {TIPOS.map((t) => (
            <option key={t.value || "all"} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          {ESTADOS.map((s) => (
            <option key={s.value || "all"} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-transparent overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 p-8">
            <Loader2 size={16} className="animate-spin" /> Cargando…
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 p-8">No hay mensajes con estos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Destinatario</th>
                  <th className="px-4 py-3 font-semibold">Asunto</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr
                    key={m.mensajeId}
                    className="border-b border-gray-50 hover:bg-gray-50/50 align-top"
                  >
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {formatFecha(m.fecha)}
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                      {labelTipo(m.tipo)}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoConError mensaje={m} />
                    </td>
                    <td className="px-4 py-3 text-gray-700 break-all max-w-[220px]">
                      {m.destinatario || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-md">
                      <span className="line-clamp-2">{m.asunto || "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
