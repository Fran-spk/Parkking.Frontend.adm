import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tags, Banknote, Layers, Check, Loader2, AlertCircle } from "lucide-react";
import SelectorGrupos from "../components/layout/SelectorGrupos";
import { tipoGastoService } from "../services/tipoGastoService";
import { operacionFinancieraService } from "../services/operacionFinancieraService";

/** @typedef {import("../types").TipoGasto} TipoGasto */

const SECTIONS = [
  { id: "tipo", label: "Tipo", icon: Tags },
  { id: "importe", label: "Importe", icon: Banknote },
  { id: "grupos", label: "Grupos", icon: Layers },
];

const inputCls =
  "w-full text-sm border border-slate-200 rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all placeholder:text-slate-300";

function SectionHeader({ index, title, done }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black ${
          done ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "bg-slate-900 text-white shadow-lg shadow-slate-900/15"
        }`}
      >
        {done ? <Check size={18} strokeWidth={3} /> : index}
      </div>
      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
    </div>
  );
}

function pesos(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

function errorDe(e, fallback) {
  const msg = e.response?.data;
  return typeof msg === "string" ? msg : fallback;
}

export default function NuevoGasto() {
  const navigate = useNavigate();
  const [tipos, setTipos] = useState(/** @type {TipoGasto[]} */ ([]));
  const [tipoGastoId, setTipoGastoId] = useState("");
  const [importe, setImporte] = useState("");
  const [concepto, setConcepto] = useState("");
  const [grupos, setGrupos] = useState(/** @type {number[]} */ ([]));
  const [activeSection, setActiveSection] = useState("tipo");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    tipoGastoService.getAll(false).then((data) => setTipos(Array.isArray(data) ? data : [])).catch(() => setTipos([]));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id.replace("sec-", ""));
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const tipo = tipos.find((t) => String(t.tipoGastoId) === String(tipoGastoId));
  const monto = Number(importe);
  const checklist = {
    tipo: Boolean(tipoGastoId),
    importe: monto > 0 && concepto.trim().length > 0,
    grupos: true,
  };
  const puedeGuardar = checklist.tipo && checklist.importe && !guardando;
  const activeIdx = Math.max(0, SECTIONS.findIndex((s) => s.id === activeSection));

  function scrollTo(id) {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleGuardar() {
    if (!puedeGuardar) {
      setError(!tipoGastoId ? "Elegí un tipo de gasto" : "Completá importe y concepto");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      setAviso(null);
      await operacionFinancieraService.crearGasto({
        tipoGastoId,
        importe: monto,
        concepto: concepto.trim(),
        grupoFinancieroIds: grupos,
      });
      setAviso("Gasto registrado. Resta en la cuenta del estacionamiento.");
      setImporte("");
      setConcepto("");
      setGrupos([]);
    } catch (e) {
      setError(errorDe(e, "No se pudo registrar el gasto"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] -mx-1">
      <div className="sticky top-16 z-30 -mx-4 px-4 lg:-mx-8 lg:px-8 py-3 mb-8 bg-gray-50/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => navigate("/cuenta-corriente")} className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white">
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">Nuevo gasto</h1>
                <p className="text-xs text-slate-400 mt-0.5">Paso {activeIdx + 1} de {SECTIONS.length}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={!puedeGuardar}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/20"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {guardando ? "Guardando..." : "Registrar gasto"}
            </button>
          </div>
          <nav className="flex items-stretch gap-2 overflow-x-auto">
            {SECTIONS.map((s, i) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              const done = checklist[s.id] && s.id !== "grupos";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`flex-1 min-w-[7.5rem] flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border text-left ${
                    active ? "bg-white border-slate-200 shadow-sm" : done ? "bg-emerald-50/80 border-emerald-100" : "bg-white/60 border-transparent"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${done ? "bg-emerald-500 text-white" : active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {done ? <Check size={14} /> : <Icon size={14} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Paso {i + 1}</p>
                    <p className="text-sm font-semibold truncate text-slate-900">{s.label}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}
      {aviso && (
        <div className="max-w-6xl mx-auto mb-5 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
          {aviso}
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8 pb-16">
        <div className="space-y-6">
          <section id="sec-tipo" className="scroll-mt-48 bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
            <SectionHeader index={1} title="Tipo de gasto" done={checklist.tipo} />
            <div className="max-w-xl">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Catálogo</label>
              <select value={tipoGastoId} onChange={(e) => setTipoGastoId(e.target.value)} className={inputCls}>
                <option value="">Elegir tipo</option>
                {tipos.map((t) => (
                  <option key={t.tipoGastoId} value={t.tipoGastoId}>{t.nombre}</option>
                ))}
              </select>
              {tipos.length === 0 && (
                <p className="text-xs text-slate-400 mt-2">No hay tipos activos. Cargalos en Configuración.</p>
              )}
            </div>
          </section>

          <section id="sec-importe" className="scroll-mt-48 bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
            <SectionHeader index={2} title="Importe" done={checklist.importe} />
            <div className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Importe</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input type="number" min="0" step="1" value={importe} onChange={(e) => setImporte(e.target.value)} className={`${inputCls} pl-8`} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Concepto</label>
                <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Qué se pagó" className={inputCls} />
              </div>
            </div>
          </section>

          <section id="sec-grupos" className="scroll-mt-48 bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
            <SectionHeader index={3} title="Grupos" done={grupos.length > 0} />
            <p className="text-sm text-slate-500 mb-4 max-w-xl">Se suman a la regla del tipo de gasto. El importe resta en la cuenta del estacionamiento.</p>
            <SelectorGrupos value={grupos} onChange={setGrupos} />
          </section>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-44 rounded-3xl bg-white overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
              <p className="text-base font-bold mt-1">Gasto</p>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Tipo</p>
                <p className="font-semibold text-slate-900">{tipo?.nombre || "Sin seleccionar"}</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Concepto</p>
                <p className="font-semibold text-slate-900">{concepto.trim() || "—"}</p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">En tu cuenta</p>
                <p className="text-2xl font-black tracking-tight text-rose-600">
                  {monto > 0 ? pesos(-monto) : "—"}
                </p>
              </div>
              <button type="button" onClick={handleGuardar} disabled={!puedeGuardar} className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl shadow-lg shadow-indigo-600/25">
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirmar gasto
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
