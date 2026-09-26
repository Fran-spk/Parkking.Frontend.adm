import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Layers, Check, Loader2, AlertCircle } from "lucide-react";
import SelectorGrupos from "../components/layout/SelectorGrupos";
import { abonoService } from "../services/abonoService";
import { operacionFinancieraService } from "../services/operacionFinancieraService";
import { abonoIdOf, labelCocheras } from "../utils/abonoHelpers";

/** @typedef {import("../types").Abono} Abono */

const inputCls =
  "w-full text-sm border border-slate-200 rounded-xl px-3.5 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400 transition-all placeholder:text-slate-300";

function pesos(n) {
  return Number(n || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function ReintegroAbono() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abono, setAbono] = useState(/** @type {Abono | null} */ (null));
  const [motivo, setMotivo] = useState("");
  const [medio, setMedio] = useState("");
  const [importe, setImporte] = useState("");
  const [beneficiario, setBeneficiario] = useState("");
  const [grupos, setGrupos] = useState(/** @type {number[]} */ ([]));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    abonoService.getById(id).then((data) => {
      setAbono(data);
      setBeneficiario(data?.cliente?.nombre || "");
    }).catch(() => setError("No se pudo cargar el abono"));
  }, [id]);

  const monto = Number(importe);
  const puede = Boolean(abono) && motivo.trim() && medio.trim() && beneficiario.trim() && monto > 0 && !guardando;

  async function handleGuardar() {
    const clienteId = abono?.clienteId ?? abono?.cliente?.clienteId;
    if (!abono || !clienteId || !puede) {
      setError("Completá motivo, medio e importe");
      return;
    }
    try {
      setGuardando(true);
      setError(null);
      await operacionFinancieraService.crearReintegro({
        clienteId,
        abonoId: abonoIdOf(abono),
        importe: monto,
        beneficiario: beneficiario.trim(),
        motivo: motivo.trim(),
        medio: medio.trim(),
        grupoFinancieroIds: grupos,
      });
      navigate(`/pagosAbono/${abonoIdOf(abono)}`);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo registrar el reintegro");
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
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Nuevo reintegro</h1>
              <p className="text-xs text-slate-400 mt-0.5">Devuelve al cliente y resta en tu cuenta y en sus grupos.</p>
            </div>
          </div>
          <button type="button" onClick={handleGuardar} disabled={!puede} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/20">
            {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Registrar reintegro
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto mb-5 flex items-start gap-2.5 text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-8 pb-16">
        <div className="space-y-6">
          <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-sm font-black">1</div>
              <div>
                <p className="font-bold text-slate-900">{abono?.cliente?.nombre || "Cargando…"}</p>
                <p className="text-xs text-slate-500">{abono ? labelCocheras(abono) : ""}</p>
              </div>
            </div>
            <div className="max-w-xl space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Beneficiario</label>
                <input value={beneficiario} onChange={(e) => setBeneficiario(e.target.value)} className={inputCls} />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Medio</label>
                  <input value={medio} onChange={(e) => setMedio(e.target.value)} placeholder="Efectivo, transferencia…" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Importe</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                    <input type="number" min="0" step="1" value={importe} onChange={(e) => setImporte(e.target.value)} className={`${inputCls} pl-8`} />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">Motivo</label>
                <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Por qué se devuelve" className={inputCls} />
              </div>
            </div>
          </section>
          <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center"><Layers size={16} /></div>
              <h2 className="text-lg font-bold text-slate-900">Grupos</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4 max-w-xl">Se suman a las reglas del cliente de este abono.</p>
            <SelectorGrupos value={grupos} onChange={setGrupos} />
          </section>
        </div>
        <aside className="hidden xl:block">
          <div className="sticky top-44 rounded-3xl bg-white overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Resumen</p>
              <p className="text-base font-bold mt-1">Reintegro</p>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <p className="font-semibold text-slate-900">{motivo.trim() || "Sin motivo"}</p>
              <p className="text-2xl font-black text-rose-600">{monto > 0 ? pesos(-monto) : "—"}</p>
              <p className="text-xs text-slate-500">Ese importe resta en tu cuenta corriente.</p>
              <button type="button" onClick={handleGuardar} disabled={!puede} className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl">
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Confirmar reintegro
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
