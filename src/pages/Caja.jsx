import { useState, useEffect } from "react";
import { Plus, X, TrendingUp, TrendingDown, Lock } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { cajaMensualService } from "../services/cajaMensualService";

function formatFecha(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(precio ?? 0);
}

// ─── Modal agregar gasto ──────────────────────────────────────────────────────
function ModalGasto({ mes, onClose, onGuardado }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [responsable, setResponsable] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function handleGuardar() {
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return; }
    if (!monto || Number(monto) <= 0) { setError("Ingresá un monto válido"); return; }
    try {
      setGuardando(true);
      setError(null);
      await cajaMensualService.registrarGasto(
        mes.getFullYear(),
        mes.getMonth() + 1,
        descripcion.trim(),
        Number(monto),
        responsable.trim() || null,
        3, // Gasto operativo 
      );
      onGuardado();
      onClose();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo registrar el gasto");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Agregar gasto</h2>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Descripción <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={descripcion}
              onChange={e => { setDescripcion(e.target.value); setError(null); }}
              placeholder="Ej: Limpieza, combustible..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Monto <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={monto}
                onChange={e => { setMonto(e.target.value); setError(null); }}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Responsable</label>
              <input
                value={responsable}
                onChange={e => setResponsable(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 text-sm text-white bg-indigo-600 rounded-lg py-2.5 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────
export default function Caja() {
  const [mes, setMes] = useState(new Date());
  const [caja, setCaja] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalGasto, setModalGasto] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState(null);

  useEffect(() => { cargarCaja(); }, [mes]);

  async function cargarCaja() {
    try {
      setError(null);
      setLoading(true);
        const data = await cajaMensualService.getByMes(
        mes.getFullYear(),
        mes.getMonth() + 1,
        );
      setCaja(data);
    } catch (e) {
      if (e.response?.status === 404) {
        setCaja(null); // mes sin caja
      } else {
        setError("No se pudo cargar la caja");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCerrar() {
    if (!confirm("¿Cerrar la caja de este mes? No se podrán agregar más movimientos.")) return;
    try {
      setCerrando(true);
      await cajaMensualService.cerrar(mes.getFullYear(), mes.getMonth() + 1);
      cargarCaja();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo cerrar la caja");
    } finally {
      setCerrando(false);
    }
  }

    const movimientosOriginal = caja?.movimientos ?? [];

    const movimientos = tipoFiltro === null
  ? movimientosOriginal
  : movimientosOriginal.filter(m => m.tipo === tipoFiltro);
  const ingresos  = movimientosOriginal.filter(m => m.tipo === 0);
  const gastos    = movimientosOriginal.filter(m => m.tipo === 1);
  const totalIngresos = ingresos.reduce((acc, m) => acc + m.monto, 0);
  const totalGastos   = gastos.reduce((acc, m) => acc + m.monto, 0);
  const saldo         = totalIngresos - totalGastos;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Caja</h1>
          <p className="text-sm text-gray-400 mt-0.5">Movimientos mensuales</p>
        </div>

        {/* Selector de mes */}
        <DatePicker
          selected={mes}
          onChange={setMes}
          locale={es}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          className="text-sm font-medium border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white cursor-pointer"
        />
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">Cargando...</div>
      ) : !caja ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
          <p className="text-sm text-gray-400">No hay caja para este mes</p>
          <p className="text-xs text-gray-300 mt-1">Se crea automáticamente al registrar el primer pago</p>
        </div>
      ) : (
        <>
          {/* Arqueo */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div 
            onClick={() => setTipoFiltro(tipoFiltro === 0 ? null : 0)}
            className={`bg-white rounded-xl border px-4 py-4 cursor-pointer ${
            tipoFiltro === 0 ? "ring-2 ring-green-400" : "border-gray-100"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-green-500" />
                <p className="text-xs text-gray-400">Ingresos</p>
            </div>
              <p className="text-2xl font-semibold text-green-600">{formatPrecio(totalIngresos)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{ingresos.length} movimientos</p>
            </div>
            <div 
            onClick={() => setTipoFiltro(tipoFiltro === 1 ? null : 1)}
            className={`bg-white rounded-xl border px-4 py-4 cursor-pointer ${
            tipoFiltro === 1 ? "ring-2 ring-red-400" : "border-gray-100"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={14} className="text-red-400" />
                <p className="text-xs text-gray-400">Gastos</p>
            </div>
              <p className="text-2xl font-semibold text-red-500">{formatPrecio(totalGastos)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{gastos.length} movimientos</p>
            </div>
            <div className={`rounded-xl border px-4 py-4 ${saldo >= 0 ? "bg-indigo-50 border-indigo-100" : "bg-red-50 border-red-100"}`}>
              <p className="text-xs text-gray-400 mb-1">Saldo</p>
              <p className={`text-2xl font-semibold ${saldo >= 0 ? "text-indigo-600" : "text-red-600"}`}>
                {formatPrecio(saldo)}
              </p>
              {caja.cerrada && (
                <div className="flex items-center gap-1 mt-1">
                  <Lock size={11} className="text-gray-400" />
                  <p className="text-xs text-gray-400">Cerrada</p>
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          {!caja.cerrada && (
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setModalGasto(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Agregar gasto operativo
              </button>
              <button
                onClick={handleCerrar}
                disabled={cerrando}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <Lock size={14} />
                {cerrando ? "Cerrando..." : "Cerrar caja"}
              </button>
            </div>
          )}

          {/* Movimientos */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Movimientos</h2>
              <p className="text-xs text-gray-400 mt-0.5">{movimientos.length} en total</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Fecha</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Tipo</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Descripción</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Concepto</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Responsable</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-400 py-10 text-sm">
                        Sin movimientos
                      </td>
                    </tr>
                  ) : (
                    movimientos
                      .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
                    .map(mov => (
  <tr key={mov.movimientoCajaId} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
    
    {/* Fecha */}
    <td className="px-4 py-3 text-gray-500 text-xs">
      {formatFecha(mov.fechaHora)}
    </td>

    {/* Tipo */}
    <td className="px-4 py-3">
      {mov.tipo === 0 ? (
        <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-full">
          <TrendingUp size={10} />
          {mov.tipoDescripcion}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">
          <TrendingDown size={10} />
          {mov.tipoDescripcion}
        </span>
      )}
    </td>

    {/* Desc */}
    <td className="px-4 py-3 text-gray-700">
      {mov.descripcion}
    </td>

    {/* Concepto */}
    <td className="px-4 py-3 text-gray-700">
      {mov.tipoConceptoDescripcion}
    </td>

    {/* Responsable */}
    <td className="px-4 py-3 text-gray-500">
      {mov.responsable ?? <span className="text-gray-300">—</span>}
    </td>

    {/* Monto */}
    <td className={`px-4 py-3 text-right font-medium ${mov.tipo === 0 ? "text-green-600" : "text-red-500"}`}>
      {mov.tipo === 1 ? "- " : ""}
      {formatPrecio(mov.monto)}
    </td>

  </tr>
))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {modalGasto && (
        <ModalGasto
          mes={mes}
          onClose={() => setModalGasto(false)}
          onGuardado={cargarCaja}
        />
      )}
    </div>
  );
}