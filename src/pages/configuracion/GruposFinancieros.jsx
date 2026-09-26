import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Check, X, RotateCcw, Layers, Eye } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { grupoFinancieroService } from "../../services/grupoFinancieroService";

/** @typedef {import("../../types").GrupoFinanciero} GrupoFinanciero */

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

export default function GruposFinancieros() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState(/** @type {GrupoFinanciero[]} */ ([]));
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [mostrarInactivos]);

  async function cargar() {
    try {
      setError(null);
      const data = await grupoFinancieroService.getAll(mostrarInactivos);
      setGrupos(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los grupos");
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar() {
    if (!nombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await grupoFinancieroService.agregar(nombre.trim(), descripcion.trim());
      setNombre("");
      setDescripcion("");
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo agregar"));
    } finally {
      setGuardando(false);
    }
  }

  async function handleModificar(id) {
    if (!editNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await grupoFinancieroService.modificar(id, editNombre.trim(), editDescripcion.trim());
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo modificar"));
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarDeBaja(grupo) {
    if (!confirm(`¿Dar de baja "${grupo.nombre}"? Los movimientos ya asignados no cambian.`)) return;
    try {
      setError(null);
      await grupoFinancieroService.darDeBaja(grupo.grupoFinancieroId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo dar de baja"));
    }
  }

  async function handleReactivar(grupo) {
    try {
      setError(null);
      await grupoFinancieroService.reactivar(grupo.grupoFinancieroId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo reactivar"));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Grupos financieros"
        description="Organizan movimientos para consultarlos. No son una cuenta corriente. La baja es lógica."
        stats={[
          { label: "Listados", value: grupos.length },
          { label: "Activos", value: grupos.filter((g) => g.activo).length },
        ]}
      />

      <div className="bg-surface-card p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
          <span className="pk-label flex items-center gap-2">
            <Layers size={13} /> Listado
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => {
                setLoading(true);
                setMostrarInactivos(e.target.checked);
              }}
            />
            Mostrar dados de baja
          </label>
        </div>

        {error && <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold">{error}</div>}

        {loading ? (
          <p className="text-xs text-ink-faint py-4">Cargando...</p>
        ) : grupos.length === 0 ? (
          <p className="text-xs text-ink-faint py-4">No hay grupos</p>
        ) : (
          <div className="space-y-2">
            {grupos.map((grupo) => {
              const inactivo = !grupo.activo;
              return (
                <div
                  key={grupo.grupoFinancieroId}
                  className={`border px-4 py-3 ${inactivo ? "opacity-60 bg-surface-muted/50 border-line-subtle" : "border-line-subtle"}`}
                >
                  {editandoId === grupo.grupoFinancieroId ? (
                    <div className="space-y-2">
                      <input
                        autoFocus
                        value={editNombre}
                        onChange={(e) => setEditNombre(e.target.value)}
                        className="w-full text-sm border border-line px-3 py-2 text-ink focus:outline-none focus:border-brand"
                      />
                      <input
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                        placeholder="Descripción"
                        className="w-full text-sm border border-line px-3 py-2 text-ink focus:outline-none focus:border-brand"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleModificar(grupo.grupoFinancieroId)} className="p-2 text-success">
                          <Check size={16} />
                        </button>
                        <button type="button" onClick={() => setEditandoId(null)} className="p-2 text-ink-faint">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold ${inactivo ? "text-ink-faint" : "text-ink"}`}>{grupo.nombre}</p>
                        {grupo.descripcion && <p className="text-xs text-ink-muted mt-0.5">{grupo.descripcion}</p>}
                      </div>
                      {inactivo ? (
                        <button type="button" title="Reactivar" onClick={() => handleReactivar(grupo)} className="p-1.5 text-ink-faint hover:text-success">
                          <RotateCcw size={15} />
                        </button>
                      ) : (
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            title="Ver período"
                            onClick={() => navigate(`/grupos-financieros/${grupo.grupoFinancieroId}`)}
                            className="p-1.5 text-ink-faint hover:text-ink"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => {
                              setEditandoId(grupo.grupoFinancieroId);
                              setEditNombre(grupo.nombre);
                              setEditDescripcion(grupo.descripcion || "");
                            }}
                            className="p-1.5 text-ink-faint hover:text-warning"
                          >
                            <Pencil size={15} />
                          </button>
                          <button type="button" title="Dar de baja" onClick={() => handleDarDeBaja(grupo)} className="p-1.5 text-ink-faint hover:text-danger">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 pt-3 border-t border-line-subtle">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del grupo"
            className="text-xs font-semibold border border-line px-4 py-2.5 bg-surface-muted/50 text-ink focus:outline-none focus:border-brand"
          />
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción"
            className="text-xs border border-line px-4 py-2.5 bg-surface-muted/50 text-ink focus:outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={handleAgregar}
            disabled={guardando || !nombre.trim()}
            className="inline-flex items-center justify-center gap-1.5 bg-brand text-brand-foreground text-xs font-bold px-4 py-2.5 disabled:opacity-50"
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
