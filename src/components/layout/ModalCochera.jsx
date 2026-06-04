import { useState, useEffect } from "react";
import { X, Users, Car, AlertCircle } from "lucide-react";
import { cocheraService } from "../../services/cocheraService";
import { tipoVehiculoService } from "../../services/tipoVehiculoService";

export default function ModalCochera({ cochera = null, categorias = [], onClose, onGuardar }) {
  const [numero, setNumero] = useState(cochera?.numero || "");
  const [observacion, setObservacion] = useState(cochera?.observacion || "");
  const [categoriaCocheraId, setCategoriaCocheraId] = useState(cochera?.categoriaCocheraId || "");
  const [multipleOcupacion, setMultipleOcupacion] = useState(cochera?.multipleOcupacion || false);
  const [estadoCochera, setEstadoCochera] = useState(cochera?.estadoCochera || 0);
  const [vehiculosPermitidosIds, setVehiculosPermitidosIds] = useState(cochera?.vehiculosPermitidosIds || []);
  const [tiposVehiculos, setTiposVehiculos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    tipoVehiculoService.getAll().then(setTiposVehiculos).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cochera && categorias.length > 0 && !categoriaCocheraId)
      setCategoriaCocheraId(categorias[0].categoriaCocheraId);
  }, [categorias, cochera, categoriaCocheraId]);

  function toggleVehiculo(id) {
    setVehiculosPermitidosIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  }

  async function handleGuardar() {
    if (!numero.toString().trim()) { setError("El número es obligatorio"); return; }
    if (!categoriaCocheraId) { setError("Seleccioná una categoría"); return; }
    try {
      setLoading(true);
      setError(null);
      const payload = {
        numero: numero.toString().trim(),
        categoriaCocheraId: Number(categoriaCocheraId),
        estadoCochera: Number(estadoCochera),
        observacion: estadoCochera === 0 ? null : (observacion.trim() || null),
        multipleOcupacion: Boolean(multipleOcupacion),
        vehiculosPermitidosIds: vehiculosPermitidosIds.map(id => Number(id))
      };
      if (cochera) {
        await cocheraService.modificar(cochera.cocheraId, payload);
      } else {
        await cocheraService.agregar(payload);
      }
      onGuardar();
      onClose();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {cochera ? `Editar cochera ${cochera.numero}` : "Nueva cochera"}
            </h2>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          {/* Estado */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Estado</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setEstadoCochera(0); setError(null); }}
                className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  estadoCochera === 0 ? "border-green-400 bg-green-50 text-green-700" : "border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                Habilitada
              </button>
              <button
                type="button"
                onClick={() => setEstadoCochera(1)}
                className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                  estadoCochera === 1 ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                Deshabilitada
              </button>
            </div>
          </div>

          {/* Número y Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Número *</label>
              <input
                value={numero}
                onChange={e => { setNumero(e.target.value); setError(null); }}
                disabled={!!cochera}
                placeholder="Ej: 101"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Categoría *</label>
              <select
                value={categoriaCocheraId}
                onChange={e => setCategoriaCocheraId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
              >
                <option value="">Sin categoría</option>
                {categorias.map(c => (
                  <option key={c.categoriaCocheraId} value={c.categoriaCocheraId}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Múltiple ocupación */}
          <button
            type="button"
            onClick={() => setMultipleOcupacion(!multipleOcupacion)}
            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
              multipleOcupacion ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users size={15} className={multipleOcupacion ? "text-indigo-600" : "text-gray-400"} />
              <div className="text-left">
                <p className={`text-sm font-medium ${multipleOcupacion ? "text-indigo-800" : "text-gray-500"}`}>Múltiple ocupación</p>
                <p className="text-xs text-gray-400">Permite varios abonos activos</p>
              </div>
            </div>
            <div className={`w-9 h-5 rounded-full relative transition-colors ${multipleOcupacion ? "bg-indigo-600" : "bg-gray-300"}`}>
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${multipleOcupacion ? "left-5" : "left-1"}`} />
            </div>
          </button>

          {/* Vehículos permitidos */}
          {tiposVehiculos.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Tipos de vehículo permitidos</label>
              <div className="flex flex-wrap gap-2">
                {tiposVehiculos.map(tipo => (
                  <button
                    key={tipo.tipoVehiculoId}
                    type="button"
                    onClick={() => toggleVehiculo(tipo.tipoVehiculoId)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors ${
                      vehiculosPermitidosIds.includes(tipo.tipoVehiculoId)
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-gray-100 text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <Car size={12} /> {tipo.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Observación */}
          <div className={estadoCochera === 0 ? "opacity-40 pointer-events-none" : ""}>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Observación</label>
            <textarea
              value={observacion}
              onChange={e => setObservacion(e.target.value)}
              disabled={estadoCochera === 0}
              placeholder="Ej: Fuera de servicio..."
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={loading}
            className="flex-1 text-sm text-white bg-indigo-600 rounded-lg py-2.5 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? "Guardando..." : cochera ? "Guardar cambios" : "Crear cochera"}
          </button>
        </div>
      </div>
    </div>
  );
}