import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, Mail, X } from "lucide-react";
import PageHeader from "../../components/layout/PageHeader";
import FilterSelect, { fieldClass } from "../../components/layout/FilterSelect";
import FiltroSegmentado from "../../components/layout/FiltroSegmentado";
import { reportesService } from "../../services/reportesService";
import { dashboardService } from "../../services/dashboardService";
import { estacionamientoService } from "../../services/estacionamientoService";
import { usuarioService } from "../../services/usuarioService";
import { plata } from "../../utils/clienteHelpers";

/** @typedef {import("../../types").UsuarioResumen} UsuarioResumen */
/** @typedef {import("../../types").Dashboard} Dashboard */

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function firstOfMonthYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function msgFromError(e, fallback) {
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return e?.message || fallback;
}

const ORIGENES = [
  { value: "ambos", label: "Ambos" },
  { value: "abonos", label: "Abonos" },
  { value: "estadias", label: "Estadías" },
];

export default function Reportes() {
  const [desde, setDesde] = useState(firstOfMonthYmd);
  const [hasta, setHasta] = useState(todayYmd);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);
  const [emailAvisos, setEmailAvisos] = useState("");
  const [usuarios, setUsuarios] = useState(/** @type {UsuarioResumen[]} */ ([]));
  const [mailModal, setMailModal] = useState(null);
  const [destino, setDestino] = useState("estacionamiento");
  const [usuarioId, setUsuarioId] = useState("");
  const [enviandoMail, setEnviandoMail] = useState(false);
  const [resumen, setResumen] = useState(/** @type {Dashboard | null} */ (null));
  const [origen, setOrigen] = useState("ambos");

  const rangoInvalido = useMemo(() => Boolean(desde && hasta && desde > hasta), [desde, hasta]);

  useEffect(() => {
    Promise.all([
      estacionamientoService.get().catch(() => null),
      usuarioService.listarDelEstacionamiento().catch(() => []),
      dashboardService.getSummary().catch(() => null),
    ]).then(([est, usus, dash]) => {
      setEmailAvisos(est?.emailAvisos?.trim() || "");
      setUsuarios(Array.isArray(usus) ? usus : []);
      setResumen(dash);
    });
  }, []);

  const usuariosConMail = useMemo(() => usuarios.filter((u) => (u.mail || "").trim()), [usuarios]);
  const ingresos = resumen?.detalleIngresos;

  function abrirMail(tipo) {
    setError(null);
    setOkMsg(null);
    setDestino(emailAvisos ? "estacionamiento" : "usuario");
    setUsuarioId(usuariosConMail[0]?.usuarioId ? String(usuariosConMail[0].usuarioId) : "");
    setMailModal(tipo);
  }

  async function confirmarMail() {
    if (destino === "estacionamiento" && !emailAvisos) {
      setError("Configurá el email de avisos del estacionamiento en Configuración → General.");
      return;
    }
    if (destino === "usuario" && !usuarioId) {
      setError("Seleccioná un usuario con email.");
      return;
    }
    if (mailModal === "pagos" && rangoInvalido) {
      setError("La fecha hasta no puede ser anterior a desde.");
      return;
    }

    try {
      setEnviandoMail(true);
      setError(null);
      setOkMsg(null);
      const payload = { destino, usuarioId: destino === "usuario" ? Number(usuarioId) : null, origen };
      const res =
        mailModal === "pagos"
          ? await reportesService.enviarPagosEmail({ ...payload, desde, hasta })
          : await reportesService.enviarDashboardEmail(payload);

      if (res?.simulado) {
        setOkMsg(`Simulado → ${res.destinatario}. Cuando actives el SMTP se envía de verdad.`);
      } else {
        setOkMsg(`Reporte enviado a ${res?.destinatario || "el destinatario"}.`);
      }
      setMailModal(null);
    } catch (e) {
      setError(msgFromError(e, "No se pudo enviar el reporte"));
    } finally {
      setEnviandoMail(false);
    }
  }

  async function handlePdf() {
    try {
      setError(null);
      setOkMsg(null);
      setLoadingPdf(true);
      await reportesService.downloadDashboardPdf(origen);
      setOkMsg("PDF del resumen descargado.");
    } catch (e) {
      setError(e.message || "No se pudo generar el PDF");
    } finally {
      setLoadingPdf(false);
    }
  }

  async function handleExcel() {
    if (rangoInvalido) {
      setError("La fecha hasta no puede ser anterior a desde.");
      return;
    }
    try {
      setError(null);
      setOkMsg(null);
      setLoadingExcel(true);
      await reportesService.downloadPagosExcel(desde, hasta, origen);
      setOkMsg(
        origen === "abonos"
          ? "Excel de abonos descargado."
          : origen === "estadias"
            ? "Excel de estadías descargado."
            : "Excel de pagos descargado (abonos y estadías)."
      );
    } catch (e) {
      setError(e.message || "No se pudo generar el Excel");
    } finally {
      setLoadingExcel(false);
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Reportes"
        description="Resumen operativo para bajar o mandar por mail. Elegí abonos, estadías o ambos."
        stats={
          resumen
            ? [
                { label: "Ocupación", value: `${resumen.porcentajeOcupacion ?? 0}%` },
                { label: "Rotativo adentro", value: resumen.rotativosAdentro ?? 0 },
                { label: "Recaudado mes", value: plata(ingresos?.totalRecaudadoMensualReal) },
                {
                  label: "Deudores",
                  value: resumen.alertasDeudores?.length ?? 0,
                  tone: (resumen.alertasDeudores?.length ?? 0) > 0 ? "danger" : "default",
                },
              ]
            : null
        }
      />

      <FiltroSegmentado ariaLabel="Origen" value={origen} onChange={setOrigen} opciones={ORIGENES} />

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}
      {okMsg && <p className="px-4 py-3 bg-success-muted text-success-ink text-sm">{okMsg}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <section className="bg-surface-card flex flex-col">
          <div className="px-4 pt-3 pb-2 border-b border-line flex items-baseline justify-between gap-3">
            <h2 className="pk-label text-ink-muted">PDF · Resumen</h2>
            <FileText size={14} className="text-ink-faint" />
          </div>
          <div className="px-4 py-4 flex-1">
            <p className="text-sm text-ink-muted">
              {origen === "abonos"
                ? "Ocupación, deudores, vehículos y mapa de cocheras."
                : origen === "estadias"
                  ? "Rotativo adentro, entradas del día e ingresos de estadía."
                  : "Ocupación, rotativo adentro, deudores, ingresos y mapa de cocheras."}
            </p>
          </div>
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePdf}
              disabled={loadingPdf}
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-50 text-brand-foreground text-xs font-semibold px-4 py-2.5"
            >
              {loadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {loadingPdf ? "Generando…" : "Descargar"}
            </button>
            <button
              type="button"
              onClick={() => abrirMail("dashboard")}
              className="inline-flex items-center justify-center gap-2 border border-line-strong text-ink text-xs font-semibold px-4 py-2.5 hover:bg-surface-muted"
            >
              <Mail size={14} />
              Enviar por mail
            </button>
          </div>
        </section>

        <section className="bg-surface-card flex flex-col">
          <div className="px-4 pt-3 pb-2 border-b border-line flex items-baseline justify-between gap-3">
            <h2 className="pk-label text-ink-muted">Excel · Pagos</h2>
            <FileSpreadsheet size={14} className="text-ink-faint" />
          </div>
          <div className="px-4 py-4 space-y-3 flex-1">
            <p className="text-sm text-ink-muted">
              {origen === "abonos"
                ? "Hoja de pagos de abono, por fecha de cobro."
                : origen === "estadias"
                  ? "Hoja de pagos de estadía, por fecha de cobro."
                  : "Dos hojas: abonos y estadías, por fecha de cobro."}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="pk-caption font-semibold">
                Desde
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className={`${fieldClass} mt-1`} />
              </label>
              <label className="pk-caption font-semibold">
                Hasta
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className={`${fieldClass} mt-1`} />
              </label>
            </div>
            {rangoInvalido && <p className="text-xs text-danger-ink">Hasta tiene que ser ≥ desde.</p>}
          </div>
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExcel}
              disabled={loadingExcel || rangoInvalido}
              className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-strong disabled:opacity-50 text-brand-foreground text-xs font-semibold px-4 py-2.5"
            >
              {loadingExcel ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {loadingExcel ? "Generando…" : "Descargar"}
            </button>
            <button
              type="button"
              onClick={() => abrirMail("pagos")}
              disabled={rangoInvalido}
              className="inline-flex items-center justify-center gap-2 border border-line-strong text-ink text-xs font-semibold px-4 py-2.5 hover:bg-surface-muted disabled:opacity-50"
            >
              <Mail size={14} />
              Enviar por mail
            </button>
          </div>
        </section>
      </div>

      {mailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
          <div role="dialog" aria-modal="true" className="w-full max-w-md bg-surface-card border border-line">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <h3 className="text-sm font-bold text-ink">
                {mailModal === "pagos" ? "Enviar Excel de pagos" : "Enviar PDF del resumen"}
              </h3>
              <button type="button" onClick={() => setMailModal(null)} className="p-1 text-ink-faint hover:text-ink" aria-label="Cerrar">
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-3">
              <p className="text-sm text-ink-muted">¿A quién se lo mandamos?</p>

              <label className={`flex items-start gap-3 p-3 border cursor-pointer ${destino === "estacionamiento" ? "border-ink bg-surface-muted" : "border-line"}`}>
                <input type="radio" name="destino-reporte" className="mt-1" checked={destino === "estacionamiento"} onChange={() => setDestino("estacionamiento")} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">Email del estacionamiento</p>
                  <p className="pk-caption mt-0.5 truncate">{emailAvisos || "Sin email de avisos configurado"}</p>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-3 border cursor-pointer ${destino === "usuario" ? "border-ink bg-surface-muted" : "border-line"}`}>
                <input type="radio" name="destino-reporte" className="mt-1" checked={destino === "usuario"} onChange={() => setDestino("usuario")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Un usuario</p>
                  {destino === "usuario" && (
                    <FilterSelect
                      className="mt-2 w-full"
                      ariaLabel="Usuario"
                      value={usuarioId}
                      onChange={setUsuarioId}
                      options={[
                        { value: "", label: "Seleccioná…" },
                        ...usuariosConMail.map((u) => ({
                          value: u.usuarioId,
                          label: `${u.nombre || u.usuarioName || "Usuario"} · ${u.mail}`,
                        })),
                      ]}
                    />
                  )}
                  {destino === "usuario" && usuariosConMail.length === 0 && (
                    <p className="text-xs text-danger-ink mt-2">No hay usuarios con email en este estacionamiento.</p>
                  )}
                </div>
              </label>
            </div>

            <div className="px-4 py-3 border-t border-line flex gap-2">
              <button type="button" onClick={() => setMailModal(null)} className="flex-1 text-sm font-semibold text-ink-muted border border-line-strong py-2.5 hover:bg-surface-muted">
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviandoMail}
                onClick={confirmarMail}
                className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-brand-foreground bg-brand hover:bg-brand-strong disabled:opacity-50 py-2.5"
              >
                {enviandoMail ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                {enviandoMail ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
