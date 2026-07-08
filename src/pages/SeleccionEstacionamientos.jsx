import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { Building, MapPin, ArrowRight, AlertCircle } from "lucide-react";

export default function SeleccionEstacionamientos() {
  const navigate = useNavigate();
  const [estacionamientos, setEstacionamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    const fetchEstacionamientos = async () => {
      try {
        const data = await authService.getEstacionamientos();
        // Asumiendo que data es un array de objetos EstacionamientoUsuarioDto
        setEstacionamientos(data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error al cargar los estacionamientos.");
      } finally {
        setLoading(false);
      }
    };

    fetchEstacionamientos();
  }, []);

  const handleSelect = async (estacionamiento) => {
    if (isSelecting) return;
    setIsSelecting(true);
    setError(null);

    try {
      const estacionamientoId = estacionamiento.id || estacionamiento.Id;
      await authService.seleccionarEstacionamiento(estacionamientoId);

      // Guardar el estacionamiento seleccionado para que el resto de la app sepa en cuál está trabajando
      localStorage.setItem("parkking_estacionamiento", JSON.stringify(estacionamiento));
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo seleccionar el estacionamiento.");
      setIsSelecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondos Decorativos y Efecto de Luces (Mismo estilo que el panel derecho del Login) */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

      {/* Cuadrícula sutil */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Cabecera */}
        <div className="text-center mb-10 space-y-3 animate-fade-in-up">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 mx-auto mb-6">
            <Building size={28} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Seleccioná un Estacionamiento
          </h2>
          <p className="text-indigo-200/70 text-sm md:text-base max-w-lg mx-auto">
            Por favor, elegí la sucursal con la que vas a operar en esta sesión.
          </p>
        </div>

        {/* Estado de Carga */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 text-white mt-10">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-indigo-200 animate-pulse">Cargando sucursales...</p>
          </div>
        ) : error ? (
          /* Estado de Error */
          <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-6 py-4 rounded-xl text-center backdrop-blur-sm flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <span>{error}</span>
          </div>
        ) : (
          /* Lista de Estacionamientos */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-fade-in-up">
            {estacionamientos.map((est) => (
              <button
                key={est.id || est.Id}
                onClick={() => handleSelect(est)}
                disabled={isSelecting}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all text-left flex flex-col justify-between h-44 overflow-hidden shadow-xl disabled:opacity-50 disabled:pointer-events-none"
              >
                {/* Resplandor al hacer hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                      <Building size={22} />
                    </div>
                    <div className="flex flex-col mt-1">
                      <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">
                        {est.nombre || est.Nombre}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-indigo-200/60 mt-auto">
                    <MapPin size={14} className="shrink-0 text-indigo-400/70" />
                    <p className="text-sm truncate w-full" title={est.direccion || est.Direccion}>
                      {est.direccion || est.Direccion}
                    </p>
                  </div>
                </div>

                {/* Flecha que aparece en hover */}
                <div className="absolute bottom-6 right-6 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-lg shadow-emerald-500/30">
                  <ArrowRight size={16} className="text-slate-900" />
                </div>
              </button>
            ))}

            {estacionamientos.length === 0 && (
              <div className="col-span-full bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-2xl text-center flex flex-col items-center justify-center">
                <Building size={48} className="text-white/20 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Sin estacionamientos</h3>
                <p className="text-indigo-200/70">No tenés estacionamientos asignados a tu cuenta en este momento.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
