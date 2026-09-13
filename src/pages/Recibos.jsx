import { useEffect, useState } from "react";
import { Search, Printer, Ban, AlertCircle, Receipt, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { reciboService } from "../services/reciboService";
import { estacionamientoService } from "../services/estacionamientoService";
import { imprimirReciboPdf } from "../utils/imprimirRecibo";

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

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio) || 0);
}

function toYmd(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Recibos() {
  const [recibos, setRecibos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [metaEst, setMetaEst] = useState({ nombre: "Parkking", direccion: "" });

  useEffect(() => {
    estacionamientoService
      .get()
      .then((d) =>
        setMetaEst({
          nombre: d?.nombre || "Parkking",
          direccion: d?.direccion || "",
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [desde, hasta]);

  async function cargar() {
    try {
      setLoading(true);
      setError(null);
      const data = await reciboService.listar({
        desde: toYmd(desde) || undefined,
        hasta: toYmd(hasta) || undefined,
        q: busqueda.trim() || undefined,
      });
      setRecibos(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar los recibos");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuscar(e) {
    e?.preventDefault();
    await cargar();
  }

  async function handleImprimir(recibo) {
    try {
      setBusyId(recibo.reciboId);
      const fresh = await reciboService.getById(recibo.reciboId);
      imprimirReciboPdf(fresh, {
        nombreEstacionamiento: metaEst.nombre,
        direccion: metaEst.direccion,
      });
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo imprimir el recibo");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAnular(recibo) {
    const motivo = window.prompt(
      `Anular recibo ${recibo.numeroFormateado || recibo.numero}?\nMotivo (opcional):`,
      ""
    );
    if (motivo === null) return;
    try {
      setBusyId(recibo.reciboId);
      await reciboService.anular(recibo.reciboId, motivo || null);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo anular");
    } finally {
      setBusyId(null);
    }
  }

  const filtrados = recibos.filter((r) => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return true;
    return (
      (r.numeroFormateado || "").toLowerCase().includes(q) ||
      String(r.numero || "").includes(q) ||
      (r.clienteNombre || "").toLowerCase().includes(q) ||
      (r.cocherasLabel || "").toLowerCase().includes(q) ||
      (r.patentesLabel || "").toLowerCase().includes(q) ||
      (r.periodosLabel || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Recibos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Comprobantes de cobro. Reimprimí o anulá sin borrar el pago.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      <form
        onSubmit={handleBuscar}
        className="flex flex-col lg:flex-row gap-3 mb-5 bg-white border border-gray-100 rounded-2xl p-4"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="N°, cliente, cochera, patente..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <DatePicker
          selected={desde}
          onChange={setDesde}
          dateFormat="dd/MM/yyyy"
          locale={es}
          placeholderText="Desde"
          isClearable
          className="w-full lg:w-36 text-sm border border-gray-200 rounded-xl px-3 py-2.5"
        />
        <DatePicker
          selected={hasta}
          onChange={setHasta}
          dateFormat="dd/MM/yyyy"
          locale={es}
          placeholderText="Hasta"
          isClearable
          className="w-full lg:w-36 text-sm border border-gray-200 rounded-xl px-3 py-2.5"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
        >
          Buscar
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 p-8">
            <Loader2 size={16} className="animate-spin" /> Cargando recibos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Sin recibos</p>
            <p className="text-xs text-gray-400 mt-1">Se generan al registrar un pago.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-50">
                  <th className="px-4 py-3 font-bold">N°</th>
                  <th className="px-4 py-3 font-bold">Fecha</th>
                  <th className="px-4 py-3 font-bold">Cliente</th>
                  <th className="px-4 py-3 font-bold">Cochera / Patente</th>
                  <th className="px-4 py-3 font-bold">Período</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => {
                  const busy = busyId === r.reciboId;
                  return (
                    <tr
                      key={r.reciboId}
                      className={`border-b border-gray-50 last:border-0 ${
                        r.anulado ? "bg-gray-50/80 opacity-75" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">
                        {r.numeroFormateado || r.numero}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatFecha(r.fechaEmision)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.clienteNombre}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{r.cocherasLabel || "—"}</div>
                        {r.patentesLabel && (
                          <div className="text-xs font-mono text-gray-400">{r.patentesLabel}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={r.periodosLabel}>
                        {r.periodosLabel || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatPrecio(r.total)}
                      </td>
                      <td className="px-4 py-3">
                        {r.anulado ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                            Anulado
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Vigente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            title="Imprimir / PDF"
                            onClick={() => handleImprimir(r)}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                          </button>
                          {!r.anulado && (
                            <button
                              type="button"
                              disabled={busy}
                              title="Anular"
                              onClick={() => handleAnular(r)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
