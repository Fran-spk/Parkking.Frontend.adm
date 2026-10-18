import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, RotateCcw } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../../components/layout/PageHeader";
import SearchField from "../../components/layout/SearchField";
import Checkbox from "../../components/layout/Check";
import Paginacion, { paginaDe } from "../../components/layout/Paginacion";
import { fieldClass } from "../../components/layout/FilterSelect";

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

const ICONO = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";

/** CRUD de catálogos de nombre (tipos, categorías, zonas, métodos, gastos). */
export default function CatalogoNombres({
  embedded = false,
  title,
  description,
  listadoLabel = "Nombre",
  placeholder,
  vacio,
  idKey,
  service,
}) {
  const [items, setItems] = useState([]);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoNombre, setEditandoNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, [mostrarInactivos]);

  async function cargar() {
    try {
      setError(null);
      const data = await service.getAll(mostrarInactivos);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError(`No se pudo cargar ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAgregar() {
    if (!nuevoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await service.agregar(nuevoNombre.trim());
      setNuevoNombre("");
      setMostrarAlta(false);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo agregar"));
    } finally {
      setGuardando(false);
    }
  }

  async function handleModificar(id) {
    if (!editandoNombre.trim()) return;
    try {
      setGuardando(true);
      setError(null);
      await service.modificar(id, editandoNombre.trim());
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo modificar"));
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarDeBaja(item) {
    if (!confirm(`¿Dar de baja "${item.nombre}"?`)) return;
    try {
      setError(null);
      await service.darDeBaja(item[idKey]);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo dar de baja"));
    }
  }

  async function handleReactivar(item) {
    try {
      setError(null);
      await service.reactivar(item[idKey]);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo reactivar"));
    }
  }

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.nombre.toLowerCase().includes(q));
  }, [items, busqueda]);

  const paginaClave = `${busqueda}|${mostrarInactivos}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const activos = items.filter((i) => i.activo).length;
  const alta = (
    <PageHeaderAction onClick={() => setMostrarAlta((v) => !v)}>
      <Plus size={16} /> Nuevo
    </PageHeaderAction>
  );

  return (
    <div className={embedded ? "space-y-4" : "space-y-5 pb-12 animate-fade-in-up"}>
      {!embedded && (
        <PageHeader
          title={title}
          description={description}
          loading={loading}
          action={alta}
          stats={[
            { label: "Listados", value: items.length },
            { label: "Activos", value: activos, tone: "success" },
          ]}
        />
      )}
      {embedded && <div className="flex justify-end">{alta}</div>}

      <div className="flex flex-wrap items-center gap-3">
        <SearchField value={busqueda} onChange={setBusqueda} placeholder="Nombre" className="w-full sm:w-80" />
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
        <div className="bg-surface-card px-4 py-4 flex flex-wrap gap-2">
          <input
            autoFocus
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAgregar()}
            placeholder={placeholder}
            className={`${fieldClass} flex-1 min-w-[12rem]`}
          />
          <button
            type="button"
            onClick={handleAgregar}
            disabled={guardando || !nuevoNombre.trim()}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-foreground text-xs font-semibold px-4 py-2.5 disabled:opacity-50"
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
      )}

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando…</span>
        </div>
      ) : items.length === 0 ? (
        <Vacio texto={vacio} />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún ítem coincide con la búsqueda." />
      ) : (
        <>
          <div className="bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[62%]" />
                <col className="w-[20%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">{listadoLabel}</th>
                  <th className="pk-label font-bold px-3 py-2.5">Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((item) => {
                  const id = item[idKey];
                  const inactivo = !item.activo;
                  const editando = editandoId === id;
                  return (
                    <tr key={id} className={`border-b border-line ${inactivo ? "opacity-55" : "hover:bg-surface-page"}`}>
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${inactivo ? "border-l-transparent" : "border-l-brand"}`}>
                        {editando ? (
                          <input
                            autoFocus
                            value={editandoNombre}
                            onChange={(e) => setEditandoNombre(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleModificar(id);
                              if (e.key === "Escape") setEditandoId(null);
                            }}
                            className={fieldClass}
                          />
                        ) : (
                          <p className="font-semibold text-ink truncate">{item.nombre}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <p className={`text-sm font-semibold ${inactivo ? "text-ink-faint" : "text-success-ink"}`}>
                          {inactivo ? "De baja" : "Activo"}
                        </p>
                      </td>
                      <td className="pl-2 pr-3 py-2.5">
                        {editando ? (
                          <div className="flex items-center justify-end gap-0.5">
                            <button type="button" title="Guardar" onClick={() => handleModificar(id)} className={ICONO}>
                              <Check size={15} />
                            </button>
                            <button type="button" title="Cancelar" onClick={() => setEditandoId(null)} className={ICONO}>
                              <X size={15} />
                            </button>
                          </div>
                        ) : inactivo ? (
                          <div className="flex items-center justify-end">
                            <button type="button" title="Reactivar" onClick={() => handleReactivar(item)} className={ICONO}>
                              <RotateCcw size={15} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => {
                                setEditandoId(id);
                                setEditandoNombre(item.nombre);
                              }}
                              className={ICONO}
                            >
                              <Pencil size={15} />
                            </button>
                            <button type="button" title="Dar de baja" onClick={() => handleDarDeBaja(item)} className={`${ICONO} hover:text-danger-ink`}>
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
          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}
    </div>
  );
}
