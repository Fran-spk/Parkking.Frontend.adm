import React, { useState } from "react";
import { Car, SlidersHorizontal, Users } from "lucide-react";

function patenteLabel(cochera) {
  const ocupantes = Array.isArray(cochera.ocupantes) ? cochera.ocupantes : [];
  if (ocupantes.length > 1) {
    const pats = ocupantes.map((o) => o.patente).filter(Boolean);
    if (pats.length === 0) return `${ocupantes.length} abonos`;
    if (pats.length === 1) return `${pats[0]} +${ocupantes.length - 1}`;
    return `${pats[0]} +${ocupantes.length - 1}`;
  }
  return cochera.patente || "S/PAT";
}

function tooltipText(cochera, isOcupado) {
  if (!isOcupado) return `Cochera N° ${cochera.numero}\nEstado: Disponible`;

  const ocupantes = Array.isArray(cochera.ocupantes) ? cochera.ocupantes : [];
  if (ocupantes.length > 1) {
    const lines = [
      `Cochera N° ${cochera.numero}`,
      `Abonos activos: ${ocupantes.length}${cochera.multipleOcupacion ? " (multi)" : ""}`,
      ...ocupantes.map((o, i) => {
        const patente = o.patente || "S/PAT";
        const modelo = o.vehiculoModelo ? ` · ${o.vehiculoModelo}` : "";
        return `${i + 1}. ${o.clienteNombre} — ${patente}${modelo}`;
      }),
    ];
    return lines.join("\n");
  }

  return `Cochera N° ${cochera.numero}\nCliente: ${cochera.clienteNombre}\nVehículo: ${cochera.vehiculoModelo || "Sin modelo"}\nPatente: ${cochera.patente || "S/PAT"}`;
}

const CocherasGrid = ({ estadoCocheras }) => {
  const [filtro, setFiltro] = useState("todas");

  const cocherasFiltradas = estadoCocheras.filter((cochera) => {
    const isOcupado = cochera.estado === "Ocupado-Abono";
    if (filtro === "libres") return !isOcupado;
    if (filtro === "ocupadas") return isOcupado;
    return true;
  });

  const total = estadoCocheras.length;
  const ocupadas = estadoCocheras.filter((c) => c.estado === "Ocupado-Abono").length;
  const libres = total - ocupadas;

  const chip = (key, label, count) => (
    <button
      type="button"
      onClick={() => setFiltro(key)}
      className={`flex-1 sm:flex-initial text-xs px-3.5 py-1.5 font-bold transition-colors ${
        filtro === key
          ? "bg-brand text-brand-foreground"
          : "bg-surface-card text-ink-muted hover:text-ink hover:bg-surface-muted"
      }`}
    >
      {label} ({count})
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-surface-muted p-2.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted uppercase tracking-wider px-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-ink-faint" />
          <span>Filtro de espacio</span>
        </div>

        <div className="flex gap-1 w-full sm:w-auto">
          {chip("todas", "Todas", total)}
          {chip("libres", "Libres", libres)}
          {chip("ocupadas", "Ocupadas", ocupadas)}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto pr-1">
        {cocherasFiltradas.map((cochera) => {
          const isOcupado = cochera.estado === "Ocupado-Abono";
          const multi = (cochera.abonosActivos ?? cochera.ocupantes?.length ?? 0) > 1;

          return (
            <div
              key={cochera.cocheraId}
              title={tooltipText(cochera, isOcupado)}
              className={`p-3 cursor-pointer flex flex-col justify-between items-center h-[88px] relative overflow-hidden ${
                isOcupado ? "bg-brand-muted text-ink" : "bg-surface-card"
              }`}
            >
              {isOcupado && (
                <div className="absolute right-0 bottom-0 opacity-[0.04] pointer-events-none">
                  <Car className="w-16 h-16 text-brand" />
                </div>
              )}

              <div className="flex justify-between w-full items-center">
                <span className="text-[10px] text-ink-faint font-bold tracking-wider">
                  N° {cochera.numero}
                </span>
                <span
                  className={`w-1.5 h-1.5 ${
                    isOcupado ? "bg-brand" : "bg-success animate-pulse"
                  }`}
                />
              </div>

              <div className="my-1 relative">
                {isOcupado ? (
                  multi ? (
                    <Users className="w-5 h-5 text-brand" />
                  ) : (
                    <Car className="w-5 h-5 text-brand" />
                  )
                ) : (
                  <span className="text-[11px] font-bold text-success-ink bg-success-muted px-2 py-0.5">
                    LIBRE
                  </span>
                )}
                {multi && (
                  <span className="absolute -top-1.5 -right-3 min-w-[1.1rem] h-4 px-1 bg-brand text-brand-foreground text-[9px] font-black flex items-center justify-center">
                    {cochera.abonosActivos}
                  </span>
                )}
              </div>

              <div className="w-full text-center truncate">
                {isOcupado ? (
                  <span className="text-[10px] font-mono font-bold tracking-tight bg-surface-card text-ink px-1.5 py-0.5 block w-full truncate">
                    {patenteLabel(cochera)}
                  </span>
                ) : (
                  <span className="text-[9px] text-ink-faint font-medium block">Asignar</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-[11px] font-semibold text-ink-muted border-t border-line pt-4">
        <div className="flex items-center gap-2 bg-surface-muted px-3 py-1.5">
          <span className="w-2.5 h-2.5 bg-success animate-pulse" />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-muted px-3 py-1.5">
          <span className="w-2.5 h-2.5 bg-brand" />
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-muted px-3 py-1.5">
          <Users className="w-3.5 h-3.5 text-brand" />
          <span>Multi ocupación</span>
        </div>
      </div>
    </div>
  );
};

export default CocherasGrid;
