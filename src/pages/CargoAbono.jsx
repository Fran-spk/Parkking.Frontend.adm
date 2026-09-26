import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, AlertCircle } from "lucide-react";
import { abonoService } from "../services/abonoService";
import { operacionFinancieraService } from "../services/operacionFinancieraService";
import { abonoIdOf, labelCocheras } from "../utils/abonoHelpers";

/** @typedef {import("../types").Abono} Abono */

const inputCls =
  "w-full text-sm border border-slate-200 rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all placeholder:text-slate-300";

function SectionHeader({ index, title, done }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-black ${done ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25" : "bg-slate-900 text-white shadow-lg shadow-slate-900/15"}`}>
        {done ? <Check size={18} strokeWidth={3} /> : index}
      </div>
      <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
    </div>
  );
}

function pesos(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function CargoAbono() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abono, setAbono] = useState(/** @type {Abono | null} */ (null));
  const [concepto, setConcepto] = useState("");
  const [importe, setImporte] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    abonoService.getById(id).then(setAbono).catch(() => setError("No se pudo cargar el abono"));
  }, [id]);

  const monto = Number(importe);
  const puede = Boolean(abono) && concepto.trim() && monto > 0 && !guardando;

  async function handleGuardar() {
    const clienteId = abono?.clienteId ?? abono?.cliente?.clienteId;
    if (!abono || !clienteId || !puede) {
      setError("Completá concepto e importe");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await operacionFinancieraService.crearCargo({
        clienteId,
        abonoId: abonoIdOf(abono),
        importe: monto,
        concepto: concepto.trim(),
      });
      navigate(`/pagosAbono/${abonoIdOf(abono)}`);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo registrar el cargo");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-2rem)] -mx-1">
      <div className="sticky top-16 z-30 -mx-4 px-4 lg:-mx-8 lg:px-8 py-3 mb-8 bg-gray-50/95 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => navigate(`/pagosAbono/${id}`)} className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Nuevo cargo</h1>
              <p className="text-xs text-slate-400 mt-0.5">Obligación del cliente. No mueve la cuenta hasta que se cobre.</p>
            </div>
          </div>
          <button type="button" onClick={handleGuardar} disabled={!puede} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/20">
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Registrar cargo
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8 pb-16">
        <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 space-y-6">
          <SectionHeader index={1} title="Desde este abono" done={Boolean(abono)} />
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="font-bold text-slate-900">{abono?.cliente?.nombre || "Cargando…"}</p>
            <p className="text-xs text-slate-500 mt-0.5">{abono ? labelCocheras(abono) : ""}</p>
          </div>
          <SectionHeader index={2} title="Qué se cobra" done={puede} />
          <div className="max-w-xl space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Concepto</label>
              <input value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Control, llave, ajuste de período…" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Importe</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                <input type="number" min="0" step="1" value={importe} onChange={(e) => setImporte(e.target.value)} className={`${inputCls} pl-8`} />
              </div>
            </div>
          </div>
        </section>
        <aside className="hidden xl:block">
          <div className="sticky top-44 rounded-3xl bg-white overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
              <p className="text-base font-bold mt-1">Cargo</p>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <p className="font-semibold text-slate-900">{concepto.trim() || "Sin concepto"}</p>
              <p className="text-2xl font-black text-slate-900">{monto > 0 ? pesos(monto) : "—"}</p>
              <p className="text-xs text-slate-500">Queda como deuda del cliente de este abono.</p>
              <button type="button" onClick={handleGuardar} disabled={!puede} className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl">
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirmar cargo
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
