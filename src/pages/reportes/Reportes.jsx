import { useMemo, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Loader2,
  CalendarRange,
  Sparkles,
} from "lucide-react";
import { reportesService } from "../../services/reportesService";

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

export default function Reportes() {
  const [desde, setDesde] = useState(firstOfMonthYmd);
  const [hasta, setHasta] = useState(todayYmd);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [error, setError] = useState(null);
  const [okMsg, setOkMsg] = useState(null);

  const rangoInvalido = useMemo(() => {
    if (!desde || !hasta) return false;
    return desde > hasta;
  }, [desde, hasta]);

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

  return (
    <div className="space-y-5 animate-fade-in-up max-w-5xl">
      <div>
        <h1 className="pk-title">Reportes</h1>
        <p className="pk-desc mt-1">
          Descargá resúmenes operativos y listados de cobros del estacionamiento.
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
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col">
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
          <button
            type="button"
            onClick={handlePdf}
            disabled={loadingPdf}
            className="mt-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg shadow-slate-900/15 transition-all"
          >
            {loadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loadingPdf ? "Generando…" : "Descargar PDF"}
          </button>
        </section>

        {/* Excel pagos */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_0_rgba(15,23,42,0.04)] p-6 sm:p-7 flex flex-col">
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

          <button
            type="button"
            onClick={handleExcel}
            disabled={loadingExcel || rangoInvalido}
            className="mt-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            {loadingExcel ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {loadingExcel ? "Generando…" : "Descargar Excel"}
          </button>
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
    </div>
  );
}
