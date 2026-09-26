import { useEffect, useMemo, useState } from "react";
import { Printer, Ban, AlertCircle, Receipt, Loader2, Mail, History } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { reciboService } from "../services/reciboService";
import { estacionamientoService } from "../services/estacionamientoService";
import { imprimirReciboPdf } from "../utils/imprimirRecibo";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";

/** @typedef {import("../types").Recibo} Recibo */
/** @typedef {import("../types").Estacionamiento} Estacionamiento */
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

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(precio) || 0);
}

function toYmd(date) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Recibos() {
  const [recibos, setRecibos] = useState(/** @type {Recibo[]} */ ([]));
  const [busqueda, setBusqueda] = useState("");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [okMsg, setOkMsg] = useState(null);
  const [metaEst, setMetaEst] = useState({ nombre: "Parkking", direccion: "" });

  useEffect(() => {
    estacionamientoService
      .get()
      .then((d) =>
        setMetaEst({
          nombre: d?.nombre || "Parkking",
          direccion: d?.direccion || "",
        })
      )
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
        q: busqueda.trim() || undefined,
      });
      setRecibos(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar los recibos");
    } finally {
      setLoading(false);
    }
  }

  async function handleBuscar(e) {
    e?.preventDefault();
    await cargar();
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
    const motivo = window.prompt(
      `Anular recibo ${recibo.numeroFormateado || recibo.numero}?\nMotivo (opcional):`,
      ""
    );
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
    const sugerido = "";
    const email = window.prompt(
      `Enviar recibo ${recibo.numeroFormateado || recibo.numero} por email.\n\nDejá vacío para usar el email del abono/cliente, o escribí uno:`,
      sugerido
    );
    if (email === null) return;
    try {
      setBusyId(recibo.reciboId);
      setError(null);
      setOkMsg(null);
      const res = await reciboService.enviarEmail(
        recibo.reciboId,
        email.trim() || undefined
      );
      if (res?.simulado) {
        setOkMsg(
          `Simulado → ${res.destinatario} (SMTP deshabilitado en el servidor). Cuando actives Email:Enabled se enviará de verdad.`
        );
      } else {
        setOkMsg(`Recibo enviado a ${res?.destinatario || "el destinatario"}.`);
      }
    } catch (e) {
      const data = e.response?.data;
      const msg =
        (typeof data === "string" && data) ||
        data?.error ||
        data?.title ||
        data?.message ||
        "No se pudo enviar el email";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  }

  const filtrados = recibos.filter((r) => {
    const q = busqueda.trim().toLowerCase();
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

  const stats = useMemo(() => {
    const vigentes = filtrados.filter((r) => !r.anulado).length;
    const anulados = filtrados.filter((r) => r.anulado).length;
    const total = filtrados
      .filter((r) => !r.anulado)
      .reduce((acc, r) => acc + Number(r.total ?? 0), 0);
    return { vigentes, anulados, total };
  }, [filtrados]);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Recibos"
        description="Comprobantes de cobro. Reimprimí o anulá sin borrar el pago."
        loading={loading}
        stats={[
          { label: "Vigentes", value: stats.vigentes },
          { label: "Anulados", value: stats.anulados, tone: "warning" },
          { label: "Importe", value: formatPrecio(stats.total) },
        ]}
      />

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-danger-muted text-danger-ink text-sm">
          <AlertCircle size={15} className="shrink-0" /> {error}
        </div>
      )}
      {okMsg && (
        <div className="px-4 py-3 bg-success-muted text-success-ink text-sm">{okMsg}</div>
      )}

      <form
        onSubmit={handleBuscar}
        className="flex flex-col lg:flex-row gap-3 bg-surface-card p-4"
      >
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="N°, cliente, cochera, patente..."
          className="flex-1"
        />
        <DatePicker
          selected={desde}
          onChange={setDesde}
          dateFormat="dd/MM/yyyy"
          locale={es}
          placeholderText="Desde"
          isClearable
          className="w-full lg:w-36 text-sm border border-line-strong px-3 py-2.5"
        />
        <DatePicker
          selected={hasta}
          onChange={setHasta}
          dateFormat="dd/MM/yyyy"
          locale={es}
          placeholderText="Hasta"
          isClearable
          className="w-full lg:w-36 text-sm border border-line-strong px-3 py-2.5"
        />
        <PageHeaderAction type="submit">Buscar</PageHeaderAction>
      </form>

      <div className="bg-surface-card overflow-hidden">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-ink-faint p-8">
            <Loader2 size={16} className="animate-spin" /> Cargando recibos...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt className="w-10 h-10 text-ink-faint mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink">Sin recibos</p>
            <p className="text-xs text-ink-faint mt-1">Se generan al registrar un pago.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-line">
                  <th className="px-4 py-3 pk-label">N°</th>
                  <th className="px-4 py-3 pk-label">Fecha</th>
                  <th className="px-4 py-3 pk-label">Cliente</th>
                  <th className="px-4 py-3 pk-label">Cochera / Patente</th>
                  <th className="px-4 py-3 font-bold">Período</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((r) => {
                  const busy = busyId === r.reciboId;
                  return (
                    <tr
                      key={r.reciboId}
                      className={`border-b border-gray-50 last:border-0 ${
                        r.anulado ? "bg-gray-50/80 opacity-75" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-gray-800">
                        {r.numeroFormateado || r.numero}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatFecha(r.fechaEmision)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{r.clienteNombre}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{r.cocherasLabel || "—"}</div>
                        {r.patentesLabel && (
                          <div className="text-xs font-mono text-gray-400">{r.patentesLabel}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate" title={r.periodosLabel}>
                        {r.periodosLabel || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatPrecio(r.total)}
                      </td>
                      <td className="px-4 py-3">
                        {r.anulado ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                            Anulado
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Vigente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={busy}
                            title="Imprimir / PDF"
                            onClick={() => handleImprimir(r)}
                            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                          >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                          </button>
                          {!r.anulado && (
                            <button
                              type="button"
                              disabled={busy}
                              title="Enviar por email"
                              onClick={() => handleEnviarEmail(r)}
                              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-40"
                            >
                              <Mail size={14} />
                            </button>
                          )}
                          {!r.anulado && (
                            <button
                              type="button"
                              disabled={busy}
                              title="Anular"
                              onClick={() => handleAnular(r)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                            >
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
        )}
      </div>
    </div>
  );
}
