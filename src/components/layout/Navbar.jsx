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
  const userInitial = user?.nombre?.charAt(0).toUpperCase() || "U";

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
          <div className="w-8 h-8 bg-ink text-white flex items-center justify-center shrink-0 group-hover:bg-brand transition-colors">
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

      <div className="flex items-center gap-1.5 shrink-0">
        {user && (
          <button
            onClick={() => navigate("/configuracion/perfil")}
            className="hidden sm:flex items-center gap-2 pr-1 py-1 px-2 hover:bg-surface-muted transition-all group"
            aria-label="Mi Perfil"
          >
            <div className="w-7 h-7 rounded-full bg-brand-muted text-brand font-black text-xs flex items-center justify-center group-hover:bg-brand-soft transition-colors">
              {userInitial}
            </div>
            <span className="text-[11px] font-bold text-ink group-hover:text-brand truncate max-w-[120px] transition-colors">
              {user.nombre}
            </span>
          </button>
        )}

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
