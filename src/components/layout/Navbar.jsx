import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  RefreshCcw,
  LogOut,
} from "lucide-react";
import { authService } from "../../services/authService";

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const [estacionamiento, setEstacionamiento] = useState(null);
  const [ahora, setAhora] = useState(() => new Date());

  useEffect(() => {
    const stored = localStorage.getItem("parkking_estacionamiento");
    if (stored) {
      try {
        setEstacionamiento(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem("parkking_estacionamiento");
      if (stored) {
        try {
          setEstacionamiento(JSON.parse(stored));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener("estacionamiento_changed", handler);
    return () => window.removeEventListener("estacionamiento_changed", handler);
  }, []);

  const handleChangeEstacionamiento = () => navigate("/seleccion-estacionamientos");

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const goHome = () => navigate("/mi-estacionamiento");

  const sucursal = estacionamiento?.nombre || estacionamiento?.Nombre || "";
  const direccion = estacionamiento?.direccion || estacionamiento?.Direccion || "";
  // Login guarda { usuario: { nombre, mail, ... } }; Auth/me es plano { nombre, email }
  const nombreCompleto =
    user?.usuario?.nombre ||
    user?.nombre ||
    user?.Nombre ||
    user?.usuario?.mail ||
    user?.email ||
    "";

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fechaSistema = ahora.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const horaSistema = ahora.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header
      className="
        fixed top-0 right-0 left-0 z-20
        bg-surface-card border-b border-line-subtle
        shadow-pk-soft
        px-4 lg:px-6 h-14 flex items-center justify-between gap-4
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 -ml-1 text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-2.5 min-w-0 group"
          aria-label="Ir al inicio"
          title="Inicio"
        >
          <div className="w-8 h-8 bg-brand text-brand-foreground flex items-center justify-center shrink-0">
            <span className="text-sm font-black leading-none">P</span>
          </div>
          <div className="flex flex-col min-w-0 text-left">
            <span className="text-sm font-black text-ink leading-tight tracking-tight group-hover:text-brand transition-colors">
              Parkking
            </span>
            {sucursal ? (
              <span
                className="text-[10px] font-medium text-ink-faint truncate max-w-[160px] sm:max-w-[220px]"
                title={direccion || sucursal}
              >
                {sucursal}
              </span>
            ) : null}
          </div>
        </button>

        <div className="hidden sm:block h-6 w-px bg-line-subtle mx-1 shrink-0" />

        <button
          onClick={handleChangeEstacionamiento}
          className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 bg-surface-card text-[10px] font-bold uppercase tracking-wider text-ink-muted hover:bg-surface-muted hover:text-brand transition-colors shrink-0"
        >
          <RefreshCcw size={11} />
          Cambiar Sucursal
        </button>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate("/configuracion/perfil")}
          className="hidden sm:block text-[13px] font-bold text-ink hover:text-brand transition-colors whitespace-nowrap"
          aria-label="Mi perfil"
          title="Mi perfil"
        >
          {nombreCompleto || "Mi perfil"}
        </button>
        <time
          dateTime={ahora.toISOString()}
          className="hidden sm:block text-[12px] font-semibold text-ink-muted tabular-nums whitespace-nowrap"
        >
          {fechaSistema} {horaSistema}
        </time>

        <div className="hidden sm:block h-5 w-px bg-line-subtle mx-1" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 py-1.5 px-3 text-[11px] font-semibold text-ink-faint hover:bg-danger-muted/80 hover:text-danger transition-all group"
          aria-label="Cerrar sesión"
        >
          <LogOut
            size={15}
            className="transition-all duration-200 group-hover:text-danger group-hover:translate-x-0.5"
          />
          <span className="hidden sm:inline tracking-tight">Cerrar Sesión</span>
        </button>
      </div>
    </header>
  );
}
