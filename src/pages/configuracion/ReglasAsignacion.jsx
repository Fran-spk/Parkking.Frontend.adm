import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Check, RotateCcw, GitBranch } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import { reglaAsignacionService, CriterioRegla } from "../../services/reglaAsignacionService";
import { grupoFinancieroService } from "../../services/grupoFinancieroService";
import { tipoGastoService } from "../../services/tipoGastoService";
import { clienteService } from "../../services/clienteService";

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

export default function ReglasAsignacion() {
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
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Reglas de asignación"
        description="Una regla manda un cliente o un tipo de gasto a un grupo. Varias reglas pueden matchear el mismo movimiento."
        stats={[
          { label: "Listadas", value: reglas.length },
          { label: "Activas", value: reglas.filter((r) => r.activa).length },
        ]}
      />

      <div className="bg-surface-card p-5 space-y-4">
        {error && <div className="px-4 py-2.5 bg-danger-muted text-danger text-xs font-semibold">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-ink-muted">
            Grupo
            <select
              value={form.grupoFinancieroId}
              onChange={(e) => setForm((f) => ({ ...f, grupoFinancieroId: e.target.value }))}
              className="mt-1 block w-full text-sm border border-line-strong bg-surface-muted text-ink px-2 py-2"
            >
              <option value="">Elegir</option>
              {grupos.map((g) => (
                <option key={g.grupoFinancieroId} value={g.grupoFinancieroId}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-ink-muted">
            Criterio
            <select
              value={form.criterio}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  criterio: Number(e.target.value),
                  clienteId: "",
                  tipoGastoId: "",
                }))
              }
              className="mt-1 block w-full text-sm border border-line-strong bg-surface-muted text-ink px-2 py-2"
            >
              <option value={CriterioRegla.Cliente}>Cliente</option>
              <option value={CriterioRegla.TipoGasto}>Tipo de gasto</option>
            </select>
          </label>
          {criterioEsCliente ? (
            <label className="text-xs text-ink-muted sm:col-span-2">
              Cliente
              <select
                value={form.clienteId}
                onChange={(e) => setForm((f) => ({ ...f, clienteId: e.target.value }))}
                className="mt-1 block w-full text-sm border border-line-strong bg-surface-muted text-ink px-2 py-2"
              >
                <option value="">Elegir</option>
                {clientes.map((c) => (
                  <option key={c.clienteId} value={c.clienteId}>
                    {labelCliente(c)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-xs text-ink-muted sm:col-span-2">
              Tipo de gasto
              <select
                value={form.tipoGastoId}
                onChange={(e) => setForm((f) => ({ ...f, tipoGastoId: e.target.value }))}
                className="mt-1 block w-full text-sm border border-line-strong bg-surface-muted text-ink px-2 py-2"
              >
                <option value="">Elegir</option>
                {tipos.map((t) => (
                  <option key={t.tipoGastoId} value={t.tipoGastoId}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={editandoId ? handleModificar : handleAgregar}
            disabled={guardando}
            className="inline-flex items-center gap-1.5 bg-brand text-brand-foreground text-xs font-bold px-4 py-2.5 disabled:opacity-50"
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

      <div className="bg-surface-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-line-subtle">
          <span className="pk-label flex items-center gap-2">
            <GitBranch size={13} /> Listado
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={mostrarInactivas}
              onChange={(e) => {
                setLoading(true);
                setMostrarInactivas(e.target.checked);
              }}
            />
            Mostrar dadas de baja
          </label>
        </div>

        {loading ? (
          <p className="text-xs text-ink-faint py-4">Cargando...</p>
        ) : reglas.length === 0 ? (
          <p className="text-xs text-ink-faint py-4">No hay reglas</p>
        ) : (
          <ul className="divide-y divide-line">
            {reglas.map((regla) => {
              const criterio =
                Number(regla.criterio) === CriterioRegla.Cliente
                  ? clientesPorId.get(regla.clienteId) || `Cliente ${regla.clienteId}`
                  : tiposPorId.get(regla.tipoGastoId) || `Tipo ${regla.tipoGastoId}`;
              return (
                <li key={regla.reglaAsignacionId} className={`py-3 flex items-center gap-3 ${regla.activa ? "" : "opacity-60"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-ink">{regla.grupoNombre}</p>
                    <p className="text-xs text-ink-muted truncate">
                      {regla.criterioDescripcion} · {criterio}
                    </p>
                  </div>
                  {!regla.activa && <span className="text-[10px] font-bold text-ink-muted">Baja</span>}
                  {regla.activa ? (
                    <div className="flex gap-1">
                      <button type="button" title="Editar" onClick={() => empezarEdicion(regla)} className="p-1.5 text-ink-faint hover:text-warning">
                        <Pencil size={15} />
                      </button>
                      <button type="button" title="Dar de baja" onClick={() => handleDarDeBaja(regla)} className="p-1.5 text-ink-faint hover:text-danger">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ) : (
                    <button type="button" title="Reactivar" onClick={() => handleReactivar(regla)} className="p-1.5 text-ink-faint hover:text-success">
                      <RotateCcw size={15} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
