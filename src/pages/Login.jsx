import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { authService } from "../services/authService";
import { estacionamientoService } from "../services/estacionamientoService";
import { applyColorMarca, COLOR_MARCA_DEFAULT } from "../theme/parkking.theme.js";

const inputClass =
  "w-full pl-10 pr-4 py-2.5 text-sm border border-line-strong bg-surface-muted text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:bg-surface-card transition-colors disabled:opacity-50";

export default function Login() {
  const navigate = useNavigate();
  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    applyColorMarca(COLOR_MARCA_DEFAULT);
  }, []);

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
      await estacionamientoService.entrar(navigate);
    } catch (err) {
      console.error(err);
      setError(err.message || "Usuario o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-page flex items-center justify-center p-6 text-ink">
      <div className="w-full max-w-md bg-surface-card border border-line p-8 flex flex-col gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand text-brand-foreground flex items-center justify-center">
            <span className="text-sm font-black leading-none">P</span>
          </div>
          <div>
            <span className="text-sm font-black text-ink tracking-tight">Parkking</span>
            <p className="pk-label mt-0.5">Gestión central</p>
          </div>
        </div>

        <div className="w-full space-y-8">
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
              <label className="pk-label block">Usuario</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-faint group-focus-within:text-ink transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="admin2"
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
    </div>
  );
}


