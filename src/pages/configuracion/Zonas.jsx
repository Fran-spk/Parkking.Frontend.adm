import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, RotateCcw } from "lucide-react";
import { zonaService } from "../../services/zonaService";
import Checkbox from "../../components/layout/Check";
import { fieldClass } from "../../components/layout/FilterSelect";

/** @typedef {import("../../types").Zona} Zona */

export default function Zonas({ embedded = false }) {
  const [zonas, setZonas] = useState(/** @type {Zona[]} */ ([]));
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [mostrarInactivos]);

  async function cargar() {
    try {
      setError(null);
      const data = await zonaService.getAll(mostrarInactivos);
      setZonas(data);
    } catch {
      setError("No se pudieron cargar las zonas");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar() {
    if (!nuevoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await zonaService.agregar(nuevoNombre.trim());
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
      await zonaService.modificar(id, editandoNombre.trim());
      setEditandoId(null);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo modificar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarDeBaja(zona) {
    if (!confirm(`¿Dar de baja "${zona.nombre}"?`)) return;
    try {
      setError(null);
      await zonaService.darDeBaja(zona.zonaId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja");
    }
  }

  async function handleReactivar(zona) {
    try {
      setError(null);
      await zonaService.reactivar(zona.zonaId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo reactivar");
    }
  }

  function iniciarEdicion(zona) {
    setEditandoId(zona.zonaId);
    setEditandoNombre(zona.nombre);
    setError(null);
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setEditandoNombre("");
    setError(null);
  }

  return (
    <div className={embedded ? "space-y-4" : "space-y-6 animate-fade-in-up"}>
      {!embedded && (
        <div>
          <h1 className="pk-title">Zonas</h1>
          <p className="pk-desc mt-1">
            Sectores del estacionamiento. Una cochera puede estar en una zona o en ninguna.
          </p>
        </div>
      )}

      <div className="bg-surface-card p-5 rounded-2xl border border-transparent shadow-none space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
          <span className="pk-label">Listado de zonas</span>
          <label className="flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
            <Checkbox
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar dadas de baja
          </label>
        </div>

        {error && (
          <div className="px-4 py-2.5 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-xs text-gray-400 font-semibold py-4">Cargando...</div>
        ) : (
          <div className="space-y-2">
            {zonas.length === 0 && (
              <p className="text-xs text-gray-400 font-medium py-4">
                {mostrarInactivos ? "No hay zonas dadas de baja" : "No hay zonas configuradas"}
              </p>
            )}
            {zonas.map((zona) => {
              const inactivo = !zona.activo;
              return (
                <div
                  key={zona.zonaId}
                  className={`flex items-center gap-3 border rounded-xl px-4 py-3 transition-all ${
                    inactivo
                      ? "bg-gray-50/50 border-gray-100 opacity-60"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {editandoId === zona.zonaId ? (
                    <>
                      <input
                        autoFocus
                        value={editandoNombre}
                        onChange={(e) => setEditandoNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleModificar(zona.zonaId);
                          if (e.key === "Escape") cancelarEdicion();
                        }}
                        className={`${fieldClass} flex-1`}
                      />
                      <button
                        onClick={() => handleModificar(zona.zonaId)}
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
                        {zona.nombre}
                      </span>
                      {inactivo && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                          Baja
                        </span>
                      )}
                      {inactivo ? (
                        <button
                          onClick={() => handleReactivar(zona)}
                          title="Reactivar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => iniciarEdicion(zona)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDarDeBaja(zona)}
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

        {!mostrarInactivos && (
          <div className="flex gap-2 items-start pt-3 border-t border-gray-50">
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
              placeholder="Ej: Subsuelo, Planta baja, Terraza..."
              className={`${fieldClass} flex-1`}
            />
            <button
              onClick={handleAgregar}
              disabled={guardando || !nuevoNombre.trim()}
              className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
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
