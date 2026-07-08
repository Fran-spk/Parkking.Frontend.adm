import { formatPrecio } from "../utils/formatters";

export default function TablaConceptos({ conceptos, loading }) {
  return (
    <div>
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Conceptos</h2>
        <p className="text-xs text-gray-400 mt-0.5">{conceptos.length} en total</p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 px-5 py-10">Cargando conceptos...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Concepto</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Cantidad de movimientos</th>
                <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {conceptos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-10 text-sm">
                    Sin conceptos
                  </td>
                </tr>
              ) : (
                conceptos.map(c => (
                  <tr
                    key={c.tipoConcepto}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-700">{c.tipoConceptoDescripcion}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{c.cantidadMovimientos}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                      {formatPrecio(c.total)}
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
