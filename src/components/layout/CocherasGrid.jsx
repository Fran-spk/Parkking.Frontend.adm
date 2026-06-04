import React, { useState } from 'react';
import { 
  Car, 
  CheckCircle2, 
  HelpCircle, 
  SlidersHorizontal,
  XCircle,
  Clock
} from 'lucide-react';

const CocherasGrid = ({ estadoCocheras }) => {
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'libres', 'ocupadas'

  // Filtrar según el estado seleccionado
  const cocherasFiltradas = estadoCocheras.filter((cochera) => {
    const isOcupado = cochera.estado === 'Ocupado-Abono';
    if (filtro === 'libres') return !isOcupado;
    if (filtro === 'ocupadas') return isOcupado;
    return true;
  });

  // Contadores para los filtros
  const total = estadoCocheras.length;
  const ocupadas = estadoCocheras.filter(c => c.estado === 'Ocupado-Abono').length;
  const libres = total - ocupadas;

  return (
    <div className="space-y-5">
      {/* Barra de Filtros Interactivos */}
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

      {/* Grid del Mapa */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 max-h-[400px] overflow-y-auto pr-1">
        {cocherasFiltradas.map((cochera) => {
          const isOcupado = cochera.estado === 'Ocupado-Abono';
          
          // Generamos el texto del tooltip informativo
          const tooltipText = isOcupado 
            ? `Cochera N° ${cochera.numero}\nCliente: ${cochera.clienteNombre}\nVehículo: ${cochera.vehiculoModelo || 'Sin modelo'}\nPatente: ${cochera.patente}`
            : `Cochera N° ${cochera.numero}\nEstado: Disponible`;

          return (
            <div
              key={cochera.cocheraId}
              title={tooltipText}
              className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between items-center h-[88px] relative group overflow-hidden ${
                isOcupado 
                  ? 'bg-indigo-50/40 border-indigo-100 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-[0_4px_12px_rgba(99,102,241,0.08)]' 
                  : 'bg-white border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20 hover:text-emerald-700 hover:shadow-[0_4px_12px_rgba(16,185,129,0.06)]'
              }`}
            >
              {/* Background visual element for occupied spots */}
              {isOcupado && (
                <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <Car className="w-16 h-16 text-indigo-950" />
                </div>
              )}

              {/* Header Cell: Spot Number & Status Dot */}
              <div className="flex justify-between w-full items-center">
                <span className="text-[10px] text-gray-400 font-bold tracking-wider">
                  N° {cochera.numero}
                </span>
                
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isOcupado ? 'bg-indigo-600' : 'bg-emerald-500 animate-pulse'
                }`}></span>
              </div>

              {/* Main Indicator: Car icon or "L" badge */}
              <div className="my-1">
                {isOcupado ? (
                  <Car className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    LIBRE
                  </span>
                )}
              </div>

              {/* Sub-label showing License plate or "Disponible" */}
              <div className="w-full text-center truncate">
                {isOcupado ? (
                  <span className="text-[10px] font-mono font-bold tracking-tight bg-white border border-indigo-100/50 text-indigo-600 px-1.5 py-0.5 rounded shadow-sm block w-full truncate">
                    {cochera.patente || 'S/PAT'}
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
      
      {/* Referencias y Leyendas */}
      <div className="flex flex-wrap gap-4 mt-5 text-[11px] font-semibold text-gray-500 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100/80">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span> 
          <span className="text-gray-600">Espacio Libre (Disponible para abonar)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100/80">
          <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-sm"></span> 
          <span className="text-gray-600">Espacio Ocupado (Cliente Registrado)</span>
        </div>
      </div>
    </div>
  );
};

export default CocherasGrid;