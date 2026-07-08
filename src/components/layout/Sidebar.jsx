import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  CreditCard,
  Wallet,
  Settings,
  ParkingSquare,
  X,
  TrendingUp,
  LogOut,
  RefreshCcw,
  Map,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  SlidersHorizontal,
  DollarSign
} from "lucide-react";
import { authService } from "../../services/authService";

// Agrupamos los enlaces en secciones para lograr una jerarquía minimalista y profesional
const sections = [
  {
    title: "Operaciones",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/cocheras", label: "Cocheras", icon: ParkingSquare },
      { to: "/clientes", label: "Clientes", icon: Users },
      { to: "/plano-cochera", label: "Plano Estacionamiento", icon: Map },
    ]
  },
  {
    title: "Finanzas",
    links: [
      { to: "/abonos", label: "Abonos", icon: Car },
      { to: "/pagos", label: "Pagos", icon: CreditCard },
      { to: "/caja", label: "Caja", icon: Wallet },
    ]
  }
];

const CONFIG_ITEMS = [
  { to: "/configuracion/perfil", label: "Mi Perfil", icon: User },
  { to: "/configuracion/categorias", label: "Categorías de Cochera", icon: Building },
  { to: "/configuracion/tipos-vehiculo", label: "Tipos de Vehículo", icon: Car },
  { to: "/configuracion/tarifas", label: "Tarifas Mensuales", icon: DollarSign },
  { to: "/configuracion/general", label: "Parámetros Generales", icon: SlidersHorizontal },
];

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const [estacionamiento, setEstacionamiento] = useState(null);

  const isConfigRoute = location.pathname.startsWith("/configuracion");
  const [isConfigOpen, setIsConfigOpen] = useState(isConfigRoute);

  useEffect(() => {
    const stored = localStorage.getItem("parkking_estacionamiento");
    if (stored) {
      try {
        setEstacionamiento(JSON.parse(stored));
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (isConfigRoute) {
      setIsConfigOpen(true);
    }
  }, [location.pathname, isConfigRoute]);

  useEffect(() => {
    const handleEstacionamientoChange = () => {
      const stored = localStorage.getItem("parkking_estacionamiento");
      if (stored) {
        try {
          setEstacionamiento(JSON.parse(stored));
        } catch(e) {}
      }
    };
    window.addEventListener("estacionamiento_changed", handleEstacionamientoChange);
    return () => {
      window.removeEventListener("estacionamiento_changed", handleEstacionamientoChange);
    };
  }, []);

  const handleChangeEstacionamiento = () => {
    navigate("/seleccion-estacionamientos");
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-100/90
        flex flex-col z-30 transition-transform duration-300 ease-in-out
        shadow-[4px_0_24px_rgba(0,0,0,0.01)]
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}>
        {/* Estacionamiento Activo */}
        <div className="flex flex-col px-5 py-5 border-b border-gray-50 bg-slate-50/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 overflow-hidden">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10 shrink-0">
                <ParkingSquare size={19} className="text-white" />
              </div>
              <div className="flex flex-col pr-2 overflow-hidden">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-gray-900 leading-tight truncate">
                    {estacionamiento ? (estacionamiento.nombre || estacionamiento.Nombre) : "Parkking"}
                  </span>
                </div>
                <p 
                  className="text-[10px] font-medium text-gray-500 mt-0.5 truncate" 
                  title={estacionamiento ? (estacionamiento.direccion || estacionamiento.Direccion) : "Gestión Central"}
                >
                  {estacionamiento ? (estacionamiento.direccion || estacionamiento.Direccion) : "Gestión Central"}
                </p>
              </div>
            </div>

            {/* Cerrar en mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 -mr-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
          
          <button 
            onClick={handleChangeEstacionamiento}
            className="mt-4 flex items-center justify-center gap-1.5 w-full py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <RefreshCcw size={12} />
            Cambiar Sucursal
          </button>
        </div>

        {/* Listado de Enlaces (Navegación) */}
        <nav className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              {/* Encabezado de Sección Minimalista */}
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">
                {section.title}
              </h4>

              <div className="space-y-1">
                {section.links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-2.5 rounded-xl text-xs transition-all group ${isActive
                        ? "bg-indigo-50/50 text-indigo-600 font-bold border-l-2 border-indigo-600 rounded-r-none pl-2.5"
                        : "text-gray-400 hover:bg-slate-50/60 hover:text-gray-800 pl-3"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={17}
                          className={`transition-colors duration-200 group-hover:scale-105 transition-transform ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                            }`}
                        />
                        <span className="tracking-tight">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Panel de Configuración y Usuario en el Footer */}
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/20 space-y-3">
          {/* Botón Configuración */}
          <div>
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`w-full flex items-center justify-between py-2.5 rounded-xl text-xs transition-all group pl-3 pr-2.5 ${
                isConfigRoute
                  ? "bg-indigo-50/50 text-indigo-600 font-bold"
                  : "text-gray-400 hover:bg-slate-50/60 hover:text-gray-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings
                  size={17}
                  className={`transition-colors duration-200 group-hover:rotate-45 transition-transform ${
                    isConfigRoute ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                <span className="tracking-tight font-semibold">Configuración</span>
              </div>
              <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                {isConfigOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {/* Submenú de Configuración */}
            <div className={`mt-1 pl-4 space-y-1 overflow-hidden transition-all duration-300 ${
              isConfigOpen ? "max-h-60 opacity-100 py-1" : "max-h-0 opacity-0 pointer-events-none"
            }`}>
              {CONFIG_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 py-2 px-3 rounded-lg text-[11px] transition-all group ${
                      isActive
                        ? "bg-indigo-50/55 text-indigo-600 font-bold border-l-2 border-indigo-600 rounded-r-none pl-2"
                        : "text-gray-400 hover:bg-slate-50/60 hover:text-gray-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={14}
                        className={`transition-colors duration-200 ${
                          isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      />
                      <span className="tracking-tight">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Información del Usuario y Logout */}
          {user && (
            <div className="pt-4 border-t border-gray-100/80 flex flex-col gap-3">
              <div className="flex items-center gap-2.5 px-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center border border-indigo-100">
                  {user.nombre?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">{user.nombre}</p>
                  <p className="text-[9px] font-semibold text-gray-400 truncate mt-0.5">{user.mail}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-xs text-gray-400 hover:bg-rose-50/80 hover:text-rose-600 transition-all duration-200 group"
              >
                <LogOut
                  size={17}
                  className="text-gray-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all duration-200"
                />
                <span className="tracking-tight font-medium">Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}