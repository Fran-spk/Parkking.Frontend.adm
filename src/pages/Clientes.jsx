import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Pencil, Plus, RotateCcw, Trash2, Wallet } from "lucide-react";
import { clienteService } from "../services/clienteService";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FilterSelect from "../components/layout/FilterSelect";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Checkbox from "../components/layout/Check";
import Patente from "../components/layout/Patente";
import PanelCliente from "../components/layout/PanelCliente";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import {
  FILTROS_CLIENTE,
  ORDENES_CLIENTE,
  clienteCoincide,
  estadoCuenta,
  fechaCorta,
  haceCuanto,
  ordenarClientes,
  pasaFiltro,
  plata,
  resumenClientes,
  whatsappUrl,
} from "../utils/clienteHelpers";

const MAX_CHIPS = 2;

function Cocheras({ lista }) {
  if (lista.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {lista.slice(0, 3).map((n) => (
        <span key={n} className="px-1.5 py-0.5 bg-surface-muted text-[11px] font-bold text-ink tabular-nums">
          {n}
        </span>
      ))}
      {lista.length > 3 && <span className="pk-caption">+{lista.length - 3}</span>}
    </span>
  );
}

function Patentes({ lista }) {
  if (lista.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {lista.slice(0, MAX_CHIPS).map((p) => (
        <Patente key={p} valor={p} size="sm" />
      ))}
      {lista.length > MAX_CHIPS && <span className="pk-caption" title={lista.slice(MAX_CHIPS).join(", ")}>+{lista.length - MAX_CHIPS}</span>}
    </span>
  );
}

function Cuenta({ cliente }) {
  const estado = estadoCuenta(cliente);
  return (
    <div className="leading-tight">
      <p className={`text-sm font-semibold tabular-nums ${estado.texto}`}>{estado.label}</p>
      {cliente.deuda > 0 && (
        <p className="pk-caption tabular-nums">
          {cliente.deudaDetalle.length} {cliente.deudaDetalle.length === 1 ? "ítem" : "ítems"} · {cliente.diasAtraso} d
        </p>
      )}
    </div>
  );
}

