import { Construction } from "lucide-react";

/**
 * Página placeholder para rutas del nav reservadas a futuro.
 */
export default function PlaceholderPage({
  title,
  description,
  section = "Próximamente",
}) {
  return (
    <div className="animate-fade-in-up max-w-2xl">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">
          {section}
        </p>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{description}</p>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-gray-100 text-gray-400 mb-4">
          <Construction size={22} />
        </div>
        <p className="text-sm font-semibold text-gray-700">Sin datos todavía</p>
        <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
          Esta pantalla está en el menú como referencia. La vamos a completar cuando prioricemos
          la funcionalidad.
        </p>
      </div>
    </div>
  );
}
