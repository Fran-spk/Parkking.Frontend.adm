import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Check, X, RotateCcw, Eye } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../../components/layout/PageHeader";
import SearchField from "../../components/layout/SearchField";
import Checkbox from "../../components/layout/Check";
import Paginacion, { paginaDe } from "../../components/layout/Paginacion";
import { fieldClass } from "../../components/layout/FilterSelect";
import { grupoFinancieroService } from "../../services/grupoFinancieroService";

/** @typedef {import("../../types").GrupoFinanciero} GrupoFinanciero */

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function GruposFinancieros({ embedded = false }) {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState(/** @type {GrupoFinanciero[]} */ ([]));
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mostrarAlta, setMostrarAlta] = useState(false);

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
      setMostrarAlta(false);
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

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return grupos;
    return grupos.filter(
      (g) => g.nombre.toLowerCase().includes(q) || String(g.descripcion || "").toLowerCase().includes(q)
    );
  }, [grupos, busqueda]);

  const paginaClave = `${busqueda}|${mostrarInactivos}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const activos = grupos.filter((g) => g.activo).length;
  const icono = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";

  return (
    <div className={embedded ? "space-y-4" : "space-y-5 pb-12 animate-fade-in-up"}>
      {!embedded && (
        <PageHeader
          title="Grupos financieros"
          description="Alta y baja de grupos. Para verlos, filtrá en Cuenta corriente. No son una cuenta: agrupan movimientos."
          loading={loading}
          action={
            <PageHeaderAction onClick={() => setMostrarAlta((v) => !v)}>
              <Plus size={16} />
              Nuevo grupo
            </PageHeaderAction>
          }
          stats={[
            { label: "Listados", value: grupos.length },
            { label: "Activos", value: activos, tone: "success" },
          ]}
        />
      )}
      {embedded && (
        <div className="flex justify-end">
          <PageHeaderAction onClick={() => setMostrarAlta((v) => !v)}>
            <Plus size={16} />
            Nuevo grupo
          </PageHeaderAction>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Nombre o descripción"
          className="w-full sm:w-80"
        />
        <label className="ml-auto flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
          <Checkbox
            checked={mostrarInactivos}
            onChange={(e) => {
              setLoading(true);
              setMostrarInactivos(e.target.checked);
            }}
          />
          Ver dados de baja
        </label>
      </div>

      {mostrarAlta && (
        <div className="bg-surface-card px-4 py-4 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del grupo" className={fieldClass} />
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción" className={fieldClass} />
          <button
            type="button"
            onClick={handleAgregar}
            disabled={guardando || !nombre.trim()}
            className="inline-flex items-center justify-center gap-1.5 bg-brand text-brand-foreground text-xs font-semibold px-4 py-2.5 disabled:opacity-50"
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
      )}

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando grupos…</span>
        </div>
      ) : grupos.length === 0 ? (
        <Vacio texto="Todavía no hay grupos. Cargá el primero con Nuevo grupo." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún grupo coincide con la búsqueda." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[44%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Grupo</th>
                  <th className="pk-label font-bold px-3 py-2.5">Descripción</th>
                  <th className="pk-label font-bold px-3 py-2.5">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((grupo) => {
                  const inactivo = !grupo.activo;
                  const editando = editandoId === grupo.grupoFinancieroId;
                  return (
                    <tr key={grupo.grupoFinancieroId} className={`border-b border-line ${inactivo ? "opacity-55" : "hover:bg-surface-page"}`}>
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${inactivo ? "border-l-transparent" : "border-l-brand"}`}>
                        {editando ? (
                          <input autoFocus value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className={fieldClass} />
                        ) : (
                          <p className="font-semibold text-ink truncate">{grupo.nombre}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        {editando ? (
                          <input value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} placeholder="Descripción" className={fieldClass} />
                        ) : (
                          <p className="pk-caption truncate">{grupo.descripcion || "—"}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className={`text-sm font-semibold ${inactivo ? "text-ink-faint" : "text-success-ink"}`}>
                          {inactivo ? "De baja" : "Activo"}
                        </p>
                      </td>
                      <td className="pl-2 pr-3 py-2.5">
                        {editando ? (
                          <div className="flex items-center justify-end gap-0.5">
                            <button type="button" title="Guardar" onClick={() => handleModificar(grupo.grupoFinancieroId)} className={icono}>
                              <Check size={15} />
                            </button>
                            <button type="button" title="Cancelar" onClick={() => setEditandoId(null)} className={icono}>
                              <X size={15} />
                            </button>
                          </div>
                        ) : inactivo ? (
                          <div className="flex items-center justify-end">
                            <button type="button" title="Reactivar" onClick={() => handleReactivar(grupo)} className={icono}>
                              <RotateCcw size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-0.5">
                            <button type="button" title="Ver en cuenta corriente" onClick={() => navigate(`/cuenta-corriente?grupo=${grupo.grupoFinancieroId}`)} className={icono}>
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
                              className={icono}
                            >
                              <Pencil size={15} />
                            </button>
                            <button type="button" title="Dar de baja" onClick={() => handleDarDeBaja(grupo)} className={`${icono} hover:text-danger-ink`}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((grupo) => {
              const inactivo = !grupo.activo;
              return (
                <li key={grupo.grupoFinancieroId} className={inactivo ? "opacity-55" : ""}>
                  <button
                    type="button"
                    onClick={() => !inactivo && navigate(`/cuenta-corriente?grupo=${grupo.grupoFinancieroId}`)}
                    className={`w-full text-left px-4 py-3 border-l-[3px] ${inactivo ? "border-l-transparent" : "border-l-brand"}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-ink truncate">{grupo.nombre}</span>
                      <span className={`pk-caption font-semibold ${inactivo ? "text-ink-faint" : "text-success-ink"}`}>
                        {inactivo ? "De baja" : "Activo"}
                      </span>
                    </div>
                    {grupo.descripcion && <p className="pk-caption mt-0.5 truncate">{grupo.descripcion}</p>}
                  </button>
                </li>
              );
            })}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}
    </div>
  );
}
