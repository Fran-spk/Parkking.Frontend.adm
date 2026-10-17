import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
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
  Layers,
  GitBranch,
  List,
  Scale,
  Banknote,
  Map,
  ParkingSquare,
  CalendarClock,
  Clock,
  History,
  Search,
  Receipt,
  FileBarChart,
  UserCog,
  User,
  Mail,
  Shield,
} from "lucide-react";
import { ACCIONES, permisosStore } from "../../utils/permisosStore";

const sections = [
  {
    title: "Rotativo",
    links: [
      { to: "/rotativo", label: "Ingreso y salida", icon: Clock, end: true },
      { to: "/rotativo/historico", label: "Estadías", icon: History },
    ],
  },
  {
    title: "Estacionamiento",
    links: [
      { to: "/cocheras", label: "Cocheras", icon: ParkingSquare, anyOf: [ACCIONES.VerCocheras, ACCIONES.AdministrarCocheras] },
      { to: "/clientes", label: "Clientes", icon: Users, anyOf: [ACCIONES.VerClientes] },
      { to: "/abonos", label: "Abonos", icon: Car, anyOf: [ACCIONES.VerAbonos] },
      { to: "/reservas", label: "Reservas", icon: CalendarClock, anyOf: [ACCIONES.VerReservas] },
    ],
  },
  {
    title: "Operaciones diarias",
    links: [
      { to: "/buscar-patente", label: "Buscar patente", icon: Search, anyOf: [ACCIONES.VerAbonos] },
      { to: "/pagos-pendientes", label: "Pagos pendientes", icon: Clock, anyOf: [ACCIONES.VerPagos, ACCIONES.Cobrar] },
      { to: "/pagos", label: "Pagos", icon: CreditCard, anyOf: [ACCIONES.VerPagos, ACCIONES.Cobrar] },
      { to: "/recibos", label: "Recibos", icon: Receipt, anyOf: [ACCIONES.VerPagos] },
    ],
  },
  {
    title: "Finanzas",
    links: [
      { to: "/cuenta-corriente", label: "Cuenta corriente", icon: Wallet, anyOf: [ACCIONES.VerMovimientos] },
      { to: "/movimientos", label: "Movimientos", icon: List, anyOf: [ACCIONES.VerMovimientos] },
      { to: "/ajustes", label: "Ajustes", icon: Scale, anyOf: [ACCIONES.RegistrarAjustes] },
      { to: "/gastos", label: "Gastos", icon: Banknote, anyOf: [ACCIONES.RegistrarGastos] },
      { to: "/grupos-financieros", label: "Grupos financieros", icon: Layers, anyOf: [ACCIONES.AdministrarGruposFinancieros] },
    ],
  },
  {
    title: "Reportes",
    links: [
      { to: "/reportes", label: "Reportes", icon: FileBarChart, anyOf: [ACCIONES.VerDashboard, ACCIONES.ExportarReportes] },
      { to: "/mensajes-enviados", label: "Mensajes enviados", icon: Mail, anyOf: [ACCIONES.VerAbonos, ACCIONES.VerPagos] },
    ],
  },
];

const CONFIG_ITEMS = [
  { to: "/configuracion/perfil", label: "Mi perfil", icon: User },
  { to: "/configuracion/general", label: "Datos del estacionamiento", icon: SlidersHorizontal, anyOf: [ACCIONES.EditarEstacionamiento, ACCIONES.ConfigurarReservas, ACCIONES.AdministrarTiposDeGasto] },
  { to: "/configuracion/tarifas", label: "Tarifas", icon: DollarSign, anyOf: [ACCIONES.VerTarifas, ACCIONES.AdministrarTarifas] },
  { to: "/configuracion/tarifas-estadia", label: "Tarifas de estadía", icon: DollarSign },
  { to: "/configuracion/general?tab=rotativo", label: "Zonas de rotativo", icon: Map },
  { to: "/configuracion/reglas-asignacion", label: "Reglas de asignación", icon: GitBranch, anyOf: [ACCIONES.AdministrarReglasAsignacion] },
  { to: "/configuracion/grupos", label: "Grupos de seguridad", icon: Shield, anyOf: [ACCIONES.AdministrarGrupos] },
  { to: "/configuracion/usuarios", label: "Usuarios y accesos", icon: UserCog, anyOf: [ACCIONES.VerUsuarios, ACCIONES.AsignarPermisos] },
];

function linkVisible(link) {
  if (!link.anyOf?.length) return true;
  return permisosStore.tieneAlgun(...link.anyOf);
}

export default function Sidebar({ open }) {
  const location = useLocation();
  const permisosVersion = useSyncExternalStore(permisosStore.subscribe, permisosStore.getSnapshot);

  const isConfigRoute = location.pathname.startsWith("/configuracion");
  const [isConfigOpen, setIsConfigOpen] = useState(isConfigRoute);

  useEffect(() => {
    if (isConfigRoute) setIsConfigOpen(true);
  }, [location.pathname, isConfigRoute]);

  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          links: section.links.filter(linkVisible),
        }))
        .filter((s) => s.links.length > 0),
    [permisosVersion]
  );

  const visibleConfig = useMemo(
    () => CONFIG_ITEMS.filter(linkVisible),
    [permisosVersion]
  );

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
          {visibleSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-ink-faint uppercase tracking-[0.14em] px-3 mb-2.5">
                {section.title}
              </h4>

              <div className="space-y-0.5">
                {section.links.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/" || !!end}
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

        {visibleConfig.length > 0 && (
          <div className="px-3 py-3.5 border-t border-line-subtle">
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
              {visibleConfig.map(({ to, label, icon: Icon }) => {
                const path = to.split("?")[0];
                const tab = new URLSearchParams(to.split("?")[1] || "").get("tab");
                const activo =
                  location.pathname === path &&
                  (tab
                    ? new URLSearchParams(location.search).get("tab") === tab
                    : path !== "/configuracion/general" || !new URLSearchParams(location.search).get("tab") || new URLSearchParams(location.search).get("tab") === "general");
                return (
                <NavLink
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 py-2 px-3 rounded-none text-[12px] transition-all group ${
                    activo
                      ? "bg-brand-muted text-brand font-bold border-l-[3px] border-brand pl-2"
                      : "text-ink-muted hover:bg-surface-muted/70 hover:text-ink"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={activo ? 2.25 : 1.85}
                    className={`shrink-0 transition-colors duration-200 ${
                      activo ? "text-brand" : "text-ink-faint group-hover:text-ink-muted"
                    }`}
                  />
                  <span className="tracking-tight leading-none">{label}</span>
                </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
