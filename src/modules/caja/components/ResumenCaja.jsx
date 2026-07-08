import { TrendingUp, TrendingDown, Lock } from "lucide-react";
import { formatPrecio } from "../utils/formatters";

export default function ResumenCaja({
  resumen,
  tipoFiltro,
  onTipoFiltroChange,
  cantidadIngresos,
  cantidadGastos,
}) {
  const { totalIngresos, totalGastos, saldo, cerrada } = resumen;

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div
        onClick={() => onTipoFiltroChange(tipoFiltro === 0 ? null : 0)}
        className={`bg-white rounded-xl border px-4 py-4 cursor-pointer ${
          tipoFiltro === 0 ? "ring-2 ring-green-400" : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={14} className="text-green-500" />
          <p className="text-xs text-gray-400">Ingresos</p>
        </div>
        <p className="text-2xl font-semibold text-green-600">{formatPrecio(totalIngresos)}</p>
        <p className="text-xs text-gray-400 mt-0.5">{cantidadIngresos} movimientos</p>
      </div>

      <div
        onClick={() => onTipoFiltroChange(tipoFiltro === 1 ? null : 1)}
        className={`bg-white rounded-xl border px-4 py-4 cursor-pointer ${
          tipoFiltro === 1 ? "ring-2 ring-red-400" : "border-gray-100"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <TrendingDown size={14} className="text-red-400" />
          <p className="text-xs text-gray-400">Gastos</p>
        </div>
        <p className="text-2xl font-semibold text-red-500">{formatPrecio(totalGastos)}</p>
        <p className="text-xs text-gray-400 mt-0.5">{cantidadGastos} movimientos</p>
      </div>

      <div
        className={`rounded-xl border px-4 py-4 ${
          saldo >= 0 ? "bg-indigo-50 border-indigo-100" : "bg-red-50 border-red-100"
        }`}
      >
        <p className="text-xs text-gray-400 mb-1">Saldo</p>
        <p className={`text-2xl font-semibold ${saldo >= 0 ? "text-indigo-600" : "text-red-600"}`}>
          {formatPrecio(saldo)}
        </p>
        {cerrada && (
          <div className="flex items-center gap-1 mt-1">
            <Lock size={11} className="text-gray-400" />
            <p className="text-xs text-gray-400">Cerrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
