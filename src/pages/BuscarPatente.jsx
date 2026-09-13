import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Car, User, ParkingSquare, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { abonoService } from "../services/abonoService";
import {
  abonoIdOf,
  labelCocheras,
  plazasDe,
  vehiculosDe,
  modalidadLabel,
  MODALIDAD,
} from "../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";

function formatFecha(fecha) {
  if (!fecha) return "—";
  const solo = String(fecha).split("T")[0];
  const [y, m, d] = solo.split("-").map(Number);
  return new Date(y, m - 1, d || 1).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrecio(precio) {
  if (precio == null || precio === "") return "Tarifa de lista";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio));
}

function periodicidadLabel(value) {
  return PERIODICIDAD_OPTIONS.find((o) => o.value === Number(value))?.label || "Mensual";
}

export default function BuscarPatente() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function buscar(e) {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError("Ingresá al menos 2 caracteres");
      setResultados(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await abonoService.buscarPorPatente(q);
      setResultados(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo buscar");
      setResultados(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Buscar patente</h1>
        <p className="text-sm text-gray-500 mt-1">
          Encontrá abonos por patente (parcial o completa) y entrá al detalle de cobros.
        </p>
      </div>

      <form
        onSubmit={buscar}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-6"
      >
        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
          Patente
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value.toUpperCase())}
              placeholder="Ej. AB123 / AB123CD"
              autoFocus
              className="w-full pl-10 pr-4 py-3 text-sm font-mono font-bold tracking-wider border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-gray-50/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Buscar
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}

      {resultados && resultados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-12 text-center">
          <Car className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700">Sin abonos para esa patente</p>
          <p className="text-xs text-gray-400 mt-1">Probá con otra búsqueda o revisá si el vehículo está cargado.</p>
        </div>
      )}

      {resultados && resultados.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {resultados.length} resultado{resultados.length !== 1 ? "s" : ""}
          </p>
          {resultados.map((abono) => {
            const id = abonoIdOf(abono);
            const esActivo = abono.activo === true || abono.activo === "true";
            const plazas = plazasDe(abono);
            const vehiculos = vehiculosDe(abono);

            return (
              <div
                key={id}
                className={`bg-white rounded-2xl border p-5 transition-shadow hover:shadow-md ${
                  esActivo ? "border-gray-100" : "border-gray-100 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-lg font-bold text-gray-900">
                        <ParkingSquare size={18} className="text-indigo-500" />
                        {labelCocheras(abono)}
                      </span>
                      {esActivo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                          BAJA
                        </span>
                      )}
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {periodicidadLabel(abono.periodicidadCobro)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {plazas[0]?.cochera?.categoriaCochera?.nombre || "Sin categoría"}
                      {" · "}
                      Desde {formatFecha(abono.fechaInicio)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/pagosAbono/${id}`)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <CreditCard size={14} />
                    Ver abono
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-50">
                  <div className="flex items-start gap-2">
                    <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Cliente</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {abono.cliente?.nombre || "—"}
                      </p>
                      {abono.cliente?.telefono && (
                        <p className="text-xs text-gray-400">{abono.cliente.telefono}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Vehículos</p>
                    <div className="space-y-1">
                      {vehiculos.map((v, i) => (
                        <div
                          key={v.abonoVehiculoId ?? `${v.patente}-${i}`}
                          className="flex items-center gap-1.5 flex-wrap"
                        >
                          <span className="font-mono text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                            {v.patente || "S/PAT"}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                              Number(v.modalidad) === MODALIDAD.FLEXIBLE
                                ? "bg-amber-50 text-amber-700"
                                : "bg-indigo-50 text-indigo-600"
                            }`}
                          >
                            {modalidadLabel(v.modalidad)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Precio</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatPrecio(abono.precioAcordado)}
                    </p>
                    {abono.cobrador && (
                      <p className="text-xs text-gray-400 mt-0.5">Cobrador: {abono.cobrador}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
