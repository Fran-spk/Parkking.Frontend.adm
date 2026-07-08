import React from 'react';

export const componentesDisponibles = [
  { id: "pared", nombre: "Pared", assetName: "pared.svg", ancho: 100, alto: 20 },
  { id: "cochera-techada", nombre: "Cochera Techada", assetName: "cochera-techada.svg", ancho: 60, alto: 100 },
  { id: "cochera-aire-libre", nombre: "Cochera Aire Libre", assetName: "cochera-aire-libre.svg", ancho: 60, alto: 100 },
  { id: "cochera-ocupada", nombre: "Cochera Ocupada", assetName: "cochera-ocupada.svg", ancho: 60, alto: 100 },
  { id: "cochera-deshabilitada", nombre: "Cochera Deshabilitada", assetName: "cochera-deshabilitada.svg", ancho: 60, alto: 100 },
  { id: "entrada-vehicular", nombre: "Entrada Vehicular", assetName: "entrada-vehicular.svg", ancho: 80, alto: 20 },
  { id: "salida-vehicular", nombre: "Salida Vehicular", assetName: "salida-vehicular.svg", ancho: 80, alto: 20 },
  { id: "entrada-salida-mixta", nombre: "Entrada/Salida Mixta", assetName: "entrada-salida-mixta.svg", ancho: 80, alto: 20 },
  { id: "area-techada", nombre: "Área Techada", assetName: "area-techada.svg", ancho: 100, alto: 100 },
  { id: "area-libre", nombre: "Área Libre", assetName: "area-aire-libre.svg", ancho: 100, alto: 100 },
];

export default function PaletaComponentes({ elementosCount }) {
  const handleDragStartItem = (e, comp) => {
    e.dataTransfer.setData("componente", JSON.stringify(comp));
  };

  return (
    <div className="w-full bg-slate-900 flex items-center justify-between px-6 py-3 shadow-md z-10 border-b border-slate-800 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <div>
          <h2 className="text-white font-extrabold text-lg tracking-tight leading-tight">Planos</h2>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest">Paleta de Elementos</p>
        </div>
        
        <div className="h-8 w-px bg-slate-700/50 mx-2"></div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar flex-1">
          {componentesDisponibles.map((comp) => (
            <div
              key={comp.id}
              draggable
              onDragStart={(e) => handleDragStartItem(e, comp)}
              title={`${comp.nombre} (${comp.ancho}x${comp.alto}px)`}
              className="bg-slate-800/50 hover:bg-slate-700 border border-white/5 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all group shrink-0"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src={`/assets/blueprint/${comp.assetName}`} 
                  alt={comp.nombre} 
                  className="max-w-full max-h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.style.display = "none";
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-xs font-medium text-slate-400 flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 shrink-0 ml-4">
        <span>Elementos en plano:</span>
        <span className="bg-indigo-500 text-white px-2 py-0.5 rounded-md font-bold">{elementosCount}</span>
      </div>
    </div>
  );
}
