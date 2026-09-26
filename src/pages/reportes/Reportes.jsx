import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  CalendarRange,
  Sparkles,
  Mail,
  X,
  Building2,
  User,
} from "lucide-react";
import { reportesService } from "../../services/reportesService";
import { estacionamientoService } from "../../services/estacionamientoService";
import { usuarioService } from "../../services/usuarioService";

/** @typedef {import("../../types").UsuarioResumen} UsuarioResumen */

function todayYmd() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function firstOfMonthYmd() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${d.getFullYear()}-${m}-01`;
}

function msgFromError(e, fallback) {
  const data = e?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  return e?.message || fallback;
}

export default function Reportes() {
  const [desde, setDesde] = useState(firstOfMonthYmd);
  const [hasta, setHasta] = useState(todayYmd);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const [emailAvisos, setEmailAvisos] = useState("");
  const [usuarios, setUsuarios] = useState(/** @type {UsuarioResumen[]} */ ([]));
  const [mailModal, setMailModal] = useState(null); // "dashboard" | "pagos" | null
  const [destino, setDestino] = useState("estacionamiento");
  const [usuarioId, setUsuarioId] = useState("");
  const [enviandoMail, setEnviandoMail] = useState(false);

  const rangoInvalido = useMemo(() => {
    if (!desde || !hasta) return false;
    return desde > hasta;
  }, [desde, hasta]);

  useEffect(() => {
    Promise.all([
      estacionamientoService.get().catch(() => null),
      usuarioService.listarDelEstacionamiento().catch(() => []),
    ]).then(([est, usus]) => {
      setEmailAvisos(est?.emailAvisos?.trim() || "");
      setUsuarios(Array.isArray(usus) ? usus : []);
    });
  }, []);

  const usuariosConMail = useMemo(
    () => usuarios.filter((u) => (u.mail || "").trim()),
    [usuarios]
  );

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
      const payload = {
        destino,
        usuarioId: destino === "usuario" ? Number(usuarioId) : null,
      };
      const res =
        mailModal === "pagos"
          ? await reportesService.enviarPagosEmail({ ...payload, desde, hasta })
          : await reportesService.enviarDashboardEmail(payload);

      if (res?.simulado) {
        setOkMsg(
          `Simulado → ${res.destinatario} (SMTP deshabilitado). Cuando actives Email:Enabled se enviará de verdad.`
        );
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
      await reportesService.downloadDashboardPdf();
      setOkMsg("PDF del dashboard descargado.");
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
      await reportesService.downloadPagosExcel(desde, hasta);
      setOkMsg("Excel de pagos descargado.");
    } catch (e) {
      setError(e.message || "No se pudo generar el Excel");
    } finally {
      setLoadingExcel(false);
    }
  }

  const tituloMail =
    mailModal === "pagos" ? "Enviar Excel de pagos" : "Enviar PDF del dashboard";

  return (
    <div className="space-y-5 animate-fade-in-up max-w-5xl">
      <div>
        <h1 className="pk-title">Reportes</h1>
        <p className="pk-desc mt-1">
          Descargá o enviá por mail resúmenes operativos y listados de cobros.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-100">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="px-4 py-3 bg-emerald-50 text-emerald-700 text-sm rounded-xl border border-emerald-100">
          {okMsg}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* PDF dashboard */}
        <section className="relative overflow-hidden rounded-3xl border border-transparent bg-white  p-6 sm:p-7 flex flex-col">
          <div className="absolute inset-x-0 top-0 h-1 bg-slate-900" />
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <p className="pk-label mb-1">PDF</p>
              <h2 className="pk-heading">Resumen del dashboard</h2>
              <p className="pk-desc mt-1">
                Misma información que Mi estacionamiento: KPIs, deudores, vehículos,
                ingresos y mapa de cocheras.
              </p>
            </div>
          </div>
          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePdf}
              disabled={loadingPdf}
              className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg shadow-slate-900/15 transition-all"
            >
              {loadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {loadingPdf ? "Generando…" : "Descargar"}
            </button>
            <button
              type="button"
              onClick={() => abrirMail("dashboard")}
              className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-3 rounded-xl transition-all"
            >
              <Mail size={16} />
              Enviar por mail
            </button>
          </div>
        </section>

        {/* Excel pagos */}
        <section className="relative overflow-hidden rounded-3xl border border-transparent bg-white  p-6 sm:p-7 flex flex-col">
          <div className="absolute inset-x-0 top-0 h-1 bg-indigo-600" />
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div className="min-w-0">
              <p className="pk-label mb-1">Excel</p>
              <h2 className="pk-heading">Pagos por fecha de cobro</h2>
              <p className="pk-desc mt-1">
                Listado de cobros registrados en el rango, con cliente, plazas, montos y
                método.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="pk-label mb-1.5 block">Desde</label>
              <div className="relative">
                <CalendarRange
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 focus:bg-white"
                />
              </div>
            </div>
            <div>
              <label className="pk-label mb-1.5 block">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 focus:bg-white"
              />
            </div>
          </div>

          {rangoInvalido && (
            <p className="text-[11px] text-rose-600 font-medium mb-3">
              Revisá el rango: hasta debe ser ≥ desde.
            </p>
          )}

          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExcel}
              disabled={loadingExcel || rangoInvalido}
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
            >
              {loadingExcel ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {loadingExcel ? "Generando…" : "Descargar"}
            </button>
            <button
              type="button"
              onClick={() => abrirMail("pagos")}
              disabled={rangoInvalido}
              className="inline-flex items-center justify-center gap-2 border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-sm font-semibold px-4 py-3 rounded-xl transition-all disabled:opacity-50"
            >
              <Mail size={16} />
              Enviar por mail
            </button>
          </div>
        </section>

        {/* Slot próximo */}
        <section className="md:col-span-2 relative overflow-hidden rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-7 opacity-80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-300 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="pk-label mb-1">Próximamente</p>
              <h2 className="text-base font-bold text-slate-500 tracking-tight">
                Más reportes
              </h2>
              <p className="pk-desc mt-1">
                Acá vamos a sumar un tercer tipo cuando lo definamos (caja, ocupación,
                etc.).
              </p>
            </div>
          </div>
        </section>
      </div>

      {mailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="pk-label mb-0.5">Email</p>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">{tituloMail}</h3>
              </div>
              <button
                type="button"
                onClick={() => setMailModal(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-500">
                Elegí a quién enviamos el archivo adjunto.
              </p>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  destino === "estacionamiento"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:bg-slate-50/60"
                }`}
              >
                <input
                  type="radio"
                  name="destino-reporte"
                  className="mt-1"
                  checked={destino === "estacionamiento"}
                  onChange={() => setDestino("estacionamiento")}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <Building2 size={15} />
                    Email del estacionamiento
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {emailAvisos || "Sin email de avisos configurado"}
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  destino === "usuario"
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:bg-slate-50/60"
                }`}
              >
                <input
                  type="radio"
                  name="destino-reporte"
                  className="mt-1"
                  checked={destino === "usuario"}
                  onChange={() => setDestino("usuario")}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <User size={15} />
                    Un usuario
                  </div>
                  {destino === "usuario" && (
                    <select
                      value={usuarioId}
                      onChange={(e) => setUsuarioId(e.target.value)}
                      className="mt-2 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400"
                    >
                      <option value="">Seleccioná…</option>
                      {usuariosConMail.map((u) => (
                        <option key={u.usuarioId} value={u.usuarioId}>
                          {(u.nombre || u.usuarioName || "Usuario") + ` · ${u.mail}`}
                        </option>
                      ))}
                    </select>
                  )}
                  {destino === "usuario" && usuariosConMail.length === 0 && (
                    <p className="text-xs text-rose-600 mt-2">
                      No hay usuarios con email en este estacionamiento.
                    </p>
                  )}
                </div>
              </label>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setMailModal(null)}
                className="flex-1 text-sm text-slate-600 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviandoMail}
                onClick={confirmarMail}
                className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl py-2.5"
              >
                {enviandoMail ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Mail size={16} />
                )}
                {enviandoMail ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
