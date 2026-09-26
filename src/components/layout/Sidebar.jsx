import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Car,
  Users,
  CreditCard,
  Wallet,
  Settings,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  DollarSign,
  Tags,
  Layers,
  GitBranch,
  List,
  Scale,
  Banknote,
  ParkingSquare,
  Clock,
  Search,
  Receipt,
  FileBarChart,
  UserCog,
  Mail,
} from "lucide-react";

const sections = [
  {
    title: "Operaciones",
    links: [
      { to: "/cocheras", label: "Cocheras", icon: ParkingSquare },
      { to: "/clientes", label: "Clientes", icon: Users },
      { to: "/pagos-pendientes", label: "Pagos pendientes", icon: Clock },
      { to: "/buscar-patente", label: "Buscar patente", icon: Search },
    ],
  },
  {
    title: "Finanzas",
    links: [
      { to: "/abonos", label: "Abonos", icon: Car },
      { to: "/pagos", label: "Pagos", icon: CreditCard },
      { to: "/cuenta-corriente", label: "Cuenta corriente", icon: Wallet },
      { to: "/grupos-financieros", label: "Grupos financieros", icon: Layers },
      { to: "/movimientos", label: "Movimientos", icon: List },
      { to: "/ajustes", label: "Ajustes", icon: Scale },
      { to: "/gastos", label: "Gastos", icon: Banknote },
      { to: "/recibos", label: "Recibos", icon: Receipt },
    ],
  },
  {
    title: "Reportes",
    links: [
      { to: "/reportes", label: "Reportes", icon: FileBarChart },
      { to: "/mensajes-enviados", label: "Mensajes enviados", icon: Mail },
    ],
  },
];

const CONFIG_ITEMS = [
  { to: "/configuracion/general", label: "Datos del estacionamiento", icon: SlidersHorizontal },
  { to: "/configuracion/tarifas", label: "Tarifas", icon: DollarSign },
  { to: "/configuracion/tipos-gasto", label: "Tipos de gasto", icon: Tags },
  { to: "/configuracion/reglas-asignacion", label: "Reglas de asignación", icon: GitBranch },
  { to: "/configuracion/usuarios", label: "Usuarios y accesos", icon: UserCog },
];

export default function Sidebar({ open }) {
  const location = useLocation();

  const isConfigRoute = location.pathname.startsWith("/configuracion");
  const [isConfigOpen, setIsConfigOpen] = useState(isConfigRoute);

  useEffect(() => {
    if (isConfigRoute) setIsConfigOpen(true);
  }, [location.pathname, isConfigRoute]);

  return (
    <>
      <aside
        className={`
          fixed top-14 left-0 h-[calc(100vh-3.5rem)] w-64 bg-surface-card border-r border-line-subtle
          flex flex-col z-10 transition-transform duration-300 ease-in-out
          shadow-pk-soft
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-ink-faint uppercase tracking-[0.14em] px-3 mb-2.5">
                {section.title}
              </h4>

              <div className="space-y-0.5">
                {section.links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 py-2.5 rounded-none text-[13px] transition-all group ${
                        isActive
                          ? "bg-brand-muted text-brand font-bold border-l-[3px] border-brand pl-2.5"
                          : "text-ink-muted hover:bg-surface-muted/70 hover:text-ink pl-3"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={20}
                          strokeWidth={isActive ? 2.25 : 1.85}
                          className={`shrink-0 duration-200 group-hover:scale-105 transition-transform ${
                            isActive ? "text-brand" : "text-ink-faint group-hover:text-ink-muted"
                          }`}
                        />
                        <span className="tracking-tight leading-none">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 py-3.5 border-t border-line-subtle bg-surface-muted/25">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`w-full flex items-center justify-between py-2.5 rounded-none text-[13px] transition-all group pl-3 pr-2.5 ${
              isConfigRoute
                ? "bg-brand-muted text-brand font-bold"
                : "text-ink-muted hover:bg-surface-muted/70 hover:text-ink"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Settings
                size={20}
                strokeWidth={isConfigRoute ? 2.25 : 1.85}
                className={`shrink-0 duration-200 group-hover:rotate-45 transition-transform ${
                  isConfigRoute ? "text-brand" : "text-ink-faint group-hover:text-ink-muted"
                }`}
              />
              <span className="tracking-tight font-semibold leading-none">Configuración</span>
            </div>
            <div className="text-ink-faint group-hover:text-ink-muted transition-colors">
              {isConfigOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          <div
            className={`mt-1 pl-3 space-y-0.5 overflow-hidden transition-all duration-300 ${
              isConfigOpen ? "max-h-[40rem] opacity-100 py-1" : "max-h-0 opacity-0 pointer-events-none"
            }`}
          >
            {CONFIG_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2 px-3 rounded-none text-[12px] transition-all group ${
                    isActive
                      ? "bg-brand-muted text-brand font-bold border-l-[3px] border-brand pl-2"
                      : "text-ink-muted hover:bg-surface-muted/70 hover:text-ink"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={17}
                      strokeWidth={isActive ? 2.25 : 1.85}
                      className={`shrink-0 transition-colors duration-200 ${
                        isActive ? "text-brand" : "text-ink-faint group-hover:text-ink-muted"
                      }`}
                    />
                    <span className="tracking-tight leading-none">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
