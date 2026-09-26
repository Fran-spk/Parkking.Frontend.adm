import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Calendar,
  TrendingUp,
  Map,
  AlertCircle,
  LayoutDashboard,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import HomeProfileHeader from "../components/layout/HomeProfileHeader";
import HomeAbonosFeed from "../components/layout/HomeAbonosFeed";
import KpiCards from "../components/layout/KpiCards";
import CocherasGrid from "../components/layout/CocherasGrid";
import AlertasDeudores from "../components/layout/AlertasDeudores";
import GraficoIngresos from "../components/layout/GraficoIngresos";
import GraficoVehiculos from "../components/layout/GraficoVehiculos";
import { dashboardService } from "../services/dashboardService";
import { pagoService } from "../services/pagoService";

/** @typedef {import("../types").Dashboard} Dashboard */

/** Primer y último día del mes calendario actual (YYYY-MM-DD). */
function currentMonthRangeYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const last = new Date(y, d.getMonth() + 1, 0).getDate();
  return {
    desde: `${y}-${m}-01`,
    hasta: `${y}-${m}-${String(last).padStart(2, "0")}`,
  };
}

function readEstacionamiento() {
  try {
    const raw = localStorage.getItem("parkking_estacionamiento");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(/** @type {Dashboard | null} */ (null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState("");
  const [ingresosMes, setIngresosMes] = useState(0);
  const [pagosPendientes, setPagosPendientes] = useState(0);
  const [estacionamiento, setEstacionamiento] = useState(readEstacionamiento);
  const [mostrarClasico, setMostrarClasico] = useState(false);

  useEffect(() => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const today = new Date().toLocaleDateString("es-ES", options);
    setCurrentDate(today.charAt(0).toUpperCase() + today.slice(1));

    const { desde, hasta } = currentMonthRangeYmd();

    Promise.all([
      dashboardService.getSummary(),
      pagoService.getAll(desde, hasta).catch(() => []),
      pagoService.getPendientes().catch(() => []),
    ])
      .then(([res, pagosMes, pendientes]) => {
        const cleanData = res?.data ? res.data : res;
        setData(cleanData);

        const lista = Array.isArray(pagosMes) ? pagosMes : [];
        const sumaPagos = lista.reduce((acc, p) => {
          const monto = Number(p.monto ?? p.montoTotal ?? 0);
          const recargo = Number(p.recargo ?? 0);
          return acc + monto + recargo;
        }, 0);
        const desdeDashboard = Number(
          cleanData?.detalleIngresos?.totalRecaudadoMensualReal ?? 0
        );
        setIngresosMes(sumaPagos || desdeDashboard);
        setPagosPendientes(Array.isArray(pendientes) ? pendientes.length : 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error capturado en getSummary:", err);
        const payload = err.response?.data;
        const msg =
          typeof payload === "string"
            ? payload
            : payload?.title || payload?.message || err.message || "Error inesperado al cargar los datos.";
        setError(msg);
        setLoading(false);
      });

    const onEst = () => setEstacionamiento(readEstacionamiento());
    window.addEventListener("estacionamiento_changed", onEst);
    return () => window.removeEventListener("estacionamiento_changed", onEst);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-danger mb-3" />
        <h3 className="text-xl font-bold text-ink">Error de conexión</h3>
        <p className="text-sm text-ink-muted mb-4">{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground font-medium rounded-xl hover:bg-brand-strong transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
        <button
          onClick={() => (window.location.href = "/seleccion-estacionamientos")}
          className="mt-3 text-sm font-semibold text-brand hover:text-brand-strong"
        >
          Elegir estacionamiento
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-4">
        <div className="w-16 h-16 border-4 border-brand-soft border-t-brand rounded-full animate-spin" />
        <div>
          <h3 className="text-xl font-bold text-ink">Cargando mi estacionamiento</h3>
          <p className="text-sm text-ink-muted">Obteniendo métricas en tiempo real...</p>
        </div>
      </div>
    );
  }

  const nombre =
    estacionamiento?.nombre || estacionamiento?.Nombre || "Mi estacionamiento";
  const direccion = estacionamiento?.direccion || estacionamiento?.Direccion || "";

  return (
    <div className="min-h-screen bg-surface-page py-2 px-1 lg:px-4 space-y-4 text-ink">
      {/* ——— Home Instagram-style (nuevo) ——— */}
      <HomeProfileHeader
        nombre={nombre}
        direccion={direccion}
        ingresosMes={ingresosMes}
        abonosActivos={data?.cantidadAbonosActivos ?? 0}
        ocupacionPct={data?.porcentajeOcupacion ?? 0}
        pagosPendientes={pagosPendientes}
      />

      <HomeAbonosFeed
        alertas={data?.alertasDeudores ?? []}
        estadoCocheras={data?.estadoCocheras ?? []}
      />

      {/* ——— Dashboard clásico (conservado) ——— */}
      <div className="bg-white">
        <button
          type="button"
          onClick={() => setMostrarClasico((v) => !v)}
          className="w-full px-4 sm:px-6 py-3 flex items-center justify-between text-left hover:bg-surface-muted/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-brand" />
            <span className="text-sm font-bold text-ink">Vista detallada</span>
            <span className="text-[11px] text-ink-muted font-medium">KPIs · mapa · gráficos</span>
          </div>
          <ChevronDown
            size={18}
            className={`text-ink-faint transition-transform ${mostrarClasico ? "rotate-180" : ""}`}
          />
        </button>

        {mostrarClasico && (
          <div className="px-1 sm:px-4 pb-6 pt-4 space-y-8">
            <div className="flex justify-between items-center bg-white p-4 sm:p-6">
              <div>
                <div className="text-xs text-brand font-bold flex items-center gap-2 uppercase tracking-wider">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Vista general
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight mt-1">Mi estacionamiento</h2>
              </div>

              <div className="text-sm font-medium text-ink-muted flex items-center gap-2 bg-brand-muted px-4 py-2">
                <Calendar className="w-4 h-4 text-brand" />
                {currentDate}
              </div>
            </div>

            <KpiCards data={data} />

            <div className="bg-white border border-transparent p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold flex items-center gap-2 text-ink">
                  <AlertCircle className="w-5 h-5 text-danger" />
                  Alertas de Cobro
                </h2>

                {data?.alertasDeudores?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-danger-muted text-danger-ink px-3 py-1">
                      {data.alertasDeudores.length} pendientes
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate("/pagos-pendientes")}
                      className="text-xs font-bold text-brand hover:text-brand-strong"
                    >
                      Ver todos
                    </button>
                  </div>
                )}
              </div>

              <AlertasDeudores alertas={data?.alertasDeudores ?? []} />
            </div>

            <div className="bg-white border border-transparent p-6">
              <div className="flex items-center gap-2 mb-4">
                <Map className="w-5 h-5 text-brand" />
                <h2 className="font-bold text-ink">Mapa de Cocheras</h2>
              </div>

              <CocherasGrid estadoCocheras={data?.estadoCocheras ?? []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-transparent p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-brand" />
                  <h2 className="font-bold text-ink">Evolución de Ingresos</h2>
                </div>

                <GraficoIngresos datos={data?.graficoIngresos ?? []} />
              </div>

              <div className="bg-white border border-transparent p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-brand" />
                  <h2 className="font-bold text-ink">Vehículos</h2>
                </div>

                <GraficoVehiculos datos={data?.distribucionVehiculos ?? []} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
