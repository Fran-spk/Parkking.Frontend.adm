
import React from 'react';
import { 
  Percent, 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ShieldCheck,
  Zap
} from 'lucide-react';

const KpiCards = ({ data }) => {
  // Desestructuración segura con fallbacks de la estructura principal
  const porcentajeOcupacion = data?.porcentajeOcupacion ?? 0;
  const cocherasOcupadas = data?.cocherasOcupadas ?? 0;
  const cocherasTotales = data?.cocherasTotales ?? 0;
  const cantidadAbonosActivos = data?.cantidadAbonosActivos ?? 0;

  // Nuevas propiedades financieras mapeadas desde el DTO unificado del backend
  const totalRecaudadoReal = data?.detalleIngresos?.totalRecaudadoMensualReal ?? 0;
  const totalEstimadoProyeccion = data?.detalleIngresos?.totalEstimadoProyeccion ?? 0;
  const diferenciaPorcentaje = data?.detalleIngresos?.diferenciaPorcentaje ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Tarjeta 1: Ocupación Actual */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.08)] hover:-translate-y-1 group">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500"></div>
        
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Ocupación Cocheras
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {porcentajeOcupacion}%
              </span>
              <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                {cocherasOcupadas} / {cocherasTotales}
              </span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50/80 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="mt-6">
          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-full rounded-full transition-all duration-700 ease-out relative" 
              style={{ width: `${porcentajeOcupacion}%` }}
            >
              <span className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2.5">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              Espacios monitoreados
            </span>
            <span className="text-xs font-semibold text-indigo-600">
              {Math.max(0, cocherasTotales - cocherasOcupadas)} libres
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta 2: Abonos Activos */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.08)] hover:-translate-y-1 group">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Abonos Activos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {cantidadAbonosActivos}
              </span>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                Vigentes
              </span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50/80 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 leading-relaxed flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Clientes fijos con renovación mensual automática.
        </p>
      </div>

      {/* Tarjeta 3: Recaudación Real vs Estimada Desacoplada */}
      <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all duration-300 hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.08)] hover:-translate-y-1 group">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500"></div>

        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Recaudado (Mes Actual)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-emerald-600 tracking-tight">
                ${totalRecaudadoReal.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
          <div className="p-3 bg-amber-50/80 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-sm">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Sección inferior unificada: Proyección y Desfase Porcentual Equilibrados */}
        <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-3">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-gray-400">Proyección:</span>
            <span className="text-xs font-bold text-gray-700">
              ${totalEstimadoProyeccion.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
         {/* Badge de desvío financiero dinámico alineado al extremo derecho */}
         <span className={`text-[12px] font-bold mt-2 rounded-full flex items-center gap-0.5 ${
            diferenciaPorcentaje >= 0 
              ? 'bg-emerald-50 text-emerald-800' 
              : 'bg-rose-50 text-rose-800'
          }`}>
            {diferenciaPorcentaje >= 0 ? (
              <TrendingUp className="w-2.5 h-2.5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-2.5 h-2.5 text-rose-600" />
            )}
            {diferenciaPorcentaje >= 0 ? `+${diferenciaPorcentaje}%` : `${diferenciaPorcentaje}%`}
          </span>
        <div>

        </div>
      </div>
    </div>
  );
};

export default KpiCards;

