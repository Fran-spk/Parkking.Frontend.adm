import { NavLink, useNavigate } from "react-router-dom";
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
  LogOut
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

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

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
        {/* Logo Corporativo */}
        <div className="flex items-center justify-between px-6 py-6.5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/10">
              <ParkingSquare size={19} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-black text-gray-900 leading-none tracking-tight">Parkking</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">Gestión Central</p>
            </div>
          </div>

          {/* Cerrar en mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <X size={16} />
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
        <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/20 space-y-4">
          <NavLink
            to="/configuracion"
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
                <Settings
                  size={17}
                  className={`transition-colors duration-200 group-hover:rotate-45 transition-transform ${isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                    }`}
                />
                <span className="tracking-tight">Configuración</span>
              </>
            )}
          </NavLink>

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