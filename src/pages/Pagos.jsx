import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { pagoService } from "../services/pagoService";

function formatFecha(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPeriodo(pago) {
  const detalles = pago.detalles || [];
  if (detalles.length === 1) return detalles[0].periodoLabel || "-";
  if (detalles.length > 1) {
    return `${detalles.length} períodos`;
  }
  if (!pago.mes) return "-";
  return new Date(String(pago.mes).split("T")[0] + "T00:00:00").toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function formatPrecio(precio) {
  if (!precio && precio !== 0) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(precio);
}

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPagos();
  }, [desde, hasta]);

  async function cargarPagos() {
    try {
      setError(null);
      setLoading(true);
      const desdeStr = desde
        ? `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-01`
        : null;
      const hastaStr = hasta
        ? `${hasta.getFullYear()}-${String(hasta.getMonth() + 1).padStart(2, "0")}-${new Date(
            hasta.getFullYear(),
            hasta.getMonth() + 1,
            0
          ).getDate()}`
        : null;
      const data = await pagoService.getAll(desdeStr, hastaStr);
      setPagos(data);
    } catch {
      setError("No se pudo cargar los pagos");
    } finally {
      setLoading(false);
    }
  }

  const pagosFiltrados = pagos.filter((p) => {
    const q = busqueda.toLowerCase();
    if (!q) return true;
    return (
      (p.numeroCochera || "").toLowerCase().includes(q) ||
      (p.clienteNombre || "").toLowerCase().includes(q) ||
      (p.observacion || "").toLowerCase().includes(q) ||
      (p.detalles || []).some((d) => (d.periodoLabel || "").toLowerCase().includes(q))
    );
  });

  const totalMonto = pagosFiltrados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const totalRecargo = pagosFiltrados.reduce((acc, p) => acc + Number(p.recargo || 0), 0);
  const totalGeneral = totalMonto + totalRecargo;

  function limpiarFiltros() {
    setDesde(null);
    setHasta(null);
    setBusqueda("");
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {pagosFiltrados.length} {pagosFiltrados.length === 1 ? "transacción" : "transacciones"}
            {" · "}cada pago puede cubrir uno o varios períodos
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cochera, cliente o período..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
          />
        </div>

        <DatePicker
          selected={desde}
          onChange={setDesde}
          locale={es}
          dateFormat="MM/yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          placeholderText="Desde"
          isClearable
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 w-36"
        />

        <DatePicker
          selected={hasta}
          onChange={setHasta}
          locale={es}
          dateFormat="MM/yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          placeholderText="Hasta"
          isClearable
          minDate={desde}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 w-36"
        />

        {(desde || hasta || busqueda) && (
          <button onClick={limpiarFiltros} className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2.5 transition-colors">
            Limpiar
          </button>
        )}
      </div>

      {pagosFiltrados.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total cobrado", value: totalMonto, color: "text-gray-900" },
            { label: "Total recargos", value: totalRecargo, color: "text-amber-600" },
            { label: "Total general", value: totalGeneral, color: "text-indigo-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-xl font-semibold mt-0.5 ${color}`}>{formatPrecio(value)}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Fecha pago</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Cochera</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Cliente</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Período(s)</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Monto</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Recargo</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 py-10 text-sm">
                      No hay pagos para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  pagosFiltrados.map((pago) => (
                    <tr key={pago.pagoId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors align-top">
                      <td className="px-4 py-3 text-gray-500">{formatFecha(pago.fechaHoraCarga)}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{pago.numeroCochera ?? "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{pago.clienteNombre ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        <p>{formatPeriodo(pago)}</p>
                        {(pago.detalles || []).length > 1 && (
                          <div className="mt-1 space-y-0.5">
                            {pago.detalles.map((d) => (
                              <p key={d.detallePagoId} className="text-xs text-gray-400">
                                {d.periodoLabel}: {formatPrecio(d.monto)}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatPrecio(Number(pago.monto || 0) + Number(pago.recargo || 0))}
                        {(pago.detalles || []).length > 1 && (
                          <p className="text-[10px] font-normal text-gray-400">
                            {pago.detalles.length} períodos
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pago.recargo > 0 ? (
                          <span className="text-amber-600">{formatPrecio(pago.recargo)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
