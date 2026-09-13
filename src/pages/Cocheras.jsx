import { useState, useEffect } from "react";
import { 
  Plus, 
  Pencil, 
  Car, 
  AlertCircle, 
  ChevronRight, 
  GripVertical, 
  Sparkles,
  Move,
  Lock,
  Unlock,
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cocheraService } from "../services/cocheraService";
import { abonoService } from "../services/abonoService";
import { categoriaCocheraService } from "../services/categoriaCocheraService";
import ModalCochera from "../components/layout/ModalCochera";

export default function Cocheras() {
  const navigate = useNavigate();
  const [cocheras, setCocheras] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [filtro, setFiltro] = useState("Todas");

  // Estados para Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      const [cochData, abonosData, catData] = await Promise.all([
        cocheraService.getAll(),
        abonoService.getOcupadas(),
        categoriaCocheraService.getAll()
      ]);
      
      const abonoIncluye = (a, cocheraId) =>
        (Array.isArray(a.plazas) && a.plazas.some(p => p.activo !== false && (p.cocheraId === cocheraId || p.cochera?.cocheraId === cocheraId)))
        || a.cocheraId === cocheraId;

      let detalle = cochData.map(c => ({
        ...c,
        ocupada: abonosData.some(a => abonoIncluye(a, c.cocheraId)),
        abonos: abonosData.filter(a => abonoIncluye(a, c.cocheraId))
      }));

      // Ordenar cocheras según la persistencia local de localStorage
      const savedOrder = localStorage.getItem("cocherasOrder");
      if (savedOrder) {
        const orderIds = JSON.parse(savedOrder);
        detalle.sort((a, b) => {
          const idxA = orderIds.indexOf(a.cocheraId);
          const idxB = orderIds.indexOf(b.cocheraId);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }

      setCocheras(detalle);
      setCategorias(catData);
    } catch {}
    finally { setLoading(false); }
  }

  const filtros = ["Todas", "Ocupadas", "Libres"];
  const cocherasFiltradas = cocheras.filter(c => {
    if (filtro === "Ocupadas") return c.ocupada;
    if (filtro === "Libres") return !c.ocupada;
    return true;
  });

  const resumen = {
    total: cocheras.length,
    ocupadas: cocheras.filter(c => c.ocupada).length,
    libres: cocheras.filter(c => !c.ocupada).length,
  };

  // Lógica de Drag & Drop
  const handleDragStart = (e, index) => {
    if (filtro !== "Todas") return; // Impedir drag si hay filtros activos
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (filtro !== "Todas" || draggedIndex === null) return;
    if (hoveredIndex !== index) {
      setHoveredIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (filtro !== "Todas" || draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...cocheras];
    const draggedItem = updated[draggedIndex];
    
    // Quitar elemento de la posición original y colocarlo en la de destino
    updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);
    
    setCocheras(updated);
    
    // Persistir el orden actual en localStorage para recargas de página
    const orderIds = updated.map(c => c.cocheraId);
    localStorage.setItem("cocherasOrder", JSON.stringify(orderIds));

    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Cocheras</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>{resumen.ocupadas} Asignadas</span>
            <span className="text-gray-300">·</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{resumen.libres} Libres</span>
          </p>
        </div>
        
        <button
          onClick={() => { setSeleccionada(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold px-5 py-3 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-indigo-700/20 transition-all"
        >
          <Plus size={18} /> 
          <span>Nueva Cochera</span>
        </button>
      </div>

      {/* Tarjetas de Resumen KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Cocheras Totales", value: resumen.total, bg: "from-gray-500 to-slate-600", text: "text-gray-600", desc: "Espacios de estacionamiento habilitados", icon: Move },
          { label: "Ocupadas (Abonadas)", value: resumen.ocupadas, bg: "from-indigo-500 to-indigo-600", text: "text-indigo-600", desc: "Suscripciones mensuales vigentes", icon: Lock },
          { label: "Libres (Disponibles)", value: resumen.libres, bg: "from-emerald-500 to-emerald-600", text: "text-emerald-600", desc: "Espacios libres para nuevos abonos", icon: Unlock },
        ].map(({ label, value, text, desc, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_4px_12px_rgba(0,0,0,0.015)] flex justify-between items-center relative overflow-hidden group hover:shadow-[0_12px_24px_rgba(0,0,0,0.02)] transition-shadow">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
              <p className={`text-3xl font-black ${text} tracking-tight`}>{value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{desc}</p>
            </div>
            <div className={`p-3 rounded-xl bg-gray-50 text-gray-400 group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Controles: Filtros e Indicaciones de Drag & Drop */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-gray-50/60 p-3 rounded-xl border border-gray-100">
        {/* Filtros */}
        <div className="flex gap-2">
          {filtros.map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filtro === f 
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/10" 
                  : "bg-white text-gray-500 border border-gray-200/80 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cocheras */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-400">Cargando distribución de cocheras...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cocherasFiltradas.map((cochera, index) => {
            const isOcupada = cochera.ocupada;
            const isDragged = draggedIndex === index;
            const isHoveredAsDrop = hoveredIndex === index;

            return (
              <div
                key={cochera.cocheraId}
                draggable={filtro === "Todas"}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`group relative rounded-2xl border p-5 transition-all duration-300 ${
                  isOcupada 
                    ? "bg-indigo-50/40 border-indigo-100/70 hover:border-indigo-300" 
                    : "bg-white border-gray-150/80 hover:border-gray-300"
                } ${
                  isDragged ? "opacity-35 scale-95 shadow-inner border-indigo-300 bg-indigo-50/20" : ""
                } ${
                  isHoveredAsDrop && !isDragged
                    ? "border-2 border-dashed border-indigo-400 bg-indigo-50/60 scale-[1.03] shadow-md z-10" 
                    : ""
                }`}
              >
                {/* Visual indicator bar at the top */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl ${
                  isOcupada ? 'bg-indigo-500' : 'bg-emerald-500'
                }`}></div>

                {/* Card Header */}
                <div className="flex items-start justify-between mb-4 pt-1">
                  <div>
                    {/* Asa para drag & drop (solo visible si el filtro es "Todas") */}
                    <div className="flex items-center gap-1.5">
                      {filtro === "Todas" && (
                        <div 
                          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-300 hover:text-indigo-500 rounded hover:bg-gray-50 transition-colors"
                          title="Arrastrar para ordenar"
                        >
                          <GripVertical size={16} />
                        </div>
                      )}
                      
                      <p className={`text-4xl font-black tracking-tight leading-none ${
                        isOcupada ? "text-indigo-800" : "text-gray-800"
                      }`}>
                        {cochera.numero}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`w-2 h-2 rounded-full ${
                        isOcupada ? "bg-indigo-500 animate-pulse" : "bg-emerald-500"
                      }`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isOcupada ? "text-indigo-600" : "text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded"
                      }`}>
                        {isOcupada ? "Ocupada" : "Libre"}
                      </span>
                      
                      {categorias.find(cat => cat.categoriaCocheraId === cochera.categoriaCocheraId)?.nombre && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          {categorias.find(cat => cat.categoriaCocheraId === cochera.categoriaCocheraId).nombre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de Edición */}
                  <button
                    onClick={e => { e.stopPropagation(); setSeleccionada(cochera); setModalOpen(true); }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 active:scale-90 border border-transparent hover:border-amber-100/50"
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                {/* Observaciones (si las hay y no está ocupada) */}
                {cochera.observacion && !isOcupada && (
                  <div className="flex items-start gap-1.5 mb-4 text-[11px] font-semibold text-amber-700 bg-amber-50/70 border border-amber-100/50 rounded-xl p-3">
                    <AlertCircle size={13} className="shrink-0 mt-0.5 text-amber-500" />
                    <span className="leading-relaxed">{cochera.observacion}</span>
                  </div>
                )}

                {/* Detalles de Abono (Cuerpo de la Tarjeta) */}
                {cochera.abonos.length > 0 ? (
                  <div className="pt-4 border-t border-indigo-100/50 space-y-3">
                    {cochera.abonos.map(a => {
                      const aid = a.abonoId ?? a.abonoCocheraId;
                      const vehiculos = Array.isArray(a.vehiculos) && a.vehiculos.length > 0
                        ? a.vehiculos
                        : (a.patente || a.tipoVehiculo ? [{ patente: a.patente, tipoVehiculo: a.tipoVehiculo }] : []);
                      const labelVeh = vehiculos
                        .map(v => [v.tipoVehiculo?.nombre, v.patente].filter(Boolean).join(" "))
                        .filter(Boolean)
                        .join(" · ") || "Sin vehículos";
                      return (
                      <div key={aid} className="flex items-center justify-between bg-white border border-indigo-50/60 p-2.5 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.01)] hover:shadow-sm transition-shadow">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">{a.cliente?.nombre}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400 font-semibold">
                            <Car size={11} className="text-indigo-400 shrink-0" />
                            <span className="truncate">{labelVeh}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => navigate(`/pagosAbono/${aid}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:translate-x-0.5 shrink-0"
                          title="Ver Historial de Pagos"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    );})}
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100/80 flex flex-col items-center justify-center py-2 bg-gray-50/30 rounded-xl border border-dashed border-gray-150">
                    <p className="text-[10px] font-bold text-gray-300 tracking-wider uppercase">Sin suscripción</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ModalCochera
          cochera={seleccionada}
          categorias={categorias}
          onClose={() => setModalOpen(false)}
          onGuardar={cargarDatos}
        />
      )}
    </div>
  );
}