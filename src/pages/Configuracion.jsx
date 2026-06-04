import { useState } from "react";
import { 
  User, 
  Building, 
  SlidersHorizontal, 
  DollarSign, 
  Users 
} from "lucide-react";

// Sub-componentes modulares de configuración


// Jerarquía de configuración alineada con la estrategia de producto
const SETTINGS_TABS = [
  { id: "perfil",       label: "Mi Perfil",            icon: User },
  { id: "estacionamiento", label: "Estacionamiento",   icon: Building },
  { id: "general",      label: "Parámetros Generales", icon: SlidersHorizontal },
  { id: "tarifas",      label: "Tarifas y Categorías", icon: DollarSign },
  { id: "usuarios",     label: "Usuarios y Roles",     icon: Users },
];

export default function Configuracion() {
  const [activeTab, setActiveTab] = useState("perfil");

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Configuración</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Administrá tu perfil de usuario y las reglas base del estacionamiento
        </p>
      </div>

      {/* Layout de Ajustes Dividido en Dos Columnas */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* 1. BARRA LATERAL INTERNA DE AJUSTES */}
        <div className="w-full lg:w-64 bg-white rounded-2xl p-3 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.015)] space-y-0.5">
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
            Secciones
          </span>
          
          {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
            const isSelected = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isSelected
                    ? "bg-indigo-50/60 text-indigo-600 border-l-2 border-indigo-600 rounded-l-none pl-3"
                    : "text-gray-400 hover:bg-slate-50/60 hover:text-gray-800"
                }`}
              >
                <Icon 
                  size={16} 
                  className={`transition-transform duration-200 group-hover:scale-105 ${
                    isSelected ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                <span className="tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>

        {/* 2. PANEL CONTENEDOR DINÁMICO */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">

        </div>

      </div>
    </div>
  );
}