function Acciones({ cliente, onCuenta, onEditar, onBaja, onReactivar }) {
  const icono = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";
  if (!cliente.activo) {
    return (
      <button type="button" title="Reactivar" onClick={onReactivar} className={icono}>
        <RotateCcw size={15} />
      </button>
    );
  }
  const wa = whatsappUrl(cliente.telefono);
  return (
    <div className="flex items-center justify-end gap-0.5">
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp" className={icono}>
          <MessageCircle size={15} />
        </a>
      )}
      <button type="button" title="Cuenta corriente" onClick={onCuenta} className={icono}>
        <Wallet size={15} />
      </button>
      <button type="button" title="Editar" onClick={onEditar} className={icono}>
        <Pencil size={15} />
      </button>
      <button
        type="button"
        title={cliente.abonosActivos > 0 ? "Tiene abonos activos" : "Dar de baja"}
        disabled={cliente.abonosActivos > 0}
        onClick={onBaja}
        className={`${icono} hover:text-danger-ink disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [orden, setOrden] = useState("nombre");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panelId, setPanelId] = useState(null);
  const [pagina, setPagina] = useState(1);

  const cargarDatos = useCallback(async () => {
    try {
      setError(null);
      const data = await clienteService.listado(mostrarInactivos);
      setClientes(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, [mostrarInactivos]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const resumen = useMemo(() => resumenClientes(clientes), [clientes]);
  const visibles = useMemo(
    () => ordenarClientes(clientes.filter((c) => pasaFiltro(c, filtro) && clienteCoincide(c, busqueda)), orden),
    [clientes, filtro, busqueda, orden]
  );
  const panel = panelId != null ? clientes.find((c) => c.clienteId === panelId) : null;
  const hayFiltros = filtro !== "todos" || busqueda.trim() !== "";
  const paginaClave = `${filtro}|${orden}|${busqueda}|${mostrarInactivos}`;

  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);

  async function darDeBaja(cliente) {
    if (!confirm(`¿Dar de baja a ${cliente.nombre}?`)) return;
    try {
      await clienteService.darDeBaja(cliente.clienteId);
      setPanelId(null);
      await cargarDatos();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja al cliente");
    }
  }

  async function reactivar(cliente) {
    try {
      await clienteService.reactivar(cliente.clienteId);
      await cargarDatos();
    } catch {
      setError("No se pudo reactivar el cliente");
    }
  }

  const acciones = (c) => ({
    onCuenta: () => navigate(`/clientes/${c.clienteId}/cuenta-corriente`),
    onEditar: () => navigate(`/clientes/${c.clienteId}/editar`),
    onBaja: () => darDeBaja(c),
    onReactivar: () => reactivar(c),
  });

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Clientes"
        description="Abonados y contactos del estacionamiento, con su estado de cuenta."
        loading={loading}
        action={
          <PageHeaderAction onClick={() => navigate("/clientes/nuevo")}>
            <Plus size={16} />
            Nuevo cliente
          </PageHeaderAction>
        }
        stats={[
          { label: "Activos", value: resumen.activos, onClick: () => setFiltro("todos") },
          { label: "Con abono", value: resumen.abonados, tone: "success", onClick: () => setFiltro("abonados") },
          { label: "Con deuda", value: resumen.conDeuda, tone: "danger", onClick: () => setFiltro("deuda") },
          { label: "Deuda total", value: plata(resumen.deudaTotal), tone: "danger", onClick: () => setOrden("deuda") },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Nombre, DNI, teléfono, patente o cochera"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Filtrar clientes"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS_CLIENTE.map((f) => ({ ...f, cantidad: resumen.cantidades[f.value] }))}
        />
        <FilterSelect ariaLabel="Orden" value={orden} onChange={setOrden} options={ORDENES_CLIENTE} />
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("todos");
              setBusqueda("");
            }}
          >
            Limpiar filtros
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
          <Checkbox checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
          Ver dados de baja
        </label>
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando clientes…</span>
        </div>
      ) : clientes.length === 0 ? (
        <Vacio texto="Todavía no hay clientes. Cargá el primero con Nuevo cliente." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún cliente coincide con la búsqueda." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[16%] hidden xl:table-column" />
                <col className="w-[14%]" />
                <col className="w-[10%] hidden lg:table-column" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Cliente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Contacto</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cocheras</th>
                  <th className="pk-label font-bold px-3 py-2.5 hidden xl:table-cell">Patentes</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cuenta</th>
                  <th className="pk-label font-bold px-3 py-2.5 hidden lg:table-cell">Último pago</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((c) => (
                  <tr
                    key={c.clienteId}
                    onClick={() => setPanelId(c.clienteId)}
                    className={`border-b border-line cursor-pointer hover:bg-surface-page ${c.activo ? "" : "opacity-55"}`}
                  >
                    <td
                      className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${
                        c.deuda > 0 ? "border-l-danger" : "border-l-transparent"
                      }`}
                    >
                      <p className="font-semibold text-ink truncate">{c.nombre}</p>
                      <p className="pk-caption truncate">
                        {[c.documento && `DNI ${c.documento}`, c.observacion].filter(Boolean).join(" · ") || "\u00a0"}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <p className="text-ink truncate tabular-nums">{c.telefono ?? <span className="text-ink-faint">—</span>}</p>
                      <p className="pk-caption truncate">{c.email ?? "\u00a0"}</p>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <Cocheras lista={c.cocheras} />
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden hidden xl:table-cell">
                      <Patentes lista={c.patentes} />
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <Cuenta cliente={c} />
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden hidden lg:table-cell">
                      {c.ultimoPago ? (
                        <div className="leading-tight">
                          <p className="text-ink tabular-nums">{fechaCorta(c.ultimoPago)}</p>
                          <p className="pk-caption">{haceCuanto(c.ultimoPago)}</p>
                        </div>
                      ) : (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                    <td className="pl-2 pr-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Acciones cliente={c} {...acciones(c)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((c) => (
              <li key={c.clienteId} className={c.activo ? "" : "opacity-55"}>
                <button
                  type="button"
                  onClick={() => setPanelId(c.clienteId)}
                  className={`w-full text-left px-4 py-3 border-l-[3px] ${c.deuda > 0 ? "border-l-danger" : "border-l-transparent"}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink truncate">{c.nombre}</span>
                    <Cuenta cliente={c} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Cocheras lista={c.cocheras} />
                    <Patentes lista={c.patentes} />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}

      {panel && (
        <PanelCliente
          cliente={panel}
          onClose={() => setPanelId(null)}
          onEditar={() => navigate(`/clientes/${panel.clienteId}/editar`)}
          onDarDeBaja={() => darDeBaja(panel)}
          onReactivar={() => reactivar(panel)}
        />
      )}
    </div>
  );
}
