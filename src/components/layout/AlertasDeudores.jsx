import React from 'react';
import { useNavigate } from "react-router-dom";
import { 
  BellRing, 
  Phone, 
  CreditCard, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  UserCheck
} from 'lucide-react';

const AlertasDeudores = ({ alertas }) => {
  const navigate = useNavigate();
  const handleRegistrarPago = (abonoId, cliente, monto) => {
    navigate(`/pagosAbono/${abonoId}`)
  };

  // Helper para obtener las iniciales del nombre
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Listado de degradados suaves para avatares
  const gradients = [
    'from-red-400 to-rose-500',
    'from-orange-400 to-amber-500',
    'from-indigo-400 to-blue-500',
    'from-purple-400 to-pink-500'
  ];

  if (!alertas || alertas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 text-center animate-fade-in-up">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_12px_rgba(16,185,129,0.1)]">
          <UserCheck className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-sm font-bold text-gray-800">¡Cuentas al Día!</h4>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
          No hay abonos con deudas o cobros pendientes registrados hoy.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
      {alertas.map((alerta, index) => {
        const avatarGradient = gradients[index % gradients.length];
        
        return (
          <div 
            key={alerta.abonoId ?? alerta.abonoCocheraId} 
            className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.015)] hover:border-gray-200/80 group"
          >
            {/* Detalles del Cliente */}
            <div className="flex items-center gap-3">
              {/* Avatar con degradado */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0`}>
                {getInitials(alerta.clienteNombre)}
              </div>
              
              <div className="space-y-1 min-w-0">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="font-bold text-gray-900 text-sm truncate max-w-[140px]">
                    {alerta.clienteNombre}
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Cochera {alerta.cocheraNumero}
                  </span>
                </div>
                
                {/* Detalles de contacto y atraso */}
                <div className="text-xs text-gray-400 flex items-center gap-x-3 gap-y-1 flex-wrap">
                  <span className="text-rose-600 font-semibold flex items-center gap-0.5 bg-rose-50 px-1.5 py-0.5 rounded-md text-[10px]">
                    <AlertTriangle className="w-3 h-3" />
                    {alerta.diasAtraso} días de atraso
                  </span>
                  
                  {alerta.clienteTelefono && (
                    <a 
                      href={`https://wa.me/${alerta.clienteTelefono.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold text-[11px] bg-emerald-50/50 hover:bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                      Chat
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Acción y Monto */}
            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
              {alerta.saldoTotal > 0 || alerta.precioAcordado != null ? (
              <span className="text-sm font-black text-gray-900 tracking-tight">
                Deuda: ${(alerta.saldoTotal > 0 ? alerta.saldoTotal : alerta.precioAcordado).toLocaleString("es-AR")}
                {alerta.periodosAdeudados > 1 && (
                  <span className="block text-[10px] font-semibold text-gray-400">
                    {alerta.periodosAdeudados} períodos
                  </span>
                )}
              </span>
              ) : null}
              <button
                onClick={() => handleRegistrarPago(alerta.abonoId ?? alerta.abonoCocheraId, alerta.clienteNombre, alerta.precioAcordado ?? null)}
                className="text-[11px] flex items-center gap-1 bg-white text-indigo-600 border border-indigo-100 font-bold px-3 py-1.5 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 active:scale-95 group-hover:shadow-md"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Cobrar</span>
                <ArrowRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertasDeudores;