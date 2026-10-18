import { useEffect, useMemo, useState } from "react";
import { Users, Shield, Check } from "lucide-react";
import PageHeader, { PageHeaderAction } from "../../components/layout/PageHeader";
import { usuarioService } from "../../services/usuarioService";
import { grupoService, ESTADO_GRUPO } from "../../services/grupoService";
import { permisosService } from "../../services/permisosService";
import Checkbox from "../../components/layout/Check";

function errMsg(e, fallback) {
  const d = e?.response?.data;
  if (typeof d === "string") return d;
  if (d?.mensaje) return d.mensaje;
  return e?.message || fallback;
}

export default function UsuariosConfig({ embedded = false }) {
  const [usuarios, setUsuarios] = useState([]);
  const [gruposCatalogo, setGruposCatalogo] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [permisos, setPermisos] = useState(null);
  const [grupoIds, setGrupoIds] = useState(/** @type {Set<number>} */ (new Set()));
  const [extraIds, setExtraIds] = useState(/** @type {Set<number>} */ (new Set()));
  const [loading, setLoading] = useState(true);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const [u, g, m] = await Promise.all([
          usuarioService.listarDelEstacionamiento(),
          grupoService.getAll(),
          grupoService.getModulos(),
        ]);
        setUsuarios(Array.isArray(u) ? u : []);
        setGruposCatalogo(Array.isArray(g) ? g : []);
        setModulos(Array.isArray(m) ? m : []);
      } catch (e) {
        setError(errMsg(e, "No se pudieron cargar usuarios"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function seleccionarUsuario(u) {
    setSeleccionado(u);
    setLoadingPermisos(true);
    setError(null);
    try {
      const p = await permisosService.get(u.usuarioId);
      setPermisos(p);
      setGrupoIds(new Set((p.grupos ?? []).map((g) => g.grupoId)));
      setExtraIds(new Set((p.accionesExtras ?? []).map((a) => a.accionId)));
    } catch (e) {
      setPermisos(null);
      setError(errMsg(e, "No se pudieron cargar los permisos"));
    } finally {
      setLoadingPermisos(false);
    }
  }

  const cubiertasPorGrupos = useMemo(() => {
    const ids = new Set();
    for (const g of gruposCatalogo) {
      if (!grupoIds.has(g.grupoId)) continue;
      for (const a of g.acciones ?? []) ids.add(a.accionId);
    }
    return ids;
  }, [gruposCatalogo, grupoIds]);

  function toggleGrupo(id) {
    setGrupoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExtra(id) {
    if (cubiertasPorGrupos.has(id)) return;
    setExtraIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Al cambiar grupos, sacar extras que pasan a estar cubiertas
  useEffect(() => {
    setExtraIds((prev) => {
      const next = new Set([...prev].filter((id) => !cubiertasPorGrupos.has(id)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [cubiertasPorGrupos]);

  async function guardar() {
    if (!seleccionado) return;
    try {
      setGuardando(true);
      setError(null);
      await permisosService.asignarGrupos(seleccionado.usuarioId, [...grupoIds]);
      const p = await permisosService.asignarAccionesExtras(seleccionado.usuarioId, [...extraIds]);
      setPermisos(p);
      setGrupoIds(new Set((p.grupos ?? []).map((g) => g.grupoId)));
      setExtraIds(new Set((p.accionesExtras ?? []).map((a) => a.accionId)));
    } catch (e) {
      setError(errMsg(e, "No se pudieron guardar los permisos"));
    } finally {
      setGuardando(false);
    }
  }

  const gruposHabilitados = gruposCatalogo.filter((g) => g.estado === ESTADO_GRUPO.Habilitado);

  return (
    <div className={embedded ? "space-y-4" : "space-y-5 animate-fade-in-up"}>
      {!embedded && (
      <PageHeader
        title="Usuarios y accesos"
        description="Asigná grupos de seguridad y acciones extras. Estar en un grupo da todas sus acciones."
        stats={[
          { label: "Usuarios", value: usuarios.length },
          { label: "Grupos", value: gruposHabilitados.length },
        ]}
      />
      )}

      {error && (
        <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-surface-card p-4 space-y-2">
          <span className="pk-label flex items-center gap-2">
            <Users size={13} /> Del estacionamiento
          </span>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
              <span className="pk-caption">Cargando…</span>
            </div>
          ) : (
            <ul className="divide-y divide-line-subtle max-h-[32rem] overflow-y-auto">
              {usuarios.map((u) => {
                const active = seleccionado?.usuarioId === u.usuarioId;
                return (
                  <li key={u.usuarioId}>
                    <button
                      type="button"
                      onClick={() => seleccionarUsuario(u)}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${
                        active ? "bg-brand-muted border-l-[3px] border-brand" : "hover:bg-surface-muted/70"
                      }`}
                    >
                      <div className="text-sm font-bold text-ink truncate">{u.nombre || u.usuarioName}</div>
                      <div className="text-[11px] text-ink-faint truncate">{u.mail}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="lg:col-span-8 bg-surface-card p-5 space-y-5">
          {!seleccionado ? (
            <p className="text-sm text-ink-muted py-10 text-center">
              Seleccioná un usuario para ver y editar sus permisos.
            </p>
          ) : loadingPermisos ? (
            <p className="text-sm text-ink-muted py-10 text-center">Cargando permisos…</p>
          ) : (
            <>
              <div>
                <h3 className="text-base font-bold text-ink">{seleccionado.nombre}</h3>
                <p className="pk-caption">
                  {seleccionado.usuarioName} · {seleccionado.mail}
                </p>
              </div>

              <section className="space-y-2">
                <span className="pk-label flex items-center gap-2">
                  <Shield size={13} /> Grupos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {gruposHabilitados.map((g) => (
                    <label
                      key={g.grupoId}
                      className="flex items-start gap-2 text-xs text-ink-muted border border-line-subtle px-3 py-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={grupoIds.has(g.grupoId)}
                        onChange={() => toggleGrupo(g.grupoId)}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-bold text-ink block">{g.nombre}</span>
                        <span className="text-[10px] text-ink-faint">
                          {(g.acciones ?? []).length} acciones
                        </span>
                      </span>
                    </label>
                  ))}
                  {gruposHabilitados.length === 0 && (
                    <p className="text-xs text-ink-faint">No hay grupos habilitados.</p>
                  )}
                </div>
              </section>

              <section className="space-y-2">
                <span className="pk-label">Acciones extras</span>
                <p className="pk-caption">
                  Solo las que no cubre ningún grupo asignado. Las del grupo no se pueden quitar acá.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-line-subtle p-2">
                  {modulos.map((mod) => (
                    <div key={mod.moduloId}>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-ink-faint px-1 py-1">
                        {mod.nombre}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {(mod.acciones ?? []).map((a) => {
                          const cubierta = cubiertasPorGrupos.has(a.accionId);
                          return (
                            <label
                              key={a.accionId}
                              className={`flex items-center gap-2 text-xs px-2 py-1 ${
                                cubierta ? "opacity-40 cursor-not-allowed" : "cursor-pointer text-ink-muted"
                              }`}
                              title={cubierta ? "Ya incluida en un grupo" : undefined}
                            >
                              <Checkbox
                                disabled={cubierta}
                                checked={cubierta || extraIds.has(a.accionId)}
                                onChange={() => toggleExtra(a.accionId)}
                              />
                              {a.nombre}
                              {cubierta && (
                                <span className="text-[9px] text-ink-faint">(grupo)</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {permisos?.permisosEfectivos?.length > 0 && (
                <section className="space-y-1">
                  <span className="pk-label">Efectivos (solo lectura)</span>
                  <p className="text-[11px] text-ink-faint">
                    {permisos.permisosEfectivos.map((a) => a.nombre).join(" · ")}
                  </p>
                </section>
              )}

              <div className="flex justify-end pt-2 border-t border-line-subtle">
                <PageHeaderAction type="button" disabled={guardando} onClick={guardar}>
                  <Check size={14} />
                  {guardando ? "Guardando…" : "Guardar permisos"}
                </PageHeaderAction>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
