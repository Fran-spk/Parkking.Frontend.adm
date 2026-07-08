import { Plus, Lock } from "lucide-react";

export default function AccionesCaja({ onAgregarGasto, onCerrar, cerrando }) {
  return (
    <div className="flex gap-2 mb-5">
      <button
        onClick={onAgregarGasto}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        <Plus size={16} />
        Agregar gasto operativo
      </button>
      <button
        onClick={onCerrar}
        disabled={cerrando}
        className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        <Lock size={14} />
        {cerrando ? "Cerrando..." : "Cerrar caja"}
      </button>
    </div>
  );
}
