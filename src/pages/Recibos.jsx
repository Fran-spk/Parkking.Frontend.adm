import { useEffect, useMemo, useState } from "react";
import { Printer, Ban, Mail, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { reciboService } from "../services/reciboService";
import { estacionamientoService } from "../services/estacionamientoService";
import { imprimirReciboPdf } from "../utils/imprimirRecibo";
import PageHeader from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Patente from "../components/layout/Patente";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import { fieldClass } from "../components/layout/FilterSelect";
import { fechaCorta, plata } from "../utils/clienteHelpers";

/** @typedef {import("../types").Recibo} Recibo */

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "Abono", label: "Abonos" },
  { value: "Estadia", label: "Estadías" },
  { value: "Sena", label: "Señas" },
];

function toYmd(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function origenDe(r) {
  if (r.origen) return r.origen;
  if (String(r.periodosLabel || "").toLowerCase() === "estadía") return "Estadia";
  if (r.abonoId) return "Abono";
  return "Sena";
}

function labelOrigen(origen) {
  if (origen === "Estadia") return "Estadía";
  if (origen === "Sena") return "Seña";
  return "Abono";
}

function Chips({ label, patente }) {
  const lista = String(label || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lista.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {lista.slice(0, 2).map((v) =>
        patente ? (
          <Patente key={v} valor={v} size="sm" />
        ) : (
          <span key={v} className="px-1.5 py-0.5 bg-surface-muted text-[11px] font-bold text-ink tabular-nums">
            {v}
          </span>
        )
      )}
      {lista.length > 2 && <span className="pk-caption">+{lista.length - 2}</span>}
    </span>
  );
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function Recibos() {
  const [recibos, setRecibos] = useState(/** @type {Recibo[]} */ ([]));
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [okMsg, setOkMsg] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [metaEst, setMetaEst] = useState({ nombre: "Parkking", direccion: "" });

  useEffect(() => {
    estacionamientoService
      .get()
      .then((d) => setMetaEst({ nombre: d?.nombre || "Parkking", direccion: d?.direccion || "" }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [desde, hasta]);

  async function cargar() {
    try {
      setLoading(true);
      setError(null);
      const data = await reciboService.listar({
        desde: toYmd(desde) || undefined,
        hasta: toYmd(hasta) || undefined,
      });
      setRecibos(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar los recibos");
    } finally {
      setLoading(false);
    }
  }

  async function handleImprimir(recibo) {
    try {
      setBusyId(recibo.reciboId);
      const fresh = await reciboService.getById(recibo.reciboId);
      imprimirReciboPdf(fresh, {
        nombreEstacionamiento: metaEst.nombre,
        direccion: metaEst.direccion,
      });
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo imprimir el recibo");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAnular(recibo) {
    const motivo = window.prompt(`Anular recibo ${recibo.numeroFormateado || recibo.numero}?\nMotivo (opcional):`, "");
    if (motivo === null) return;
    try {
      setBusyId(recibo.reciboId);
      setOkMsg(null);
      await reciboService.anular(recibo.reciboId, motivo || null);
      await cargar();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo anular");
    } finally {
      setBusyId(null);
    }
  }

  async function handleEnviarEmail(recibo) {
    const email = window.prompt(
      `Enviar recibo ${recibo.numeroFormateado || recibo.numero} por email.\n\nDejá vacío para usar el email del abono/cliente, o escribí uno:`,
      ""
    );
    if (email === null) return;
    try {
      setBusyId(recibo.reciboId);
      setError(null);
      setOkMsg(null);
      const res = await reciboService.enviarEmail(recibo.reciboId, email.trim() || undefined);
      if (res?.simulado) {
        setOkMsg(`Simulado → ${res.destinatario} (SMTP deshabilitado en el servidor).`);
      } else {
        setOkMsg(`Recibo enviado a ${res?.destinatario || "el destinatario"}.`);
      }
    } catch (e) {
      const data = e.response?.data;
      setError(
        (typeof data === "string" && data) || data?.error || data?.title || data?.message || "No se pudo enviar el email"
      );
    } finally {
      setBusyId(null);
    }
  }

  const cantidades = useMemo(() => {
    const c = { todos: recibos.length, Abono: 0, Estadia: 0, Sena: 0 };
    for (const r of recibos) c[origenDe(r)] = (c[origenDe(r)] || 0) + 1;
    return c;
  }, [recibos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return recibos.filter((r) => {
      if (filtro !== "todos" && origenDe(r) !== filtro) return false;
      if (!q) return true;
      return (
        (r.numeroFormateado || "").toLowerCase().includes(q) ||
        String(r.numero || "").includes(q) ||
        (r.clienteNombre || "").toLowerCase().includes(q) ||
        (r.cocherasLabel || "").toLowerCase().includes(q) ||
        (r.patentesLabel || "").toLowerCase().includes(q) ||
        (r.periodosLabel || "").toLowerCase().includes(q)
      );
    });
  }, [recibos, filtro, busqueda]);

  const paginaClave = `${filtro}|${busqueda}|${desde}|${hasta}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const hayFiltros = filtro !== "todos" || busqueda.trim() !== "" || desde || hasta;

  const stats = useMemo(() => {
    const vigentes = visibles.filter((r) => !r.anulado).length;
    const total = visibles.filter((r) => !r.anulado).reduce((acc, r) => acc + Number(r.total ?? 0), 0);
    return { vigentes, total };
  }, [visibles]);

  const icono = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted disabled:opacity-40";

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Recibos"
        description="Comprobantes de abonos, estadías y señas. Reimprimí o anulá sin borrar el pago."
        loading={loading}
        stats={[
          { label: "Vigentes", value: stats.vigentes, onClick: () => setFiltro("todos") },
          { label: "Abonos", value: cantidades.Abono, onClick: () => setFiltro("Abono") },
          { label: "Estadías", value: cantidades.Estadia, onClick: () => setFiltro("Estadia") },
          { label: "Importe", value: plata(stats.total) },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="N°, cliente, cochera o patente"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Origen del recibo"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS.map((f) => ({ value: f.value, label: f.label, cantidad: cantidades[f.value] }))}
        />
        <DatePicker
          selected={desde}
          onChange={setDesde}
          dateFormat="dd/MM/yyyy"
          locale={es}
          placeholderText="Desde"
          isClearable
          className={`${fieldClass} w-36`}
        />
        <DatePicker
          selected={hasta}
          onChange={setHasta}
          dateFormat="dd/MM/yyyy"
          locale={es}
          placeholderText="Hasta"
          isClearable
          className={`${fieldClass} w-36`}
        />
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("todos");
              setBusqueda("");
              setDesde(null);
              setHasta(null);
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}
      {okMsg && <p className="px-4 py-3 bg-success-muted text-success-ink text-sm">{okMsg}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando recibos…</span>
        </div>
      ) : recibos.length === 0 ? (
        <Vacio texto="Todavía no hay recibos. Se generan al registrar un pago." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún recibo coincide con este filtro." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">N°</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cliente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Origen</th>
                  <th className="pk-label font-bold px-3 py-2.5">Patente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Período</th>
                  <th className="pk-label font-bold px-3 py-2.5">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((r) => {
                  const origen = origenDe(r);
                  const busy = busyId === r.reciboId;
                  return (
                    <tr key={r.reciboId} className={`border-b border-line ${r.anulado ? "opacity-55" : "hover:bg-surface-page"}`}>
                      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${r.anulado ? "border-l-transparent" : origen === "Estadia" ? "border-l-brand" : "border-l-transparent"}`}>
                        <p className="font-semibold text-ink tabular-nums">{r.numeroFormateado || r.numero}</p>
                        <p className="pk-caption">{fechaCorta(r.fechaEmision)}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink truncate">{r.clienteNombre}</p>
                        <p className="pk-caption truncate">{r.cocherasLabel || r.metodoPagoLabel || "\u00a0"}</p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink">{labelOrigen(origen)}</p>
                        <p className={`pk-caption font-semibold ${r.anulado ? "text-danger-ink" : "text-success-ink"}`}>
                          {r.anulado ? "Anulado" : "Vigente"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <Chips label={r.patentesLabel} patente />
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink capitalize truncate" title={r.periodosLabel}>
                          {r.periodosLabel || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink tabular-nums">{plata(r.total)}</p>
                      </td>
                      <td className="pl-2 pr-3 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" disabled={busy} title="Imprimir" onClick={() => handleImprimir(r)} className={icono}>
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                          </button>
                          {!r.anulado && (
                            <button type="button" disabled={busy} title="Enviar por email" onClick={() => handleEnviarEmail(r)} className={icono}>
                              <Mail size={14} />
                            </button>
                          )}
                          {!r.anulado && (
                            <button type="button" disabled={busy} title="Anular" onClick={() => handleAnular(r)} className={`${icono} hover:text-danger-ink`}>
                              <Ban size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((r) => {
              const origen = origenDe(r);
              return (
                <li key={r.reciboId} className={`px-4 py-3 border-l-[3px] ${r.anulado ? "border-l-transparent opacity-55" : origen === "Estadia" ? "border-l-brand" : "border-l-transparent"}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink">{r.numeroFormateado || r.numero}</span>
                    <span className="text-sm font-semibold tabular-nums">{plata(r.total)}</span>
                  </div>
                  <p className="pk-caption mt-0.5">
                    {labelOrigen(origen)} · {r.clienteNombre} · {fechaCorta(r.fechaEmision)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Chips label={r.patentesLabel} patente />
                    {r.anulado ? <span className="pk-caption text-danger-ink font-semibold">Anulado</span> : null}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => handleImprimir(r)} className="pk-caption font-semibold">
                      Imprimir
                    </button>
                    {!r.anulado && (
                      <button type="button" onClick={() => handleEnviarEmail(r)} className="pk-caption font-semibold">
                        Email
                      </button>
                    )}
                    {!r.anulado && (
                      <button type="button" onClick={() => handleAnular(r)} className="pk-caption font-semibold text-danger-ink">
                        Anular
                      </button>
                    )}
                  </div>
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
