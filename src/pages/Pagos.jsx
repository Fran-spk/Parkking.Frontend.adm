import { useState, useEffect } from "react";
import { Search, FileDown } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { pagoMensualService } from "../services/pagoMensualService";

function formatFecha(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function formatMes(mes) {
  if (!mes) return "-";
  return new Date(mes + "T00:00:00").toLocaleDateString("es-AR", {
    month: "long", year: "numeric",
  });
}

function formatPrecio(precio) {
  if (!precio && precio !== 0) return "-";
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(precio);
}

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { cargarPagos(); }, [desde, hasta]);

  async function cargarPagos() {
    try {
      setError(null);
      setLoading(true);
      const desdeStr = desde
        ? `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-01`
        : null;
      const hastaStr = hasta
        ? `${hasta.getFullYear()}-${String(hasta.getMonth() + 1).padStart(2, "0")}-${new Date(hasta.getFullYear(), hasta.getMonth() + 1, 0).getDate()}`
        : null;
      const data = await pagoMensualService.getAll(desdeStr, hastaStr);
      setPagos(data);
    } catch {
      setError("No se pudo cargar los pagos");
    } finally {
      setLoading(false);
    }
  }

  const pagosFiltrados = pagos.filter(p => {
    const q = busqueda.toLowerCase();
    return (
      p.abonoCochera?.cochera?.numero?.toLowerCase().includes(q) ||
      p.abonoCochera?.cliente?.nombre?.toLowerCase().includes(q) ||
      p.responsable?.toLowerCase().includes(q)
    );
  });

  const totalMonto   = pagosFiltrados.reduce((acc, p) => acc + p.monto, 0);
  const totalRecargo = pagosFiltrados.reduce((acc, p) => acc + (p.recargo ?? 0), 0);
  const totalGeneral = totalMonto + totalRecargo;

  function limpiarFiltros() {
    setDesde(null);
    setHasta(null);
    setBusqueda("");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {pagosFiltrados.length} {pagosFiltrados.length === 1 ? "pago" : "pagos"}
          </p>
        </div>
        <button
        onClick={() => {
            pagoMensualService.reporteExcel().then((response) => {
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");

            link.href = url;
            link.setAttribute("download", "reporte_cocheras.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
            });
        }}
        className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
        <FileDown size={16} />
        Exportar
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Buscador */}
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cochera, cliente o responsable..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
          />
        </div>

        {/* Desde */}
        <div>
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
        </div>

        {/* Hasta */}
        <div>
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
        </div>

        {(desde || hasta || busqueda) && (
          <button
            onClick={limpiarFiltros}
            className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2.5 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Totales */}
      {pagosFiltrados.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Total cobrado",  value: totalMonto,   color: "text-gray-900"   },
            { label: "Total recargos", value: totalRecargo, color: "text-amber-600"  },
            { label: "Total general",  value: totalGeneral, color: "text-indigo-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className={`text-xl font-semibold mt-0.5 ${color}`}>{formatPrecio(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabla */}
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
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Mes</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Monto</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Recargo</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-10 text-sm">
                      No hay pagos para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  pagosFiltrados.map(pago => (
                    <tr key={pago.pagoMensualId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">
                        {formatFecha(pago.fechaHoraCarga)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">
                          {pago.abonoCochera?.cochera?.numero ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">
                          {pago.abonoCochera?.cliente?.nombre ?? "-"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {formatMes(pago.mes)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {formatPrecio(pago.monto)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pago.recargo > 0
                          ? <span className="text-amber-600">{formatPrecio(pago.recargo)}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {pago.responsable ?? <span className="text-gray-300">—</span>}
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