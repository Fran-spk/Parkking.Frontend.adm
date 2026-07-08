import { TrendingUp, TrendingDown } from "lucide-react";
import { formatFecha, formatPrecio } from "../utils/formatters";
import FiltroFechas from "./FiltroFechas";

export default function TablaAuditoria({
  movimientos,
  loading,
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
}) {
  return (
    <div>
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Auditoría</h2>
          <p className="text-xs text-gray-400 mt-0.5">{movimientos.length} en total</p>
        </div>
        <FiltroFechas
          desde={desde}
          hasta={hasta}
          onDesdeChange={onDesdeChange}
          onHastaChange={onHastaChange}
        />
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 px-5 py-10">Cargando auditoría...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Concepto</th>
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Descripción</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Saldo anterior</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Saldo posterior</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-10 text-sm">
                    Sin movimientos
                  </td>
                </tr>
              ) : (
                movimientos.map(mov => (
                  <tr
                    key={mov.movimientoCajaId}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatFecha(mov.fechaHora)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {mov.usuario ?? <span className="text-gray-300">—</span>}
                    </td>
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
                    <td className="px-4 py-3 text-gray-700">{mov.tipoConceptoDescripcion}</td>
                    <td className="px-4 py-3 text-gray-700">{mov.descripcion}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatPrecio(mov.saldoAnterior)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {formatPrecio(mov.saldoPosterior)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                        mov.tipo === 0 ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {mov.tipo === 1 ? "- " : ""}
                      {formatPrecio(mov.monto)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
