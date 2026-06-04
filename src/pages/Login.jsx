import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ParkingSquare,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Zap
} from "lucide-react";
import { authService } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !password.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.login(loginInput, password);
      // Login exitoso -> Redirigir al dashboard
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-stretch overflow-hidden text-gray-800">
      
      {/* PANEL IZQUIERDO: Formulario de Login */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 lg:p-12 bg-white relative z-10 shadow-xl">
        
        {/* Header - Logo */}
        <div className="flex items-center gap-3 animate-fade-in-up">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <ParkingSquare size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-gray-900 tracking-tight">Parkking</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">Gestión Central</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="max-w-md w-full mx-auto my-auto py-12 space-y-8 animate-fade-in-up">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              ¡Bienvenido de vuelta!
            </h2>
            <p className="text-sm text-gray-500">
              Ingresa tus credenciales para acceder a la administración.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 animate-pulse-glow">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Usuario / Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                Usuario o Correo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="admin o admin@parkking.com"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center pl-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Contraseña
                </label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 focus:bg-white transition-all disabled:opacity-50 disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer - Copyright */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-6 border-t border-slate-100">
          <span>&copy; {new Date().getFullYear()} Parkking S.A.</span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" />
            Acceso Encriptado SSL
          </span>
        </div>

      </div>

      {/* PANEL DERECHO: Ilustración y Branding (Solo Escritorio) */}
      <div className="hidden lg:flex lg:w-[55%] bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
        {/* Fondos Decorativos y Efecto de Luces */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900" />
        
        {/* Circulos de luz flotantes */}
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

        {/* Contenido Visual del Panel */}
        <div className="relative max-w-lg w-full text-center space-y-10 z-10">
          
          {/* Ilustración de Dashboard o Mockup en Glassmorphism */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl relative animate-fade-in-up">
            
            {/* Cabecera del Mockup */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[10px] text-white/40 tracking-wider font-mono">PANEL CENTRAL</span>
            </div>

            {/* KPI Cards de Simulación */}
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Ocupación Actual</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white">82%</span>
                  <span className="text-[10px] text-emerald-400 font-bold">+5% hoy</span>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Ingreso Diario</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-bold text-indigo-300">$</span>
                  <span className="text-2xl font-black text-white">45.200</span>
                </div>
              </div>
            </div>

            {/* Listado de Autos Ficticios */}
            <div className="mt-4 space-y-2 text-left">
              <div className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-white">Cochera 04 - Ocupado</p>
                    <p className="text-[10px] text-white/40">Patente: AF-123-JK</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full">Activo</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                  <div>
                    <p className="text-xs font-bold text-white">Cochera 15 - Libre</p>
                    <p className="text-[10px] text-white/40">Disponible para abono o rotativo</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2.5 py-1 rounded-full">Libre</span>
              </div>
            </div>

            {/* Insignia Flotante */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-slate-900 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse-glow">
              <Zap size={10} className="fill-slate-900" />
              Tiempo Real
            </div>

          </div>

          {/* Copy e Información de Marketing */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">
              Control inteligente para tu estacionamiento
            </h3>
            <p className="text-sm text-indigo-200/60 max-w-sm mx-auto">
              Gestioná cocheras, controlá ingresos mensuales, liquidá abonos y consultá métricas en una sola plataforma unificada.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
