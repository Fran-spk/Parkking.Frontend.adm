import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  ParkingSquare,
} from "lucide-react";
import { authService } from "../services/authService";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 text-sm border border-line-strong bg-surface-muted text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:bg-surface-card transition-colors disabled:opacity-50";

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
      navigate("/seleccion-estacionamientos");
    } catch (err) {
      console.error(err);
      setError(err.message || "Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-page flex items-stretch overflow-hidden text-ink">
      {/* Formulario */}
      <div className="w-full lg:w-[45%] flex flex-col justify-between p-8 lg:p-12 bg-surface-card relative z-10">
        <div className="flex items-center gap-2.5 animate-fade-in-up">
          <div className="w-9 h-9 bg-brand text-brand-foreground flex items-center justify-center">
            <span className="text-sm font-black leading-none">P</span>
          </div>
          <div>
            <span className="text-sm font-black text-ink tracking-tight">Parkking</span>
            <p className="pk-label mt-0.5">Gestión central</p>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-auto py-12 space-y-8 animate-fade-in-up">
          <div className="space-y-2">
            <h1 className="pk-title text-[1.75rem]">Bienvenido de vuelta</h1>
            <p className="pk-desc">
              Ingresá tus credenciales para acceder a la administración.
            </p>
          </div>

          {error && (
            <div className="bg-danger-muted text-danger-ink text-xs px-4 py-3 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="pk-label block">Usuario o correo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint group-focus-within:text-ink transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="admin o admin@parkking.com"
                  required
                  disabled={loading}
                  autoComplete="username"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="pk-label block">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint group-focus-within:text-ink transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-faint hover:text-ink transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand hover:bg-brand-strong text-brand-foreground font-bold text-sm transition-colors flex items-center justify-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-foreground border-t-transparent animate-spin" />
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-faint pt-6 border-t border-line">
          <span>&copy; {new Date().getFullYear()} Parkking</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-success" />
            Acceso seguro
          </span>
        </div>
      </div>

      {/* Panel branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-brand relative items-center justify-center p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-lg w-full space-y-10 z-10 animate-fade-in-up">
          <div className="bg-white/[0.06] border border-white/10 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div className="flex items-center gap-2">
                <ParkingSquare size={16} className="text-white/70" />
                <span className="text-[10px] text-white/50 tracking-wider font-bold uppercase">
                  Panel central
                </span>
              </div>
              <span className="text-[10px] font-mono text-white/40">Parkking</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-white/[0.06] p-4 border border-white/5">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  Ocupación
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-white tabular-nums">82%</span>
                  <span className="text-[10px] text-emerald-300 font-bold">+5% hoy</span>
                </div>
              </div>
              <div className="bg-white/[0.06] p-4 border border-white/5">
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                  Ingreso diario
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-white tabular-nums">$45.200</span>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-left">
              <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Cochera 04 · Ocupada</p>
                    <p className="text-[10px] text-white/40 font-mono">AF-123-JK</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white/70 bg-white/10 px-2 py-0.5">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 bg-white/30" />
                  <div>
                    <p className="text-xs font-bold text-white">Cochera 15 · Libre</p>
                    <p className="text-[10px] text-white/40">Disponible para abono</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-white/40 bg-white/5 px-2 py-0.5">
                  Libre
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Control claro para tu estacionamiento
            </h2>
            <p className="text-sm text-white/55 max-w-sm mx-auto leading-relaxed">
              Cocheras, abonos, cobros y métricas en una sola plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


