import React, { useMemo, useRef, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registramos los módulos nativos de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GraficoIngresos = ({ datos }) => {
  const chartRef = useRef(null);
  const [gradient, setGradient] = useState(null);

  // 1. Parseo estricto de la API en el hijo
  const dataSaneada = useMemo(() => {
    if (!datos || !Array.isArray(datos) || datos.length === 0) return [];
    return datos.map(item => {
      const montoCrudo = item?.monto !== undefined && item?.monto !== null ? item.monto : 0;
      const montoParseado = parseFloat(String(montoCrudo));
      return {
        mes: item?.mes ? String(item.mes) : '',
        monto: isNaN(montoParseado) ? 0 : montoParseado
      };
    });
  }, [datos]);

  // Formateador de dinero para el eje Y y Tooltips
  const formatCurrency = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  // 2. Efecto para crear el gradiente premium sobre el Canvas real
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ctx = chart.ctx;
    const gradientBg = ctx.createLinearGradient(0, 0, 0, 300);
    gradientBg.addColorStop(0, 'rgba(79, 70, 229, 0.9)');  // Indigo 600
    gradientBg.addColorStop(1, 'rgba(99, 102, 241, 0.15)'); // Indigo 400 tenue

    setGradient(gradientBg);
  }, [dataSaneada]);

  // Si no hay datos, evitamos que rompa y mostramos un feedback limpio
  if (dataSaneada.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-2xl">
        Esperando datos de recaudación...
      </div>
    );
  }

  // 3. Configuración de datos para Chart.js
  const chartData = {
    labels: dataSaneada.map(d => d.mes),
    datasets: [
      {
        label: 'Recaudación',
        data: dataSaneada.map(d => d.monto),
        backgroundColor: gradient || '#4f46e5',
        borderRadius: 6, // Bordes redondeados arriba nativos
        borderSkipped: 'bottom',
        maxBarThickness: 40,
      },
    ],
  };

  // 4. Opciones de configuración de diseño (Grid, fuentes, tooltips)
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda genérica
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#94a3b8',
        titleFont: { size: 11, weight: 'bold', family: 'system-ui' },
        bodyColor: '#1e293b',
        bodyFont: { size: 14, weight: '900', family: 'system-ui' },
        borderColor: '#f1f5f9',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        cornerRadius: 12,
        shadowColor: 'rgba(0, 0, 0, 0.04)',
        callbacks: {
          label: function (context) {
            return ` Recaudación: ${context.parsed.y.toLocaleString('es-AR')}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Sin líneas verticales para diseño limpio
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: '600', family: 'system-ui' },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: '#f1f5f9', // Líneas horizontales tenues
          tickBorderDash: [4, 4],
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 11, weight: '600', family: 'system-ui' },
          callback: (value) => formatCurrency(value),
          padding: 8,
        },
        border: {
          display: false,
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full h-[300px] relative">
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default GraficoIngresos;