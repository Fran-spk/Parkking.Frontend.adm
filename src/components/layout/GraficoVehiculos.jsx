import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';

// Paleta contemporánea de alto impacto
const COLORES = {
  'Autos': '#6366f1',       // Indigo
  'Camionetas': '#06b6d4',  // Cyan
  'Motos': '#f59e0b',       // Amber
  'Otros': '#64748b'        // Slate
};

// Tooltip Personalizado de Alta Legibilidad
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = COLORES[data.tipoVehiculo] || COLORES['Otros'];
    return (
      <div className="bg-white/90 backdrop-blur-md px-3.5 py-3 rounded-xl border border-gray-100/90 shadow-[0_12px_24px_rgba(0,0,0,0.04)] text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          <span className="font-bold text-gray-800">{data.tipoVehiculo}</span>
        </div>
        <p className="text-gray-500 font-medium mt-1">
          Cantidad: <span className="font-black text-gray-900">{data.cantidad}</span> ({data.porcentaje}%)
        </p>
      </div>
    );
  }
  return null;
};

const GraficoVehiculos = ({ datos }) => {
  // Calculamos el total de vehículos dinámicamente para el centro de la rosca
  const totalVehiculos = datos.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around min-h-[280px] w-full gap-6">
      
      {/* Contenedor del gráfico con número central overlay */}
      <div className="relative w-full sm:w-1/2 h-56 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              cx="50%"
              cy="50%"
              innerRadius={68}  // Radio interno un poco más amplio
              outerRadius={84}  // Radio externo
              paddingAngle={3}  // Separación fina
              dataKey="cantidad"
              nameKey="tipoVehiculo"
            >
              {datos.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORES[entry.tipoVehiculo] || COLORES['Otros']} 
                  className="stroke-white stroke-2 outline-none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Texto central del Donut (Métrica Ejecutiva) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
          <span className="text-3xl font-black tracking-tight text-gray-900 leading-none">
            {totalVehiculos}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Vehículos
          </span>
        </div>
      </div>

      {/* Leyenda enriquecida con barra de progreso relativa al costado */}
      <div className="flex flex-col gap-3.5 w-full sm:w-1/2 px-2 sm:px-4">
        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
          Detalle de Distribución
        </h4>
        
        {datos.map((item, index) => {
          const color = COLORES[item.tipoVehiculo] || COLORES['Otros'];
          
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                  <span className="text-gray-800">{item.tipoVehiculo}</span>
                </div>
                <div className="text-gray-400 font-medium">
                  <span className="font-extrabold text-gray-900">{item.cantidad}</span> ({item.porcentaje}%)
                </div>
              </div>
              
              {/* Barra de progreso relativo */}
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    backgroundColor: color, 
                    width: `${item.porcentaje}%` 
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GraficoVehiculos;