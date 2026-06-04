import { useState } from "react";
import { X } from "lucide-react";
import { abonoService } from "../../services/abonoService";

export default function ModalEditarAbono({ abono, onClose, onGuardado }) {
  const [form, setForm] = useState({
    patente:        abono.patente        ?? "",
    modeloVehiculo: abono.modeloVehiculo ?? "",
    cobrador:       abono.cobrador       ?? "",
    precioAcordado: abono.precioAcordado ?? "",
  });
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleGuardar() {
    try {
      setGuardando(true);
      setError(null);
      await abonoService.modificar(abono.abonoCocheraId, {
        patente:        form.patente.trim()        || null,
        modeloVehiculo: form.modeloVehiculo.trim() || null,
        cobrador:       form.cobrador.trim()       || null,
        precioAcordado: form.precioAcordado !== "" ? Number(form.precioAcordado) : null,
      });
      onGuardado();
      onClose();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo guardar los cambios");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Editar abono</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Cochera {abono.cochera?.numero} · {abono.cliente?.nombre}
            </p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Patente y modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Patente</label>
              <input
                value={form.patente}
                onChange={e => set("patente", e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                maxLength={7}
                className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Modelo</label>
              <input
                value={form.modeloVehiculo}
                onChange={e => set("modeloVehiculo", e.target.value)}
                placeholder="Ej: Golf"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Cobrador */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">Cobrador</label>
            <input
              value={form.cobrador}
              onChange={e => set("cobrador", e.target.value)}
              placeholder=""
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          {/* Precio acordado */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">
              Precio acordado
              <span className="ml-1.5 font-normal text-gray-400">— dejá vacío para usar tarifa vigente al cobrar</span>
            </label>
            <input
              type="number"
              value={form.precioAcordado}
              onChange={e => set("precioAcordado", e.target.value)}
              placeholder="Opcional"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 text-sm text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 text-sm text-white bg-indigo-600 rounded-lg py-2.5 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}