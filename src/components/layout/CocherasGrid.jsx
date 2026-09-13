import React, { useState } from 'react';
import { 
  Car, 
  SlidersHorizontal,
  Users,
} from 'lucide-react';

function patenteLabel(cochera) {
  const ocupantes = Array.isArray(cochera.ocupantes) ? cochera.ocupantes : [];
  if (ocupantes.length > 1) {
    const pats = ocupantes
      .map((o) => o.patente)
      .filter(Boolean);
    if (pats.length === 0) return `${ocupantes.length} abonos`;
    if (pats.length === 1) return `${pats[0]} +${ocupantes.length - 1}`;
    return `${pats[0]} +${ocupantes.length - 1}`;
  }
  return cochera.patente || 'S/PAT';
}

function tooltipText(cochera, isOcupado) {
  if (!isOcupado) return `Cochera N° ${cochera.numero}\nEstado: Disponible`;

  const ocupantes = Array.isArray(cochera.ocupantes) ? cochera.ocupantes : [];
  if (ocupantes.length > 1) {
    const lines = [
      `Cochera N° ${cochera.numero}`,
      `Abonos activos: ${ocupantes.length}${cochera.multipleOcupacion ? ' (multi)' : ''}`,
      ...ocupantes.map((o, i) => {
        const patente = o.patente || 'S/PAT';
        const modelo = o.vehiculoModelo ? ` · ${o.vehiculoModelo}` : '';
        return `${i + 1}. ${o.clienteNombre} — ${patente}${modelo}`;
      }),
    ];
    return lines.join('\n');
  }

  return `Cochera N° ${cochera.numero}\nCliente: ${cochera.clienteNombre}\nVehículo: ${cochera.vehiculoModelo || 'Sin modelo'}\nPatente: ${cochera.patente || 'S/PAT'}`;
}

const CocherasGrid = ({ estadoCocheras }) => {
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'libres', 'ocupadas'

  const cocherasFiltradas = estadoCocheras.filter((cochera) => {
    const isOcupado = cochera.estado === 'Ocupado-Abono';
    if (filtro === 'libres') return !isOcupado;
    if (filtro === 'ocupadas') return isOcupado;
    return true;
  });

  const total = estadoCocheras.length;
  const ocupadas = estadoCocheras.filter(c => c.estado === 'Ocupado-Abono').length;
  const libres = total - ocupadas;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase px-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
          <span>Filtro de Espacio</span>
        </div>
        
        <div className="flex gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFiltro('todas')}
            className={`flex-1 sm:flex-initial text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              filtro === 'todas'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
            }`}
          >
            Todas ({total})
          </button>
          <button
            onClick={() => setFiltro('libres')}
            className={`flex-1 sm:flex-initial text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              filtro === 'libres'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
            }`}
          >
            Libres ({libres})
          </button>
          <button
            onClick={() => setFiltro('ocupadas')}
            className={`flex-1 sm:flex-initial text-xs px-3.5 py-1.5 rounded-lg font-bold transition-all ${
              filtro === 'ocupadas'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50'
            }`}
          >
            Ocupadas ({ocupadas})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 max-h-[400px] overflow-y-auto pr-1">
        {cocherasFiltradas.map((cochera) => {
          const isOcupado = cochera.estado === 'Ocupado-Abono';
          const multi = (cochera.abonosActivos ?? cochera.ocupantes?.length ?? 0) > 1;

          return (
            <div
              key={cochera.cocheraId}
              title={tooltipText(cochera, isOcupado)}
              className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between items-center h-[88px] relative group overflow-hidden ${
                isOcupado 
                  ? 'bg-indigo-50/40 border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)]' 
                  : 'bg-white border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(16,185,129,0.06)]'
              }`}
            >
              {isOcupado && (
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <Car className="w-16 h-16 text-indigo-950" />
                </div>
              )}

              <div className="flex justify-between w-full items-center">
                <span className="text-[10px] text-gray-400 font-bold tracking-wider">
                  N° {cochera.numero}
                </span>
                
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isOcupado ? 'bg-indigo-600' : 'bg-emerald-500 animate-pulse'
                }`}></span>
              </div>

              <div className="my-1 relative">
                {isOcupado ? (
                  multi ? (
                    <Users className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Car className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
                  )
                ) : (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    LIBRE
                  </span>
                )}
                {multi && (
                  <span className="absolute -top-1.5 -right-3 min-w-[1.1rem] h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">
                    {cochera.abonosActivos}
                  </span>
                )}
              </div>

              <div className="w-full text-center truncate">
                {isOcupado ? (
                  <span className="text-[10px] font-mono font-bold tracking-tight bg-white border border-indigo-100/50 text-indigo-600 px-1.5 py-0.5 rounded shadow-sm block w-full truncate">
                    {patenteLabel(cochera)}
                  </span>
                ) : (
                  <span className="text-[9px] text-gray-400 font-medium block">
                    Asignar
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex flex-wrap gap-4 mt-5 text-[11px] font-semibold text-gray-500 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100/80">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span> 
          <span className="text-gray-600">Espacio Libre (Disponible para abonar)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100/80">
          <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm"></span> 
          <span className="text-gray-600">Espacio Ocupado (Cliente Registrado)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100/80">
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-gray-600">Multi ocupación (varios abonos)</span>
        </div>
      </div>
    </div>
  );
};

export default CocherasGrid;
