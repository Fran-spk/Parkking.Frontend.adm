import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import { fieldClass } from "../components/layout/FilterSelect";
import { cuentaCorrienteService } from "../services/cuentaCorrienteService";
import { clienteService } from "../services/clienteService";
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

/** @typedef {import("../types").Cliente} Cliente */
/** @typedef {import("../types").GrupoFinanciero} GrupoFinanciero */
/** @typedef {import("../types").Movimiento} Movimiento */

function hora(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function CuentaCorriente() {
  const [searchParams, setSearchParams] = useSearchParams();
  const grupoId = searchParams.get("grupo") || "";
  const esEstacionamiento = !grupoId;

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [movimientos, setMovimientos] = useState(/** @type {Movimiento[]} */ ([]));
  const [saldo, setSaldo] = useState(null);
  const [totalesGrupo, setTotalesGrupo] = useState(null);
  const [clientes, setClientes] = useState(/** @type {Cliente[]} */ ([]));
  const [grupos, setGrupos] = useState(/** @type {GrupoFinanciero[]} */ ([]));
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const nombres = useMemo(() => new Map(clientes.map((c) => [c.clienteId, c.nombre])), [clientes]);
  const grupoActivo = grupos.find((g) => String(g.grupoFinancieroId) === String(grupoId));

  useEffect(() => {
    clienteService.getAll(false).then((data) => setClientes(Array.isArray(data) ? data : [])).catch(() => []);
    grupoFinancieroService.getAll(false).then((data) => setGrupos(Array.isArray(data) ? data : [])).catch(() => []);
  }, []);

  useEffect(() => {
    cargar(desde, hasta);
  }, [grupoId]);

  async function cargar(d, h) {
    try {
      setLoading(true);
      setError(null);
      if (esEstacionamiento) {
        const data = await cuentaCorrienteService.estacionamiento(d, h);
        setMovimientos(Array.isArray(data?.movimientos) ? data.movimientos : []);
        setSaldo(data?.saldo ?? 0);
        setTotalesGrupo(null);
      } else {
        const data = await grupoFinancieroService.periodo(grupoId, d, h);
        setMovimientos(Array.isArray(data?.movimientos) ? data.movimientos : []);
        setSaldo(null);
        setTotalesGrupo({
          nombre: data?.nombre,
          ingresos: Number(data?.totalIngresos || 0),
          egresos: Number(data?.totalEgresos || 0),
          neto: Number(data?.neto || 0),
        });
      }
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo cargar la cuenta corriente");
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }

  function setVista(value) {
    setFiltro("todos");
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === "estacionamiento") next.delete("grupo");
      else next.set("grupo", value);
      return next;
    });
  }

  const resumen = useMemo(() => resumenMovimientos(movimientos), [movimientos]);
  const visibles = useMemo(
    () =>
      movimientos.filter(
        (m) => pasaFiltroMov(m, filtro) && coincideMov(m, busqueda, nombres.get(m.clienteId))
      ),
    [movimientos, filtro, busqueda, nombres]
  );

  const paginaClave = `${filtro}|${busqueda}|${desde}|${hasta}|${grupoId}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const recorte = useMemo(() => resumenMovimientos(visibles), [visibles]);
  const hayFiltros = filtro !== "todos" || busqueda.trim() !== "" || desde || hasta;
  const nombreGrupo = totalesGrupo?.nombre || grupoActivo?.nombre || "Grupo";

  const vistas = [
    { value: "estacionamiento", label: "Estacionamiento" },
    ...grupos.map((g) => ({ value: String(g.grupoFinancieroId), label: g.nombre })),
  ];
  if (grupoId && !vistas.some((v) => v.value === String(grupoId))) {
    vistas.push({ value: String(grupoId), label: nombreGrupo });
  }

  const stats = esEstacionamiento
    ? [
        { label: "Saldo", value: plata(saldo), tone: Number(saldo) < 0 ? "danger" : "success" },
        { label: "Ingresos", value: plata(resumen.ingresos), onClick: () => setFiltro("0") },
        { label: "Egresos", value: plata(resumen.egresos), tone: resumen.egresos > 0 ? "danger" : "default", onClick: () => setFiltro("1") },
        { label: "Neto del filtro", value: plata(recorte.neto), tone: recorte.neto < 0 ? "danger" : "success" },
      ]
    : [
        { label: "Ingresos", value: plata(totalesGrupo?.ingresos), onClick: () => setFiltro("0") },
        { label: "Egresos", value: plata(totalesGrupo?.egresos), tone: Number(totalesGrupo?.egresos) > 0 ? "danger" : "default", onClick: () => setFiltro("1") },
        { label: "Neto", value: plata(totalesGrupo?.neto), tone: Number(totalesGrupo?.neto) < 0 ? "danger" : "success" },
        { label: "Movimientos", value: movimientos.length, onClick: () => setFiltro("todos") },
      ];

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Cuenta corriente"
        description={
          esEstacionamiento
            ? "Movimientos del estacionamiento. El saldo positivo es resultado a favor."
            : `Recorte de ${nombreGrupo}. No es una cuenta: agrupa movimientos para consultarlos.`
        }
        loading={loading}
        stats={stats}
      />

      <div className="flex flex-wrap items-center gap-3">
        <FiltroSegmentado
          ariaLabel="Estacionamiento o grupo"
          value={esEstacionamiento ? "estacionamiento" : String(grupoId)}
          onChange={setVista}
          opciones={vistas}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Concepto, tipo o cliente"
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando cuenta…</span>
        </div>
      ) : movimientos.length === 0 ? (
        <Vacio texto={esEstacionamiento ? "No hay movimientos en este período." : "Este grupo no tiene movimientos en este período."} />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún movimiento coincide con este filtro." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[28%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Fecha</th>
                  <th className="pk-label font-bold px-3 py-2.5">Tipo</th>
                  <th className="pk-label font-bold px-3 py-2.5">Concepto</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cliente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Importe</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((m) => {
                  const importe = Number(m.importe);
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
                            {nombres.get(m.clienteId) || `#${m.clienteId}`}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
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
                    <p className="pk-caption">{fechaCorta(m.fechaHora)} · {nombres.get(m.clienteId) || "Estacionamiento"}</p>
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
