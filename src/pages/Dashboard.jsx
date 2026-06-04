import React, { useEffect, useState } from 'react';
import {
  Activity,
  Calendar,
  TrendingUp,
  Map,
  AlertCircle,
  LayoutDashboard,
  RefreshCw
} from 'lucide-react';

import KpiCards from '../components/layout/KpiCards';
import CocherasGrid from '../components/layout/CocherasGrid';
import AlertasDeudores from '../components/layout/AlertasDeudores';
import GraficoIngresos from '../components/layout/GraficoIngresos';
import GraficoVehiculos from '../components/layout/GraficoVehiculos';
import { dashboardService } from '../services/dashboardService';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    // Configuración de fecha optimizada
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const today = new Date().toLocaleDateString('es-ES', options);
    setCurrentDate(today.charAt(0).toUpperCase() + today.slice(1));

    // Llamada al servicio con desestructuración segura
    dashboardService
      .getSummary()
      .then((res) => {
        // DEBUG: Descomentá esta línea en tu navegador para auditar las propiedades exactas del JSON
        // console.log("Estructura JSON recibida en Dashboard:", res);

        // CONTROL DE FLUJO: Si la respuesta viene metida dentro de 'res.data' lo extrae de forma automática
        const cleanData = res?.data ? res.data : res;
        
        setData(cleanData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error capturado en getSummary:", err);
        setError(err.message || 'Error inesperado al cargar los datos.');
        setLoading(false);
      });
  }, []);

  // 1. Estado de Carga Extendido: Asegura que el componente no se rompa si data aún es null
  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center space-y-4">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            Cargando Dashboard
          </h3>
          <p className="text-sm text-gray-500">
            Obteniendo métricas en tiempo real...
          </p>
        </div>
      </div>
    );
  }

  // 2. Estado de Interfaz ante Errores de API
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center max-w-md mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
        <h3 className="text-xl font-bold text-gray-800">Error de conexión</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>

        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-2 px-1 lg:px-4 space-y-8 text-gray-800">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
        <div>
          <div className="text-xs text-indigo-600 font-bold flex items-center gap-2 uppercase tracking-wider">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Sistema Administrativo
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Dashboard General</h1>
        </div>

        <div className="text-sm font-medium text-gray-700 flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:border-indigo-200 transition-colors">
          <Calendar className="w-4 h-4 text-indigo-600" />
          {currentDate}
        </div>
      </div>

      {/* KPIs */}
      <KpiCards data={data} />

      {/* ALERTAS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-lg hover:border-red-100 transition-all">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold flex items-center gap-2 text-gray-900">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Alertas de Cobro
          </h2>

          {data?.alertasDeudores?.length > 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">
              {data.alertasDeudores.length} pendientes
            </span>
          )}
        </div>

        <AlertasDeudores alertas={data?.alertasDeudores ?? []} />
      </div>

      {/* COCHERAS */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-lg hover:border-indigo-100 transition-all">
        <div className="flex items-center gap-2 mb-4">
          <Map className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-gray-900">Mapa de Cocheras</h2>
        </div>

        <CocherasGrid estadoCocheras={data?.estadoCocheras ?? []} />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* INGRESOS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-lg hover:border-blue-100 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-gray-900">Evolución de Ingresos</h2>
          </div>

          <GraficoIngresos datos={data?.graficoIngresos ?? []} />
        </div>

        {/* VEHICULOS */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-md hover:shadow-lg hover:border-purple-100 transition-all">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-gray-900">Vehículos</h2>
          </div>

          <GraficoVehiculos datos={data?.distribucionVehiculos ?? []} />
        </div>

      </div>
    </div>
  );
};

export default Dashboard;