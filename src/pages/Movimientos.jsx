import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import { movimientoService } from "../services/movimientoService";
import { clienteService } from "../services/clienteService";
import { usuarioService } from "../services/usuarioService";
import { grupoFinancieroService } from "../services/grupoFinancieroService";
import { etiquetaMovimiento, TipoMovimiento } from "../types/finanzas.js";

/** @typedef {import("../types").Movimiento} Movimiento */
/** @typedef {import("../types").Cliente} Cliente */
/** @typedef {import("../types").UsuarioResumen} UsuarioResumen */
/** @typedef {import("../types").GrupoFinanciero} GrupoFinanciero */

function formatPrecio(precio) {
  return Number(precio || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FILTRO_VACIO = { desde: "", hasta: "", tipo: "", clienteId: "", usuarioId: "", grupoFinancieroId: "" };

export default function Movimientos() {
  const [filtros, setFiltros] = useState(FILTRO_VACIO);
  const [aplicados, setAplicados] = useState(FILTRO_VACIO);
  const [movimientos, setMovimientos] = useState(/** @type {Movimiento[]} */ ([]));
  const [clientes, setClientes] = useState(/** @type {Cliente[]} */ ([]));
  const [usuarios, setUsuarios] = useState(/** @type {UsuarioResumen[]} */ ([]));
  const [grupos, setGrupos] = useState(/** @type {GrupoFinanciero[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const gruposPorId = useMemo(
    () => new Map(grupos.map((g) => [g.grupoFinancieroId, g.nombre])),
    [grupos]
  );
  const clientesPorId = useMemo(
    () => new Map(clientes.map((c) => [c.clienteId, c.nombre])),
    [clientes]
  );

  useEffect(() => {
    Promise.all([
      clienteService.getAll(false).catch(() => []),
      usuarioService.listarDelEstacionamiento().catch(() => []),
      grupoFinancieroService.getAll(true).catch(() => []),
    ]).then(([c, u, g]) => {
      setClientes(Array.isArray(c) ? c : []);
      setUsuarios(Array.isArray(u) ? u : []);
      setGrupos(Array.isArray(g) ? g : []);
    });
  }, []);

  useEffect(() => {
    cargar(aplicados);
  }, [aplicados]);

  async function cargar(f) {
    try {
      setLoading(true);
      setError(null);
      const data = await movimientoService.listar({
        desde: f.desde || undefined,
        hasta: f.hasta || undefined,
        tipo: f.tipo === "" ? undefined : Number(f.tipo),
        clienteId: f.clienteId || undefined,
        usuarioId: f.usuarioId || undefined,
        grupoFinancieroId: f.grupoFinancieroId || undefined,
      });
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar los movimientos");
    } finally {
      setLoading(false);
    }
  }

  function setFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  const selectClass = "mt-1 block w-full text-sm border border-line-strong bg-surface-muted text-ink px-2 py-1.5";

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Movimientos"
        description="Todos los movimientos del estacionamiento. El importe usa el signo de su cuenta."
        loading={loading}
        stats={[{ label: "En el filtro", value: movimientos.length }]}
      />

      <div className="bg-surface-card px-4 py-3 grid grid-cols-2 lg:grid-cols-3 gap-3">
        <label className="text-xs text-ink-muted">
          Desde
          <input type="date" value={filtros.desde} onChange={(e) => setFiltro("desde", e.target.value)} className={selectClass} />
        </label>
        <label className="text-xs text-ink-muted">
          Hasta
          <input type="date" value={filtros.hasta} onChange={(e) => setFiltro("hasta", e.target.value)} className={selectClass} />
        </label>
        <label className="text-xs text-ink-muted">
          Tipo
          <select value={filtros.tipo} onChange={(e) => setFiltro("tipo", e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {Object.entries(TipoMovimiento).map(([nombre, valor]) => (
              <option key={nombre} value={valor}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-muted">
          Cliente
          <select value={filtros.clienteId} onChange={(e) => setFiltro("clienteId", e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {clientes.map((c) => (
              <option key={c.clienteId} value={c.clienteId}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-muted">
          Usuario
          <select value={filtros.usuarioId} onChange={(e) => setFiltro("usuarioId", e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {usuarios.map((u) => (
              <option key={u.usuarioId} value={u.usuarioId}>
                {u.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-muted">
          Grupo
          <select value={filtros.grupoFinancieroId} onChange={(e) => setFiltro("grupoFinancieroId", e.target.value)} className={selectClass}>
            <option value="">Todos</option>
            {grupos.map((g) => (
              <option key={g.grupoFinancieroId} value={g.grupoFinancieroId}>
                {g.nombre}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-2 lg:col-span-3 flex gap-2">
          <button type="button" onClick={() => setAplicados(filtros)} className="text-xs font-semibold bg-brand text-brand-foreground px-3 py-2">
            Filtrar
          </button>
          <button
            type="button"
            onClick={() => {
              setFiltros(FILTRO_VACIO);
              setAplicados(FILTRO_VACIO);
            }}
            className="text-xs font-semibold text-ink-muted px-3 py-2"
          >
            Limpiar
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="bg-surface-card overflow-x-auto">
        {loading ? (
          <p className="px-4 py-8 text-sm text-ink-faint">Cargando...</p>
        ) : movimientos.length === 0 ? (
          <p className="px-4 py-8 text-sm text-ink-faint">No hay movimientos para este filtro</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="pk-label px-4 py-3">Fecha</th>
                <th className="pk-label px-4 py-3">Tipo</th>
                <th className="pk-label px-4 py-3">Concepto</th>
                <th className="pk-label px-4 py-3">Cliente</th>
                <th className="pk-label px-4 py-3">Grupos</th>
                <th className="pk-label px-4 py-3 text-right">Importe</th>
                <th className="pk-label px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.movimientoId} className="border-b border-line-subtle">
                  <td className="px-4 py-3 text-ink-muted whitespace-nowrap">{formatFecha(m.fechaHora)}</td>
                  <td className="px-4 py-3 text-ink font-semibold">{etiquetaMovimiento(m)}</td>
                  <td className="px-4 py-3 text-ink">{m.concepto}</td>
                  <td className="px-4 py-3">
                    {m.clienteId ? (
                      <Link to={`/clientes/${m.clienteId}/cuenta-corriente`} className="font-semibold text-ink hover:underline">
                        {clientesPorId.get(m.clienteId) || `#${m.clienteId}`}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {(m.grupoFinancieroIds || []).map((id) => gruposPorId.get(id) || `#${id}`).join(", ") || "—"}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold tabular-nums ${Number(m.importe) < 0 ? "text-danger" : "text-ink"}`}>
                    {formatPrecio(m.importe)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/movimientos/${m.movimientoId}`}
                      title="Auditar movimiento"
                      className="inline-flex p-1.5 text-ink-faint hover:text-ink"
                    >
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
