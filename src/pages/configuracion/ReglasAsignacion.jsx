import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, RotateCcw } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { reglaAsignacionService, CriterioRegla } from "../../services/reglaAsignacionService";
import { grupoFinancieroService } from "../../services/grupoFinancieroService";
import { tipoGastoService } from "../../services/tipoGastoService";
import { clienteService } from "../../services/clienteService";
import Checkbox from "../../components/layout/Check";
import FilterSelect from "../../components/layout/FilterSelect";

/** @typedef {import("../../types").ReglaAsignacion} ReglaAsignacion */
/** @typedef {import("../../types").GrupoFinanciero} GrupoFinanciero */
/** @typedef {import("../../types").TipoGasto} TipoGasto */
/** @typedef {import("../../types").Cliente} Cliente */

const VACIO = {
  grupoFinancieroId: "",
  criterio: CriterioRegla.Cliente,
  clienteId: "",
  tipoGastoId: "",
};

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

function labelCliente(cliente) {
  return cliente.nombre;
}

export default function ReglasAsignacion({ embedded = false }) {
  const [reglas, setReglas] = useState(/** @type {ReglaAsignacion[]} */ ([]));
  const [grupos, setGrupos] = useState(/** @type {GrupoFinanciero[]} */ ([]));
  const [tipos, setTipos] = useState(/** @type {TipoGasto[]} */ ([]));
  const [clientes, setClientes] = useState(/** @type {Cliente[]} */ ([]));
  const [mostrarInactivas, setMostrarInactivas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const tiposPorId = useMemo(() => new Map(tipos.map((t) => [t.tipoGastoId, t.nombre])), [tipos]);
  const clientesPorId = useMemo(() => new Map(clientes.map((c) => [c.clienteId, c.nombre])), [clientes]);
  const reglasPorGrupo = useMemo(() => {
    const map = new Map();
    for (const regla of reglas) {
      const id = regla.grupoFinancieroId;
      if (!map.has(id)) {
        map.set(id, {
          id,
          nombre: regla.grupoNombre || grupos.find((g) => g.grupoFinancieroId === id)?.nombre || `Grupo ${id}`,
          reglas: [],
        });
      }
      map.get(id).reglas.push(regla);
    }
    const orden = grupos.map((g) => g.grupoFinancieroId);
    return [...map.values()].sort((a, b) => {
      const ia = orden.indexOf(a.id);
      const ib = orden.indexOf(b.id);
      if (ia === -1 && ib === -1) return a.nombre.localeCompare(b.nombre, "es");
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }, [reglas, grupos]);

  useEffect(() => {
    cargar();
  }, [mostrarInactivas]);

  async function cargar() {
    try {
      setError(null);
      const [reglasData, gruposData, tiposData, abonosData] = await Promise.all([
        reglaAsignacionService.getAll(mostrarInactivas),
        grupoFinancieroService.getAll(false),
        tipoGastoService.getAll(false),
        clienteService.getAll(false),
      ]);
      setReglas(Array.isArray(reglasData) ? reglasData : []);
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setTipos(Array.isArray(tiposData) ? tiposData : []);
      setClientes((Array.isArray(abonosData) ? abonosData : []).filter((c) => c.activo !== false));
    } catch {
      setError("No se pudieron cargar las reglas");
    } finally {
      setLoading(false);
    }
  }

  function payloadDe(origen) {
    const esCliente = Number(origen.criterio) === CriterioRegla.Cliente;
    return {
      grupoFinancieroId: origen.grupoFinancieroId,
      criterio: Number(origen.criterio),
      clienteId: esCliente ? origen.clienteId : null,
      tipoGastoId: esCliente ? null : origen.tipoGastoId,
    };
  }

  function validar(origen) {
    if (!origen.grupoFinancieroId) return "Elegí un grupo";
    if (Number(origen.criterio) === CriterioRegla.Cliente && !origen.clienteId) return "Elegí un cliente";
    if (Number(origen.criterio) === CriterioRegla.TipoGasto && !origen.tipoGastoId) return "Elegí un tipo de gasto";
    return null;
  }

  async function handleAgregar() {
    const msg = validar(form);
    if (msg) {
      setError(msg);
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await reglaAsignacionService.agregar(payloadDe(form));
      setForm(VACIO);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo agregar"));
    } finally {
      setGuardando(false);
    }
  }

  async function handleModificar() {
    const msg = validar(form);
    if (msg || !editandoId) {
      setError(msg);
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await reglaAsignacionService.modificar(editandoId, payloadDe(form));
      setEditandoId(null);
      setForm(VACIO);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo modificar"));
    } finally {
      setGuardando(false);
    }
  }

  async function handleDarDeBaja(regla) {
    if (!confirm("¿Dar de baja esta regla? Los movimientos ya grabados no cambian.")) return;
    try {
      setError(null);
      await reglaAsignacionService.darDeBaja(regla.reglaAsignacionId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo dar de baja"));
    }
  }

  async function handleReactivar(regla) {
    try {
      setError(null);
      await reglaAsignacionService.reactivar(regla.reglaAsignacionId);
      await cargar();
    } catch (e) {
      setError(errorDe(e, "No se pudo reactivar"));
    }
  }

  function empezarEdicion(regla) {
    setEditandoId(regla.reglaAsignacionId);
    setForm({
      grupoFinancieroId: String(regla.grupoFinancieroId),
      criterio: regla.criterio,
      clienteId: regla.clienteId ? String(regla.clienteId) : "",
      tipoGastoId: regla.tipoGastoId ? String(regla.tipoGastoId) : "",
    });
    setError(null);
  }

  const criterioEsCliente = Number(form.criterio) === CriterioRegla.Cliente;

  return (
    <div className={embedded ? "space-y-4" : "space-y-6 animate-fade-in-up"}>
      {!embedded && (
        <PageHeader
          title="Reglas de asignación"
          description="Una regla manda un cliente o un tipo de gasto a un grupo. Varias reglas pueden matchear el mismo movimiento."
          stats={[
            { label: "Listadas", value: reglas.length },
            { label: "Activas", value: reglas.filter((r) => r.activa).length },
          ]}
        />
      )}

      <div className="bg-surface-card p-5 space-y-4">
        {error && <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="pk-caption font-semibold">
            Grupo
            <FilterSelect
              className="mt-1 w-full"
              ariaLabel="Grupo"
              value={form.grupoFinancieroId}
              onChange={(v) => setForm((f) => ({ ...f, grupoFinancieroId: v }))}
              options={[
                { value: "", label: "Elegir" },
                ...grupos.map((g) => ({ value: g.grupoFinancieroId, label: g.nombre })),
              ]}
            />
          </label>
          <label className="pk-caption font-semibold">
            Criterio
            <FilterSelect
              className="mt-1 w-full"
              ariaLabel="Criterio"
              value={form.criterio}
              onChange={(v) =>
                setForm((f) => ({
                  ...f,
                  criterio: Number(v),
                  clienteId: "",
                  tipoGastoId: "",
                }))
              }
              options={[
                { value: CriterioRegla.Cliente, label: "Cliente" },
                { value: CriterioRegla.TipoGasto, label: "Tipo de gasto" },
              ]}
            />
          </label>
          {criterioEsCliente ? (
            <label className="pk-caption font-semibold sm:col-span-2">
              Cliente
              <FilterSelect
                className="mt-1 w-full"
                ariaLabel="Cliente"
                value={form.clienteId}
                onChange={(v) => setForm((f) => ({ ...f, clienteId: v }))}
                options={[
                  { value: "", label: "Elegir" },
                  ...clientes.map((c) => ({ value: c.clienteId, label: labelCliente(c) })),
                ]}
              />
            </label>
          ) : (
            <label className="pk-caption font-semibold sm:col-span-2">
              Tipo de gasto
              <FilterSelect
                className="mt-1 w-full"
                ariaLabel="Tipo de gasto"
                value={form.tipoGastoId}
                onChange={(v) => setForm((f) => ({ ...f, tipoGastoId: v }))}
                options={[
                  { value: "", label: "Elegir" },
                  ...tipos.map((t) => ({ value: t.tipoGastoId, label: t.nombre })),
                ]}
              />
            </label>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={editandoId ? handleModificar : handleAgregar}
            disabled={guardando}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-foreground text-sm font-semibold px-4 py-2.5 disabled:opacity-50"
          >
            {editandoId ? <Check size={15} /> : <Plus size={15} />}
            {editandoId ? "Guardar cambios" : "Agregar regla"}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={() => {
                setEditandoId(null);
                setForm(VACIO);
              }}
              className="text-xs font-semibold text-ink-muted px-3"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="ml-auto flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
          <Checkbox
            checked={mostrarInactivas}
            onChange={(e) => {
              setLoading(true);
              setMostrarInactivas(e.target.checked);
            }}
          />
          Ver dadas de baja
        </label>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando reglas…</span>
        </div>
      ) : reglas.length === 0 ? (
        <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">No hay reglas</div>
      ) : (
        <div className="space-y-6">
          {reglasPorGrupo.map((grupo) => (
            <section key={grupo.id} className="space-y-2">
              <h3 className="pk-label">
                {grupo.nombre}
                <span className="ml-2 font-semibold text-ink-faint">{grupo.reglas.length}</span>
              </h3>
              <div className="bg-surface-card overflow-x-auto">
                <table className="w-full text-sm table-fixed">
                  <colgroup>
                    <col className="w-[38%]" />
                    <col className="w-[34%]" />
                    <col className="w-[16%]" />
                    <col className="w-[12%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-line-strong text-left">
                      <th className="pk-label font-bold pl-4 pr-3 py-2.5">Criterio</th>
                      <th className="pk-label font-bold px-3 py-2.5">Detalle</th>
                      <th className="pk-label font-bold px-3 py-2.5">Estado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.reglas.map((regla) => {
                      const criterio =
                        Number(regla.criterio) === CriterioRegla.Cliente
                          ? clientesPorId.get(regla.clienteId) || `Cliente ${regla.clienteId}`
                          : tiposPorId.get(regla.tipoGastoId) || `Tipo ${regla.tipoGastoId}`;
                      const inactiva = !regla.activa;
                      return (
                        <tr key={regla.reglaAsignacionId} className={`border-b border-line ${inactiva ? "opacity-55" : "hover:bg-surface-page"}`}>
                          <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${inactiva ? "border-l-transparent" : "border-l-brand"}`}>
                            <p className="font-semibold text-ink truncate">{criterio}</p>
                          </td>
                          <td className="px-3 py-2.5 overflow-hidden">
                            <p className="pk-caption truncate">{regla.criterioDescripcion}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className={`text-sm font-semibold ${inactiva ? "text-ink-faint" : "text-success-ink"}`}>
                              {inactiva ? "De baja" : "Activa"}
                            </p>
                          </td>
                          <td className="pl-2 pr-3 py-2.5">
                            {regla.activa ? (
                              <div className="flex items-center justify-end gap-0.5">
                                <button type="button" title="Editar" onClick={() => empezarEdicion(regla)} className="pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted">
                                  <Pencil size={15} />
                                </button>
                                <button type="button" title="Dar de baja" onClick={() => handleDarDeBaja(regla)} className="pk-icon-btn p-1.5 text-ink-faint hover:text-danger-ink hover:bg-surface-muted">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end">
                                <button type="button" title="Reactivar" onClick={() => handleReactivar(regla)} className="pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted">
                                  <RotateCcw size={15} />
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
