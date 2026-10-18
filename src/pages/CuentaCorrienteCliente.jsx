import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, MessageCircle } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import { fieldClass } from "../components/layout/FilterSelect";
import { cuentaCorrienteService } from "../services/cuentaCorrienteService";
import { clienteService } from "../services/clienteService";
import { impactoEnCliente } from "../types/finanzas.js";
import { plata, fechaCorta, whatsappUrl } from "../utils/clienteHelpers";
import {
  FILTROS_MOVIMIENTO,
  coincideMov,
  etiquetaMovimiento,
  pasaFiltroMov,
  resumenMovimientos,
} from "../utils/finanzasHelpers";

/** @typedef {import("../types").CuentaCorriente} CuentaCorriente */
/** @typedef {import("../types").Cliente} Cliente */

function hora(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function CuentaCorrienteCliente() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cuenta, setCuenta] = useState(/** @type {CuentaCorriente | null} */ (null));
  const [cliente, setCliente] = useState(/** @type {Cliente | null} */ (null));
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    clienteService.getById(clienteId).then(setCliente).catch(() => setCliente(null));
  }, [clienteId]);

  useEffect(() => {
    cargar("", "");
  }, [clienteId]);

  async function cargar(d, h) {
    try {
      setLoading(true);
      setError(null);
      const data = await cuentaCorrienteService.cliente(clienteId, d, h);
      setCuenta(data);
    } catch (e) {
      setError(typeof e.response?.data === "string" ? e.response.data : "No se pudo cargar la cuenta del cliente");
    } finally {
      setLoading(false);
    }
  }

  const movimientos = cuenta?.movimientos || [];
  const saldo = Number(cuenta?.saldo || 0);
  const resumen = useMemo(() => resumenMovimientos(movimientos), [movimientos]);
  const visibles = useMemo(
    () => movimientos.filter((m) => pasaFiltroMov(m, filtro) && coincideMov(m, busqueda)),
    [movimientos, filtro, busqueda]
  );

  const paginaClave = `${filtro}|${busqueda}|${desde}|${hasta}|${clienteId}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const hayFiltros = filtro !== "todos" || busqueda.trim() !== "" || desde || hasta;
  const wa = whatsappUrl(cliente?.telefono);

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate("/clientes")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink"
      >
        <ArrowLeft size={14} /> Clientes
      </button>

      <PageHeader
        title={cliente?.nombre ? `Cuenta de ${cliente.nombre}` : "Cuenta del cliente"}
        description="Saldo positivo: el cliente debe. Saldo negativo: tiene a favor."
        loading={loading}
        stats={[
          { label: "Saldo", value: plata(saldo), tone: saldo > 0 ? "danger" : saldo < 0 ? "success" : "default" },
          { label: "Movimientos", value: movimientos.length, onClick: () => setFiltro("todos") },
          { label: "Ingresos", value: resumen.cantidades["0"], onClick: () => setFiltro("0") },
          { label: "Ajustes", value: resumen.cantidades["3"], onClick: () => setFiltro("3") },
        ]}
      />

      {cliente && (
        <div className="bg-surface-card px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="pk-label">Contacto</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-semibold text-ink tabular-nums">{cliente.telefono || "—"}</p>
              {wa && (
                <a href={wa} target="_blank" rel="noreferrer" className="pk-icon-btn p-1 text-ink-faint hover:text-ink" title="WhatsApp">
                  <MessageCircle size={13} />
                </a>
              )}
            </div>
          </div>
          <div>
            <p className="pk-label">Documento</p>
            <p className="text-sm font-semibold text-ink">{cliente.documento || "—"}</p>
          </div>
          <div>
            <p className="pk-label">Email</p>
            <p className="text-sm font-semibold text-ink truncate">{cliente.email || "—"}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Concepto o tipo"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Tipo de movimiento"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS_MOVIMIENTO.map((f) => ({ ...f, cantidad: resumen.cantidades[f.value] }))}
        />
        <label className="pk-caption font-semibold">
          Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <label className="pk-caption font-semibold">
          Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={`${fieldClass} mt-1`} />
        </label>
        <button
          type="button"
          onClick={() => cargar(desde, hasta)}
          className="text-xs font-semibold bg-brand text-brand-foreground px-3 py-2 hover:bg-brand-strong"
        >
          Filtrar
        </button>
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("todos");
              setBusqueda("");
              setDesde("");
              setHasta("");
              cargar("", "");
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}
      {!loading && cuenta && !cuenta.existe && (
        <p className="pk-caption">Todavía no tiene cuenta corriente. El saldo es cero hasta el primer movimiento.</p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando cuenta…</span>
        </div>
      ) : movimientos.length === 0 ? (
        <Vacio texto="No hay movimientos en este período." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún movimiento coincide con este filtro." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[42%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Fecha</th>
                  <th className="pk-label font-bold px-3 py-2.5">Tipo</th>
                  <th className="pk-label font-bold px-3 py-2.5">Concepto</th>
                  <th className="pk-label font-bold px-3 py-2.5">En su cuenta</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((m) => {
                  const enCuenta = impactoEnCliente(m);
                  return (
                    <tr key={m.movimientoId} className="border-b border-line hover:bg-surface-page">
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${enCuenta > 0 ? "border-l-danger" : "border-l-success"}`}>
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
                        <p className={`font-semibold tabular-nums ${enCuenta > 0 ? "text-danger-ink" : "text-ink"}`}>
                          {plata(enCuenta)}
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
              const enCuenta = impactoEnCliente(m);
              return (
                <li key={m.movimientoId}>
                  <Link to={`/movimientos/${m.movimientoId}`} className={`block px-4 py-3 border-l-[3px] ${enCuenta > 0 ? "border-l-danger" : "border-l-success"}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-ink truncate">{etiquetaMovimiento(m)}</span>
                      <span className={`text-sm font-semibold tabular-nums ${enCuenta > 0 ? "text-danger-ink" : "text-ink"}`}>
                        {plata(enCuenta)}
                      </span>
                    </div>
                    <p className="pk-caption mt-0.5 truncate">{m.concepto}</p>
                    <p className="pk-caption">{fechaCorta(m.fechaHora)}</p>
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
