import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, CreditCard, Search } from "lucide-react";
import { abonoService } from "../services/abonoService";
import ModalNuevoAbono from "../components/layout/ModalNuevoAbono";
import ModalEditarAbono from "../components/layout/ModalEditarAbono";
import { useNavigate } from "react-router-dom";

export default function Abonos() {
  const [abonos, setAbonos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [verHistoricos, setVerHistoricos] = useState(false); // <-- Estado para el toggle
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Recargar cada vez que cambie el switch de históricos
  useEffect(() => { cargarAbonos(); }, [verHistoricos]);

  async function cargarAbonos() {
    try {
      setLoading(true);
      setError(null);
      
      // Llamamos a un endpoint u otro según el estado del switch
      const data = verHistoricos 
        ? await abonoService.getAllAbonos() 
        : await abonoService.getOcupadas();
        
      setAbonos(data);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  const abonosFiltrados = abonos.filter(a => {
    const q = busqueda.toLowerCase();
    return (
      a.cochera?.numero?.toLowerCase().includes(q) ||
      a.cliente?.nombre?.toLowerCase().includes(q) ||
      a.patente?.toLowerCase().includes(q) ||
      a.modeloVehiculo?.toLowerCase().includes(q) ||
      a.cobrador?.toLowerCase().includes(q)
    );
  });

  function formatFecha(fecha) {
    if (!fecha) return "-";
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  }

  async function handleDarDeBaja(abono) {
    const confirmado = confirm(
      `¿Dar de baja el abono de ${abono.cliente?.nombre} en cochera ${abono.cochera?.numero}?\n\nEsta acción liberará la cochera.`
    );
    if (!confirmado) return;
    try {
      await abonoService.darDeBaja(abono.abonoCocheraId);
      cargarAbonos();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja el abono");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Abonos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {verHistoricos ? `${abonos.length} registros totales` : `${abonos.length} abonos activos`}
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nuevo abono
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Buscador + Filtro Checkbox Estético */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-5">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por cochera, cliente, patente o cobrador..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
          />
        </div>
        
        {/* Switch / Checkbox Estilo UI moderna */}
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 self-end sm:self-auto">
          <div className="relative">
            <input 
              type="checkbox" 
              checked={verHistoricos}
              onChange={(e) => setVerHistoricos(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
          </div>
          <span className="text-sm font-medium text-gray-600">Incluir históricos</span>
        </label>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Cochera</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Cliente</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Vehículo</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Patente</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Cobrador</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Estado</th> {/* Nueva columna */}
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Fecha inicio</th>
                  <th className="text-right text-xs font-medium text-gray-400 px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-400 py-10 text-sm">
                      No se encontraron abonos
                    </td>
                  </tr>
                ) : (
                  abonosFiltrados.map(abono => {
                    // Validamos la propiedad activo (asumo booleano, si es string "true"/"false" se adapta fácilmente)
                    const esActivo = abono.activo === true || abono.activo === "true";

                    return (
                      <tr 
                        key={abono.abonoCocheraId} 
                        className={`border-b border-gray-50 transition-colors ${!esActivo ? 'bg-gray-50/50 hover:bg-gray-50' : 'hover:bg-gray-50'}`}
                      >
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${esActivo ? 'text-gray-800' : 'text-gray-500 line-through'}`}>
                            {abono.cochera?.numero ?? "-"}
                          </span>
                          {abono.cochera?.categoriaCochera?.nombre && (
                            <p className="text-xs text-gray-400">{abono.cochera.categoriaCochera.nombre}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className={`font-medium ${esActivo ? 'text-gray-800' : 'text-gray-500'}`}>{abono.cliente?.nombre ?? "-"}</p>
                          {abono.cliente?.telefono && (
                            <p className="text-xs text-gray-400">{abono.cliente.telefono}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <p>{abono.tipoVehiculo?.nombre ?? "-"}</p>
                          {abono.modeloVehiculo && (
                            <p className="text-xs text-gray-400">{abono.modeloVehiculo}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {abono.patente ? (
                            <span className={`font-mono text-xs px-2 py-1 rounded ${esActivo ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/60 text-gray-400'}`}>
                              {abono.patente}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {abono.cobrador ?? <span className="text-gray-300">—</span>}
                        </td>
                        
                        {/* Indicador visual de estado */}
                        <td className="px-4 py-3">
                          {esActivo ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              Baja
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-gray-500">
                          {formatFecha(abono.fechaInicio)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/pagosAbono/${abono.abonoCocheraId}`)}
                              title="Ver pagos"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <CreditCard size={15} />
                            </button>
                            
                            {/* Deshabilitar o esconder la edición/baja si ya es histórico */}
                            {esActivo && (
                              <>
                                <button
                                  title="Editar"
                                  onClick={() => setModalEditar(abono)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  title="Dar de baja"
                                  onClick={() => handleDarDeBaja(abono)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalNuevo && (
        <ModalNuevoAbono
          onClose={() => setModalNuevo(false)}
          onCreado={() => { setModalNuevo(false); cargarAbonos(); }}
        />
      )}

      {modalEditar && (
        <ModalEditarAbono
          abono={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardado={() => { setModalEditar(null); cargarAbonos(); }}
        />
      )}
    </div>
  );
}