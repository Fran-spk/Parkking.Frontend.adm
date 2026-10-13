import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { estacionamientoService } from "../../services/estacionamientoService";
import { authService } from "../../services/authService";
import { applyColorMarca } from "../../theme/parkking.theme.js";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    estacionamientoService
      .get()
      .then((data) => applyColorMarca(data?.colorMarca))
      .catch(() => {});

    (async () => {
      try {
        const me = await authService.me();
        if (cancelled) return;
        // Sin tenant válido: volver al selector
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

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-surface-page">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <main
        className={`transition-all duration-300 ease-in-out px-4 pb-4 lg:px-8 lg:pb-8 pt-16 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
