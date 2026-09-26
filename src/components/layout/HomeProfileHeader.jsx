import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  DollarSign,
  MapPin,
  MoreHorizontal,
  SlidersHorizontal,
  UserCog,
} from "lucide-react";

function formatCompact(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace(/\.0$/, "")}mil`;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v);
}

function initials(name) {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

const CONFIG_ITEMS = [
  { to: "/configuracion/general", label: "Datos del estacionamiento", icon: SlidersHorizontal },
  { to: "/configuracion/tarifas", label: "Tarifas", icon: DollarSign },
  { to: "/configuracion/usuarios", label: "Usuarios y accesos", icon: UserCog },
];

/**
 * Cabecera estilo perfil (Instagram) del estacionamiento.
 */
export default function HomeProfileHeader({
  nombre,
  direccion,
  ingresosMes,
  abonosActivos,
  ocupacionPct,
  pagosPendientes = 0,
}) {
  const navigate = useNavigate();
  const label = nombre || "Mi estacionamiento";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <section className="bg-white relative">
      {/* Menú ··· configuración — esquina superior derecha */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20" ref={menuRef}>
        <button
          type="button"
          aria-label="Configuración"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="w-9 h-9 flex items-center justify-center text-ink hover:bg-surface-muted transition-colors"
        >
          <MoreHorizontal size={22} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-56 bg-white shadow-pk-modal overflow-hidden">
            <p className="px-3.5 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Configuración
            </p>
            {CONFIG_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(item.to);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-semibold text-ink hover:bg-surface-muted transition-colors"
                >
                  <Icon size={16} className="text-ink-muted shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 pb-4 sm:px-6 pr-12 sm:pr-14">
        <div className="flex items-start gap-5 sm:gap-8">
          <div className="shrink-0">
            <div className="p-[3px] rounded-full bg-gradient-to-tr from-brand via-ink-muted to-brand-soft">
              <div className="w-[78px] h-[78px] sm:w-[92px] sm:h-[92px] rounded-full bg-white p-[3px]">
                <div className="w-full h-full rounded-full bg-brand text-brand-foreground flex items-center justify-center text-2xl sm:text-3xl font-black tracking-tight">
                  {initials(label)}
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-[22px] sm:text-2xl font-bold text-ink tracking-tight truncate">
              {label}
            </h1>
            {direccion ? (
              <p className="mt-0.5 text-xs text-ink-muted flex items-center gap-1 truncate">
                <MapPin size={12} className="shrink-0 opacity-70" />
                {direccion}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3 sm:gap-x-8">
              <button
                type="button"
                onClick={() => navigate("/reportes")}
                className="text-left group"
                title="Ver reportes"
              >
                <p className="text-[17px] sm:text-lg font-extrabold text-ink tabular-nums leading-none group-hover:text-brand transition-colors">
                  {formatCompact(ingresosMes)}
                </p>
                <p className="text-[11px] text-ink-muted mt-1 font-medium">ingresos del mes</p>
              </button>

              <button
                type="button"
                onClick={() => navigate("/abonos")}
                className="text-left group"
                title="Ver abonos"
              >
                <p className="text-[17px] sm:text-lg font-extrabold text-ink tabular-nums leading-none group-hover:text-brand transition-colors">
                  {Number(abonosActivos) || 0}
                </p>
                <p className="text-[11px] text-ink-muted mt-1 font-medium">abonos</p>
              </button>

              <div className="text-left">
                <p className="text-[17px] sm:text-lg font-extrabold text-ink tabular-nums leading-none">
                  {Number(ocupacionPct) || 0}%
                </p>
                <p className="text-[11px] text-ink-muted mt-1 font-medium">ocupación</p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/pagos-pendientes")}
                className="text-left group"
                title="Pagos pendientes"
              >
                <p className="text-[17px] sm:text-lg font-extrabold text-ink tabular-nums leading-none group-hover:text-brand transition-colors">
                  {Number(pagosPendientes) || 0}
                </p>
                <p className="text-[11px] text-ink-muted mt-1 font-medium">pagos pendientes</p>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/reportes")}
          className="mt-5 w-full flex items-center gap-3 px-3.5 py-3 bg-surface-muted text-left hover:bg-brand-muted/60 transition-colors"
        >
          <div className="w-9 h-9 bg-ink text-white flex items-center justify-center shrink-0">
            <BarChart3 size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">Estadísticas del mes</p>
            <p className="text-[11px] text-ink-muted truncate">
              Abrí reportes · ingresos, pagos y actividad
            </p>
          </div>
          <ChevronRight size={18} className="text-ink-faint shrink-0" />
        </button>
      </div>
    </section>
  );
}
