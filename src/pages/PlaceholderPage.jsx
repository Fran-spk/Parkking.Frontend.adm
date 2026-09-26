import { Construction } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";

/**
 * Página placeholder para rutas del nav reservadas a futuro.
 * Usa PageHeader para mantener el estándar de cabeceras.
 */
export default function PlaceholderPage({
  title,
  description,
  section = "Próximamente",
}) {
  return (
    <div className="animate-fade-in-up max-w-2xl space-y-5">
      <PageHeader
        title={title}
        description={description || `${section}. Esta pantalla se completará cuando prioricemos la funcionalidad.`}
        stats={[
          { label: "Estado", value: "—" },
          { label: "Datos", value: "—" },
          { label: "Acciones", value: "—" },
        ]}
      />

      <div className="border border-dashed border-line-strong bg-surface-muted/60 px-6 py-14 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-surface-card text-ink-faint mb-4">
          <Construction size={22} />
        </div>
        <p className="text-sm font-semibold text-ink">Sin datos todavía</p>
        <p className="text-xs text-ink-faint mt-1.5 max-w-sm mx-auto leading-relaxed">
          Esta pantalla está en el menú como referencia. La vamos a completar cuando prioricemos
          la funcionalidad.
        </p>
      </div>
    </div>
  );
}
