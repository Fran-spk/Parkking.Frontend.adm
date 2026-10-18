import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import FilterSelect, { fieldClass } from "../components/layout/FilterSelect";
import { movimientoService } from "../services/movimientoService";
import { clienteService } from "../services/clienteService";
import { usuarioService } from "../services/usuarioService";
import { grupoFinancieroService } from "../services/grupoFinancieroService";
import { plata, fechaCorta } from "../utils/clienteHelpers";
import {
  FILTROS_MOVIMIENTO,
  bordeMov,
  coincideMov,
  etiquetaMovimiento,
  pasaFiltroMov,
  resumenMovimientos,
} from "../utils/finanzasHelpers";

/** @typedef {import("../types").Movimiento} Movimiento */
/** @typedef {import("../types").Cliente} Cliente */
/** @typedef {import("../types").UsuarioResumen} UsuarioResumen */
/** @typedef {import("../types").GrupoFinanciero} GrupoFinanciero */

const FILTRO_VACIO = { desde: "", hasta: "", tipo: "", clienteId: "", usuarioId: "", grupoFinancieroId: "" };

function hora(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function Movimientos() {
  const [filtros, setFiltros] = useState(FILTRO_VACIO);
  const [aplicados, setAplicados] = useState(FILTRO_VACIO);
  const [movimientos, setMovimientos] = useState(/** @type {Movimiento[]} */ ([]));
  const [clientes, setClientes] = useState(/** @type {Cliente[]} */ ([]));
  const [usuarios, setUsuarios] = useState(/** @type {UsuarioResumen[]} */ ([]));
  const [grupos, setGrupos] = useState(/** @type {GrupoFinanciero[]} */ ([]));
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const gruposPorId = useMemo(() => new Map(grupos.map((g) => [g.grupoFinancieroId, g.nombre])), [grupos]);
  const clientesPorId = useMemo(() => new Map(clientes.map((c) => [c.clienteId, c.nombre])), [clientes]);

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

  const resumen = useMemo(() => resumenMovimientos(movimientos), [movimientos]);
  const visibles = useMemo(
    () =>
      movimientos.filter(
        (m) => pasaFiltroMov(m, filtroTipo) && coincideMov(m, busqueda, clientesPorId.get(m.clienteId))
      ),
    [movimientos, filtroTipo, busqueda, clientesPorId]
  );

  const paginaClave = `${filtroTipo}|${busqueda}|${aplicados.desde}|${aplicados.hasta}|${aplicados.clienteId}|${aplicados.usuarioId}|${aplicados.grupoFinancieroId}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const recorte = useMemo(() => resumenMovimientos(visibles), [visibles]);
  const hayFiltros =
    filtroTipo !== "todos" ||
    busqueda.trim() !== "" ||
    Object.values(aplicados).some(Boolean);

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Movimientos"
        description="Todos los movimientos del estacionamiento. El importe usa el signo de su cuenta."
        loading={loading}
        stats={[
          { label: "En el filtro", value: visibles.length, onClick: () => setFiltroTipo("todos") },
          { label: "Ingresos", value: plata(recorte.ingresos), onClick: () => setFiltroTipo("0") },
          { label: "Egresos", value: plata(recorte.egresos), tone: recorte.egresos > 0 ? "danger" : "default", onClick: () => setFiltroTipo("1") },
          { label: "Neto", value: plata(recorte.neto), tone: recorte.neto < 0 ? "danger" : "success" },
        ]}
      />

      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Concepto, tipo o cliente"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Tipo de movimiento"
          value={filtroTipo}
          onChange={setFiltroTipo}
          opciones={FILTROS_MOVIMIENTO.map((f) => ({ ...f, cantidad: resumen.cantidades[f.value] }))}
        />
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltroTipo("todos");
              setBusqueda("");
              setFiltros(FILTRO_VACIO);
              setAplicados(FILTRO_VACIO);
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="pk-caption font-semibold">
          Desde
          <input type="date" value={filtros.desde} onChange={(e) => setFiltro("desde", e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <label className="pk-caption font-semibold">
          Hasta
          <input type="date" value={filtros.hasta} onChange={(e) => setFiltro("hasta", e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <FilterSelect
          ariaLabel="Cliente"
          className="min-w-[10rem]"
          value={filtros.clienteId}
          onChange={(v) => setFiltro("clienteId", v)}
          options={[{ value: "", label: "Cliente" }, ...clientes.map((c) => ({ value: c.clienteId, label: c.nombre }))]}
        />
        <FilterSelect
          ariaLabel="Usuario"
          className="min-w-[10rem]"
          value={filtros.usuarioId}
          onChange={(v) => setFiltro("usuarioId", v)}
          options={[{ value: "", label: "Usuario" }, ...usuarios.map((u) => ({ value: u.usuarioId, label: u.nombre }))]}
        />
        <FilterSelect
          ariaLabel="Grupo"
          className="min-w-[10rem]"
          value={filtros.grupoFinancieroId}
          onChange={(v) => setFiltro("grupoFinancieroId", v)}
          options={[{ value: "", label: "Grupo" }, ...grupos.map((g) => ({ value: g.grupoFinancieroId, label: g.nombre }))]}
        />
        <button type="button" onClick={() => setAplicados(filtros)} className="text-xs font-semibold bg-brand text-brand-foreground px-3 py-2 hover:bg-brand-strong">
          Aplicar
        </button>
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando movimientos…</span>
        </div>
      ) : movimientos.length === 0 ? (
        <Vacio texto="No hay movimientos para este recorte." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún movimiento coincide con este filtro." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[24%]" />
                <col className="w-[18%]" />
                <col className="w-[16%] hidden lg:table-column" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Fecha</th>
                  <th className="pk-label font-bold px-3 py-2.5">Tipo</th>
                  <th className="pk-label font-bold px-3 py-2.5">Concepto</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cliente</th>
                  <th className="pk-label font-bold px-3 py-2.5 hidden lg:table-cell">Grupos</th>
                  <th className="pk-label font-bold px-3 py-2.5">Importe</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((m) => {
                  const importe = Number(m.importe);
                  const gruposLabel = (m.grupoFinancieroIds || []).map((id) => gruposPorId.get(id) || `#${id}`).join(" · ") || "—";
                  return (
                    <tr key={m.movimientoId} className="border-b border-line hover:bg-surface-page">
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${bordeMov(importe)}`}>
                        <p className="font-semibold text-ink tabular-nums">{fechaCorta(m.fechaHora)}</p>
                        <p className="pk-caption tabular-nums">{hora(m.fechaHora)}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink">{etiquetaMovimiento(m)}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink truncate">{m.concepto}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        {m.clienteId ? (
                          <Link to={`/clientes/${m.clienteId}/cuenta-corriente`} className="font-semibold text-ink hover:text-brand truncate block">
                            {clientesPorId.get(m.clienteId) || `#${m.clienteId}`}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden hidden lg:table-cell">
                        <p className="pk-caption truncate">{gruposLabel}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className={`font-semibold tabular-nums ${importe < 0 ? "text-danger-ink" : "text-ink"}`}>
                          {plata(importe)}
                        </p>
                      </td>
                      <td className="pl-2 pr-3 py-2.5">
                        <Link to={`/movimientos/${m.movimientoId}`} title="Auditar" className="pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted inline-flex">
                          <Eye size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((m) => {
              const importe = Number(m.importe);
              return (
                <li key={m.movimientoId}>
                  <Link to={`/movimientos/${m.movimientoId}`} className={`block px-4 py-3 border-l-[3px] ${bordeMov(importe)}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-ink truncate">{etiquetaMovimiento(m)}</span>
                      <span className={`text-sm font-semibold tabular-nums ${importe < 0 ? "text-danger-ink" : "text-ink"}`}>
                        {plata(importe)}
                      </span>
                    </div>
                    <p className="pk-caption mt-0.5 truncate">{m.concepto}</p>
                    <p className="pk-caption">{fechaCorta(m.fechaHora)} · {clientesPorId.get(m.clienteId) || "Estacionamiento"}</p>
                  </Link>
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
