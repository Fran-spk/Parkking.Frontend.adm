import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Info, Loader2, AlertCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { pagoMensualService } from "../../services/pagoMensualService";

const formatCurrency = (val) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(val);

export default function ModalRegistrarPago({ abono, mesPreseleccionado, onClose, onRegistrado }) {
  
  // Estado inicial blindado: recrea la fecha basándose en los números locales
  const [mes, setMes] = useState(() => {
    if (!mesPreseleccionado) return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const d = new Date(mesPreseleccionado);
    // Si viene de la lista, forzamos creación local pura para evitar desfase
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [monto, setMonto] = useState("");
  const [recargo, setRecargo] = useState("");
  const [observacion, setObservacion] = useState("");
  const [sugerido, setSugerido] = useState(null);
  const [loadingSugerido, setLoadingSugerido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Helper para enviar string plano "YYYY-MM-DD" al backend
    const buildDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    return `${year}-${month}-01`;
    };

  useEffect(() => {
    const fetchSugerido = async () => {
      setLoadingSugerido(true);
      try {
        const res = await pagoMensualService.getSugerido(abono.abonoCocheraId, buildDateString(mes));
        setSugerido(res);
        setMonto(res.monto != null ? String(res.monto) : "");
        setRecargo(res.recargo > 0 ? String(res.recargo) : "");
      } catch (err) {
        console.error("Error sugerido", err);
      } finally {
        setLoadingSugerido(false);
      }
    };
    fetchSugerido();
  }, [mes, abono.abonoCocheraId]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setEnviando(true);
  setError(null);

  try {
    // 1. Validamos que monto sea un número real antes de armar el objeto
    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico)) {
      throw new Error("El monto no es un número válido");
    }

    // 2. Limpiamos el recargo: o es número o es NULL (nunca NaN ni string vacío)
    const recargoNumerico = recargo !== "" && recargo !== null ? parseFloat(recargo) : null;

    // 3. Construimos el payload asegurando tipos primitivos
    const abonoId = Number(abono.abonoCocheraId);
    if (!abonoId) throw new Error("Abono inválido");

    const payload = {
      abonoCocheraId: abonoId,
      mes: buildDateString(mes),
      monto: montoNumerico,
      recargo: recargoNumerico != null && !isNaN(recargoNumerico) ? recargoNumerico : null,
      observacion: observacion?.trim() || null,
      mercadoPagoId: null,
    };

    await pagoMensualService.registrar(payload);
    onRegistrado();
    onClose();
  } catch (err) {
    const data = err.response?.data;
    const msg =
      typeof data === "string" ? data
      : data?.title || data?.message || data?.error
      || err.message
      || "No se pudo registrar el pago";
    setError(msg);
  } finally {
    setEnviando(false);
  }
};

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Header Minimalista */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
          <div>
            <h3 className="text-slate-800 font-black text-xl tracking-tight">Registrar Pago</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">Cochera {abono.cochera?.numero}</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-slate-50 rounded-full transition-colors group">
            <X size={20} className="text-slate-300 group-hover:text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Banner de Sugerencia */}
          {sugerido && (
            <div className="bg-indigo-50/50 rounded-3xl p-5 border border-indigo-100/50 flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm text-indigo-600"><Info size={20} /></div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Importe Sugerido</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-indigo-900">{formatCurrency(sugerido.monto + (sugerido.recargo || 0))}</p>
                  {sugerido.aplicaProporcional && <span className="text-[9px] font-black text-amber-600 uppercase italic">Proporcional</span>}
                </div>
              </div>
            </div>
          )}

          {/* Selector de Mes */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Periodo a abonar</label>
            <div className="relative">
              <DatePicker
                selected={mes}
                onChange={(d) => setMes(new Date(d.getFullYear(), d.getMonth(), 1))}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                locale={es}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/10 outline-none"
              />
              <Calendar size={18} className="absolute right-5 top-4 text-slate-300 pointer-events-none" />
            </div>
          </div>

          {/* Campos Numéricos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto</label>
              <div className="relative">
                <input type="number" required value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10" />
                <DollarSign size={14} className="absolute right-5 top-4.5 text-slate-300" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recargo</label>
              <input type="number" value={recargo} onChange={(e) => setRecargo(e.target.value)} placeholder="0" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[11px] font-black p-4 rounded-2xl border border-red-100">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-600 transition-colors">Cancelar</button>
            <button
              type="submit"
              disabled={enviando || loadingSugerido}
              className="flex-2 bg-slate-900 text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 disabled:opacity-50 transition-all shadow-xl shadow-slate-200 flex justify-center items-center gap-2"
            >
              {enviando ? <Loader2 size={16} className="animate-spin" /> : "Confirmar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}