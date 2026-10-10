import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, Shield, X, Check } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../../components/layout/PageHeader";
import { grupoService, ESTADO_GRUPO } from "../../services/grupoService";
import Checkbox from "../../components/layout/Check";
import FilterSelect, { fieldClass } from "../../components/layout/FilterSelect";

function errMsg(e, fallback) {
  const d = e?.response?.data;
  if (typeof d === "string") return d;
  if (d?.mensaje) return d.mensaje;
  return e?.message || fallback;
}

export default function GruposSeguridad() {
  const [grupos, setGrupos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null); // null | 'nuevo' | grupo
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState(ESTADO_GRUPO.Habilitado);
  const [accionIds, setAccionIds] = useState(/** @type {Set<number>} */ (new Set()));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    try {
      setError(null);
      setLoading(true);
      const [g, m] = await Promise.all([grupoService.getAll(), grupoService.getModulos()]);
      setGrupos(Array.isArray(g) ? g : []);
      setModulos(Array.isArray(m) ? m : []);
    } catch (e) {
      setError(errMsg(e, "No se pudieron cargar los grupos"));
    } finally {
      setLoading(false);
    }
  }

  function abrirNuevo() {
    setEditando("nuevo");
    setNombre("");
    setDescripcion("");
    setEstado(ESTADO_GRUPO.Habilitado);
    setAccionIds(new Set());
  }

  function abrirEditar(grupo) {
    setEditando(grupo);
    setNombre(grupo.nombre ?? "");
    setDescripcion(grupo.descripcion ?? "");
    setEstado(grupo.estado ?? ESTADO_GRUPO.Habilitado);
    setAccionIds(new Set((grupo.acciones ?? []).map((a) => a.accionId)));
  }

  function cerrarEditor() {
    setEditando(null);
  }

  function toggleAccion(id) {
    setAccionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleModulo(modulo) {
    const ids = (modulo.acciones ?? []).map((a) => a.accionId);
    setAccionIds((prev) => {
      const next = new Set(prev);
      const allOn = ids.every((id) => next.has(id));
      if (allOn) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function guardar() {
    if (!nombre.trim()) {
      setError("Indicá el nombre del grupo");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      const body = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        estado,
        accionIds: [...accionIds],
      };
      if (editando === "nuevo") await grupoService.crear(body);
      else await grupoService.modificar(editando.grupoId, body);
      cerrarEditor();
      await cargar();
    } catch (e) {
      setError(errMsg(e, "No se pudo guardar el grupo"));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(grupo) {
    if (!confirm(`¿Eliminar el grupo "${grupo.nombre}"?`)) return;
    try {
      setError(null);
      await grupoService.eliminar(grupo.grupoId);
      await cargar();
    } catch (e) {
      setError(errMsg(e, "No se pudo eliminar"));
    }
  }

  const totalAcciones = useMemo(
    () => modulos.reduce((n, m) => n + (m.acciones?.length ?? 0), 0),
    [modulos]
  );

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Grupos de seguridad"
        description="Conjuntos de acciones. Un usuario en el grupo tiene todas; no se pueden restar por usuario."
        stats={[
          { label: "Grupos", value: grupos.length },
          { label: "Acciones catálogo", value: totalAcciones },
        ]}
        action={
          <PageHeaderAction onClick={abrirNuevo}>
            <Plus size={16} /> Nuevo grupo
          </PageHeaderAction>
        }
      />

      {error && (
        <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold">{error}</div>
      )}

      <div className="bg-surface-card p-5 space-y-3">
        <span className="pk-label flex items-center gap-2">
          <Shield size={13} /> Listado
        </span>

        {loading ? (
          <p className="text-sm text-ink-muted py-6 text-center">Cargando…</p>
        ) : grupos.length === 0 ? (
          <p className="text-sm text-ink-muted py-6 text-center">No hay grupos todavía.</p>
        ) : (
          <ul className="divide-y divide-line-subtle">
            {grupos.map((g) => (
              <li key={g.grupoId} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">{g.nombre}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 ${
                        g.estado === ESTADO_GRUPO.Habilitado
                          ? "bg-success-muted text-success"
                          : "bg-surface-muted text-ink-faint"
                      }`}
                    >
                      {g.estado === ESTADO_GRUPO.Habilitado ? "Habilitado" : "Deshabilitado"}
                    </span>
                  </div>
                  {g.descripcion && (
                    <p className="text-xs text-ink-muted mt-0.5">{g.descripcion}</p>
                  )}
                  <p className="text-[11px] text-ink-faint mt-1">
                    {(g.acciones ?? []).length} acciones
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirEditar(g)}
                    className="p-2 text-ink-muted hover:text-brand hover:bg-brand-muted"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(g)}
                    className="p-2 text-ink-muted hover:text-danger hover:bg-danger-muted"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editando &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-4 bg-ink/40">
            <div
              role="dialog"
              aria-modal="true"
              className="bg-surface-card w-full max-w-2xl shadow-pk-soft flex flex-col overflow-hidden"
              style={{ height: "calc(100dvh - 2rem)", maxHeight: "calc(100dvh - 2rem)" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-line-subtle shrink-0">
                <h3 className="text-base font-bold text-ink">
                  {editando === "nuevo" ? "Nuevo grupo" : `Editar: ${editando.nombre}`}
                </h3>
                <button type="button" onClick={cerrarEditor} className="p-1 text-ink-muted hover:text-ink">
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto min-h-0 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <span className="pk-label">Nombre</span>
                    <input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="pk-label">Estado</span>
                    <FilterSelect
                      className="w-full"
                      ariaLabel="Estado"
                      value={estado}
                      onChange={(v) => setEstado(Number(v))}
                      options={[
                        { value: ESTADO_GRUPO.Habilitado, label: "Habilitado" },
                        { value: ESTADO_GRUPO.Deshabilitado, label: "Deshabilitado" },
                      ]}
                    />
                  </label>
                </div>
                <label className="block space-y-1">
                  <span className="pk-label">Descripción</span>
                  <input
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className={fieldClass}
                  />
                </label>

                <div className="space-y-3">
                  <span className="pk-label">Acciones por módulo</span>
                  {modulos.map((mod) => {
                    const ids = (mod.acciones ?? []).map((a) => a.accionId);
                    const allOn = ids.length > 0 && ids.every((id) => accionIds.has(id));
                    return (
                      <div key={mod.moduloId} className="border border-line-subtle">
                        <button
                          type="button"
                          onClick={() => toggleModulo(mod)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-surface-muted/50 text-left"
                        >
                          <span className="text-xs font-bold text-ink">{mod.nombre}</span>
                          <span className="text-[10px] text-ink-faint">
                            {allOn ? "Quitar todas" : "Marcar todas"}
                          </span>
                        </button>
                        <div className="px-3 py-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {(mod.acciones ?? []).map((a) => (
                            <label
                              key={a.accionId}
                              className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer"
                            >
                              <Checkbox
                                checked={accionIds.has(a.accionId)}
                                onChange={() => toggleAccion(a.accionId)}
                              />
                              {a.nombre}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-line-subtle flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={cerrarEditor}
                  className="px-3 py-2 text-xs font-semibold text-ink-muted hover:bg-surface-muted"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={guardar}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-brand text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={14} />
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
