import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  ParkingSquare,
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

  const nombre = estacionamiento?.nombre || estacionamiento?.Nombre || "Parkking";
  const direccion = estacionamiento?.direccion || estacionamiento?.Direccion || "Gestión Central";
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
          className="p-1.5 -ml-1 rounded-lg text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors shrink-0"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        <div className="w-8 h-8 bg-gradient-to-tr from-brand-strong to-brand rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <ParkingSquare size={16} className="text-brand-foreground" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-black text-ink leading-tight truncate">{nombre}</span>
          <span className="text-[10px] font-medium text-ink-faint truncate" title={direccion}>
            {direccion}
          </span>
        </div>

        <div className="hidden sm:block h-6 w-px bg-line-subtle mx-1 shrink-0" />

        <button
          onClick={handleChangeEstacionamiento}
          className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 bg-surface-card border border-line rounded-lg text-[10px] font-bold uppercase tracking-wider text-ink-muted hover:bg-surface-muted hover:text-brand transition-colors shadow-sm shrink-0"
        >
          <RefreshCcw size={11} />
          Cambiar Sucursal
        </button>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {user && (
          <button
            onClick={() => navigate("/configuracion/perfil")}
            className="hidden sm:flex items-center gap-2 pr-1 py-1 px-2 rounded-lg hover:bg-surface-muted transition-all group"
            aria-label="Mi Perfil"
          >
            <div className="w-7 h-7 rounded-full bg-brand-muted text-brand font-black text-xs flex items-center justify-center border border-brand-soft group-hover:bg-brand-soft transition-colors">
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
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-semibold text-ink-faint hover:bg-danger-muted/80 hover:text-danger transition-all group"
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
