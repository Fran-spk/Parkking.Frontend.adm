import { useState } from "react";
import { X } from "lucide-react";
import { movimientoService } from "../../services/movimientoService";
import { abonoIdOf, labelCocheras } from "../../utils/abonoHelpers";

// TipoConcepto (backend): 0=PagoAbono, 1=ReintegroCliente, 2=CargoCliente, 3=GastoCochera
const TIPOS = [
  { value: 2, label: "Cargo",      desc: "El cliente debe pagar",          color: "border-red-400 bg-red-50 text-red-700"    },
  { value: 1, label: "Reintegro",  desc: "El estacionamiento devuelve",    color: "border-green-400 bg-green-50 text-green-700" },
];

export default function ModalCargoReintegro({ abono, onClose, onGuardado }) {
  const [tipoConcepto, setTipoConcepto] = useState(2);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [responsable, setResponsable] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function handleGuardar() {
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return; }
    if (!monto || Number(monto) <= 0) { setError("Ingresá un monto válido"); return; }
    try {
      setGuardando(true);
      setError(null);
      const fn = tipoConcepto === 2
        ? movimientoService.registrarCargoCliente
        : movimientoService.registrarReintegroCliente;
      await fn(
        abonoIdOf(abono),
        descripcion.trim(),
        monto,
        responsable.trim() || null,
      );
      onGuardado();
      onClose();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo registrar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Nuevo movimiento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Cochera {labelCocheras(abono)} · {abono.cliente?.nombre}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setTipoConcepto(t.value); setError(null); }}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border-2 transition-colors text-left ${
                    tipoConcepto === t.value ? t.color : "border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  <p className="font-semibold">{t.label}</p>
                  <p className="text-xs opacity-70">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Descripción <span className="text-red-400">*</span>
            </label>
            <input
              autoFocus
              value={descripcion}
              onChange={e => { setDescripcion(e.target.value); setError(null); }}
              placeholder={tipoConcepto === 2 ? "Ej: Control roto, ajuste mes..." : "Ej: Devolución por mes adelantado..."}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          {/* Monto y responsable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">
                Monto <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={monto}
                onChange={e => { setMonto(e.target.value); setError(null); }}
                placeholder="0"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Responsable</label>
              <input
                value={responsable}
                onChange={e => setResponsable(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button onClick={onClose} className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 text-sm text-white bg-indigo-600 rounded-lg py-2.5 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}