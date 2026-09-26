import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, RotateCcw, Tags } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { tipoGastoService } from "../../services/tipoGastoService";

/** @typedef {import("../../types").TipoGasto} TipoGasto */

export default function TiposGasto() {
  const [tipos, setTipos] = useState(/** @type {TipoGasto[]} */ ([]));
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
      const data = await tipoGastoService.getAll(mostrarInactivos);
      setTipos(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los tipos de gasto");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar() {
    if (!nuevoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await tipoGastoService.agregar(nuevoNombre.trim());
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
      await tipoGastoService.modificar(id, editandoNombre.trim());
      setEditandoId(null);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo modificar");
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarDeBaja(tipo) {
    if (!confirm(`¿Dar de baja "${tipo.nombre}"?`)) return;
    try {
      setError(null);
      await tipoGastoService.darDeBaja(tipo.tipoGastoId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja");
    }
  }

  async function handleReactivar(tipo) {
    try {
      setError(null);
      await tipoGastoService.reactivar(tipo.tipoGastoId);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo reactivar");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Tipos de gasto"
        description="Catálogo para clasificar gastos. La baja es lógica: no se borra el nombre."
        stats={[
          { label: "Listados", value: tipos.length },
          { label: "Activos", value: tipos.filter((t) => t.activo).length },
        ]}
      />

      <div className="bg-surface-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
          <span className="pk-label flex items-center gap-2">
            <Tags size={13} /> Listado
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => {
                setLoading(true);
                setMostrarInactivos(e.target.checked);
              }}
              className="border-line-strong text-brand focus:ring-brand h-3.5 w-3.5"
            />
            Mostrar dados de baja
          </label>
        </div>

        {error && <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold">{error}</div>}

        {loading ? (
          <p className="text-xs text-ink-faint py-4">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {tipos.length === 0 && <p className="text-xs text-ink-faint py-4">No hay tipos de gasto</p>}
            {tipos.map((tipo) => {
              const inactivo = !tipo.activo;
              return (
                <div
                  key={tipo.tipoGastoId}
                  className={`flex items-center gap-3 border px-4 py-3 ${
                    inactivo ? "bg-surface-muted/50 border-line-subtle opacity-60" : "bg-surface-card border-line-subtle"
                  }`}
                >
                  {editandoId === tipo.tipoGastoId ? (
                    <>
                      <input
                        autoFocus
                        value={editandoNombre}
                        onChange={(e) => setEditandoNombre(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleModificar(tipo.tipoGastoId);
                          if (e.key === "Escape") setEditandoId(null);
                        }}
                        className="flex-1 text-xs font-medium border border-line px-3 py-2 focus:outline-none focus:border-brand text-ink"
                      />
                      <button type="button" onClick={() => handleModificar(tipo.tipoGastoId)} className="p-2 text-success">
                        <Check size={16} />
                      </button>
                      <button type="button" onClick={() => setEditandoId(null)} className="p-2 text-ink-faint">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 text-xs font-bold ${inactivo ? "text-ink-faint" : "text-ink"}`}>
                        {tipo.nombre}
                      </span>
                      {inactivo ? (
                        <button type="button" onClick={() => handleReactivar(tipo)} title="Reactivar" className="p-1.5 text-ink-faint hover:text-success">
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditandoId(tipo.tipoGastoId);
                              setEditandoNombre(tipo.nombre);
                            }}
                            className="p-1.5 text-ink-faint hover:text-warning"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDarDeBaja(tipo)}
                            className="p-1.5 text-ink-faint hover:text-danger"
                            title="Dar de baja"
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

        <div className="flex gap-2 pt-3 border-t border-line-subtle">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
            placeholder="Ej: Luz, Limpieza, Expensas"
            className="flex-1 text-xs font-semibold border border-line px-4 py-2.5 bg-surface-muted/50 focus:outline-none focus:border-brand text-ink"
          />
          <button
            type="button"
            onClick={handleAgregar}
            disabled={guardando || !nuevoNombre.trim()}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-foreground text-xs font-bold px-4 py-2.5 disabled:opacity-50"
          >
            <Plus size={15} />
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
