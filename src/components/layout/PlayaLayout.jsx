import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Clock, LogOut, MoreHorizontal, RefreshCcw, Search, Smartphone, User, Wallet, LayoutGrid, Download, Share } from "lucide-react";
import { authService } from "../../services/authService";
import { estacionamientoService } from "../../services/estacionamientoService";
import { applyColorMarca } from "../../theme/parkking.theme.js";
import { esIos, esStandalone, setPrefierePlaya } from "../../utils/playa";

const TABS = [
  { to: "/playa", label: "Ingreso", icon: Clock, end: true },
  { to: "/playa/buscar", label: "Buscar", icon: Search },
  { to: "/playa/cobrar", label: "Cobrar", icon: Wallet },
];

export default function PlayaLayout() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [sucursal, setSucursal] = useState("");
  const [puedeCambiar, setPuedeCambiar] = useState(false);
  const [ahora, setAhora] = useState(() => new Date());
  const [instalar, setInstalar] = useState(null);

  useEffect(() => {
    setPrefierePlaya(true);
    (async () => {
      try {
        const me = await authService.me();
        if (!me?.permisos && !localStorage.getItem("parkking_estacionamiento")) {
          await estacionamientoService.entrar(navigate);
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          await authService.logout();
          navigate("/login", { replace: true });
        }
      }
    })();
    estacionamientoService.get().then((data) => applyColorMarca(data?.colorMarca)).catch(() => {});
    const stored = localStorage.getItem("parkking_estacionamiento");
    if (stored) {
      try {
        const est = JSON.parse(stored);
        setSucursal(est.nombre || est.Nombre || "");
      } catch {
        /* ignore */
      }
    }
    estacionamientoService
      .getEstacionamientos()
      .then((lista) => setPuedeCambiar(Array.isArray(lista) && lista.length > 1))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (esStandalone()) return undefined;
    function onPrompt(e) {
      e.preventDefault();
      setInstalar(() => e);
    }
    function onInstalled() {
      setInstalar(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const hora = ahora.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  async function instalarApp() {
    if (!instalar) return;
    instalar.prompt();
    await instalar.userChoice;
    setInstalar(null);
    setMenu(false);
  }

  function irPanel() {
    setPrefierePlaya(false);
    setMenu(false);
    navigate("/mi-estacionamiento");
  }

  async function logout() {
    await authService.logout();
    navigate("/login");
  }

  return (
    <div className="min-h-dvh bg-surface-page flex flex-col">
      <header className="sticky top-0 z-20 bg-brand text-brand-foreground h-12 px-3 flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-foreground text-brand flex items-center justify-center shrink-0">
          <span className="text-xs font-black leading-none">P</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold truncate leading-tight">{sucursal || "Parkking"}</p>
          <p className="text-[10px] font-semibold tabular-nums opacity-80 leading-tight">{hora}</p>
        </div>
        <button
          type="button"
          className="p-2 text-brand-foreground"
          aria-label="Más"
          aria-expanded={menu}
          onClick={() => setMenu((v) => !v)}
        >
          <MoreHorizontal size={20} />
        </button>
      </header>

      {menu && (
        <div className="fixed inset-0 z-30" onClick={() => setMenu(false)}>
          <div
            className="absolute right-2 top-12 w-56 bg-surface-card border border-line-strong"
            onClick={(e) => e.stopPropagation()}
          >
            {instalar && (
              <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-surface-muted" onClick={instalarApp}>
                <Download size={16} /> Instalar app
              </button>
            )}
            {esIos() && !esStandalone() && (
              <p className="px-3 py-2.5 pk-caption text-ink-muted flex items-start gap-2">
                <Share size={14} className="mt-0.5 shrink-0" />
                En iPhone: Compartir → Agregar a inicio
              </p>
            )}
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-surface-muted" onClick={irPanel}>
              <LayoutGrid size={16} /> Panel completo
            </button>
            {puedeCambiar && (
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-surface-muted"
                onClick={() => {
                  setMenu(false);
                  navigate("/seleccion-estacionamientos");
                }}
              >
                <RefreshCcw size={16} /> Cambiar sucursal
              </button>
            )}
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-surface-muted"
              onClick={() => {
                setMenu(false);
                navigate("/configuracion/perfil");
              }}
            >
              <User size={16} /> Mi perfil
            </button>
            <button type="button" className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-surface-muted border-t border-line" onClick={logout}>
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {instalar && (
        <div className="px-3 py-2 bg-brand-muted flex items-center gap-2">
          <Smartphone size={16} className="text-brand shrink-0" />
          <p className="pk-caption flex-1 text-ink">Instalá Parkking en el teléfono, como una app.</p>
          <button type="button" className="text-xs font-bold text-brand" onClick={instalarApp}>
            Instalar
          </button>
        </div>
      )}

      <main className="flex-1 px-3 pt-3 pb-[calc(4.25rem+env(safe-area-inset-bottom))] overflow-x-hidden">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 z-20 bg-surface-card border-t border-line-strong flex"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Playa"
      >
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={!!end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                isActive ? "text-brand" : "text-ink-faint"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.25 : 1.85} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
