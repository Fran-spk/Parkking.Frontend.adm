import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, RotateCcw } from "lucide-react";
import { categoriaCocheraService } from "../../services/categoriaCocheraService";

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
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categorías de Cochera</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ej: Techada, Descubierta, Dueño — para diferenciar tarifas por tipo de espacio
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-50">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Listado de Categorías
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={e => setMostrarInactivos(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            Mostrar dadas de baja
          </label>
        </div>

        {error && (
          <div className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div className="text-xs text-gray-400 font-semibold py-4">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {categorias.length === 0 && (
              <p className="text-xs text-gray-400 font-medium py-4">
                {mostrarInactivos ? "No hay categorías dadas de baja" : "No hay categorías configuradas"}
              </p>
            )}
            {categorias.map(categoria => {
              const inactivo = !categoria.activo;
              return (
                <div
                  key={categoria.categoriaCocheraId}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-all ${
                    inactivo ? "bg-gray-50/50 border-gray-100 opacity-60" : "bg-white border-gray-100 hover:border-gray-200"
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
                        className="flex-1 text-xs font-medium border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white text-gray-800"
                      />
                      <button
                        onClick={() => handleModificar(categoria.categoriaCocheraId)}
                        disabled={guardando}
                        className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 text-xs font-bold ${inactivo ? "text-gray-400" : "text-gray-800"}`}>
                        {categoria.nombre}
                      </span>
                      {inactivo && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                          Baja
                        </span>
                      )}
                      {inactivo ? (
                        <button
                          onClick={() => handleReactivar(categoria)}
                          title="Reactivar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => iniciarEdicion(categoria)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDarDeBaja(categoria)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Dar de Baja"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
          <div className="flex gap-2 items-start pt-3 border-t border-gray-50">
            <input
              type="text"
              value={nuevoNombre}
              onChange={e => setNuevoNombre(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAgregar()}
              placeholder="Ej: Techada, Descubierta, Dueño..."
              className="flex-1 text-xs font-semibold border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50/50 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-gray-800"
            />
            <button
              onClick={handleAgregar}
              disabled={guardando || !nuevoNombre.trim()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              <Plus size={15} />
              Agregar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
