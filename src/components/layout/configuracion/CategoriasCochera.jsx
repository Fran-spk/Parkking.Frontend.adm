import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, RotateCcw } from "lucide-react";
import { categoriaCocheraService } from "../../../services/categoriaCocheraService";

export default function CategoriasCochera() {
  const [categorias, setCategorias] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, [mostrarInactivos]);

  async function cargar() {
    try {
      setError(null);
      const data = await categoriaCocheraService.getAll(mostrarInactivos);
      setCategorias(data);
    } catch {
      setError("No se pudo cargar las categorías");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar() {
    if (!nuevoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await categoriaCocheraService.agregar(nuevoNombre.trim());
      setNuevoNombre("");
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo agregar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleModificar(id) {
    if (!editandoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await categoriaCocheraService.modificar(id, editandoNombre.trim());
      setEditandoId(null);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo modificar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarDeBaja(categoria) {
    if (!confirm(`¿Dar de baja "${categoria.nombre}"?`)) return;
    try {
      setError(null);
      await categoriaCocheraService.darDeBaja(categoria.categoriaCocheraId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja");
    }
  }

  async function handleReactivar(categoria) {
    try {
      setError(null);
      await categoriaCocheraService.reactivar(categoria.categoriaCocheraId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo reactivar");
    }
  }

  function iniciarEdicion(categoria) {
    setEditandoId(categoria.categoriaCocheraId);
    setEditandoNombre(categoria.nombre);
    setError(null);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditandoNombre("");
    setError(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Categorías de cochera</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Ej: Techada, Descubierta, Dueño — para diferenciar tarifas por tipo de espacio
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={e => setMostrarInactivos(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Mostrar dadas de baja
        </label>
      </div>

      {error && (
        <div className="mb-3 px-4 py-2.5 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Cabecera columnas */}
      {!loading && categorias.length > 0 && (
        <div className="flex items-center gap-2 px-3 mb-1">
          <span className="flex-1 text-xs font-medium text-gray-400">Nombre</span>
          <span className="w-16" />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="text-sm text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-1.5 mb-4">
          {categorias.length === 0 && (
            <p className="text-sm text-gray-400">
              {mostrarInactivos ? "No hay categorías dadas de baja" : "No hay categorías configuradas"}
            </p>
          )}
          {categorias.map(categoria => {
            const inactivo = !categoria.activo;
            return (
              <div
                key={categoria.categoriaCocheraId}
                className={`flex items-center gap-2 border rounded-lg px-3 py-2.5 transition-colors ${
                  inactivo ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-100"
                }`}
              >
                {editandoId === categoria.categoriaCocheraId ? (
                  <>
                    <input
                      autoFocus
                      value={editandoNombre}
                      onChange={e => setEditandoNombre(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleModificar(categoria.categoriaCocheraId);
                        if (e.key === "Escape") cancelarEdicion();
                      }}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                    />
                    <button
                      onClick={() => handleModificar(categoria.categoriaCocheraId)}
                      disabled={guardando}
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 text-sm ${inactivo ? "text-gray-400" : "text-gray-800"}`}>
                      {categoria.nombre}
                    </span>
                    {inactivo && (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                        Baja
                      </span>
                    )}
                    {inactivo ? (
                      <button
                        onClick={() => handleReactivar(categoria)}
                        title="Reactivar"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => iniciarEdicion(categoria)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDarDeBaja(categoria)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Agregar nuevo */}
      {!mostrarInactivos && (
        <div className="flex gap-2 items-start">
          <input
            type="text"
            value={nuevoNombre}
            onChange={e => setNuevoNombre(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAgregar()}
            placeholder="Ej: Techada, Descubierta, Dueño..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          <button
            onClick={handleAgregar}
            disabled={guardando || !nuevoNombre.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus size={15} />
            Agregar
          </button>
        </div>
      )}
    </div>
  );
}