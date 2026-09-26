import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Car,
  AlertCircle,
  ChevronRight,
  GripVertical,
  Lock,
  Unlock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cocheraService } from "../services/cocheraService";
import { abonoService } from "../services/abonoService";
import { categoriaCocheraService } from "../services/categoriaCocheraService";
import ModalCochera from "../components/layout/ModalCochera";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";

/** @typedef {import("../types").Cochera} Cochera */
/** @typedef {import("../types").CategoriaCochera} CategoriaCochera */
/** @typedef {import("../types").Abono} Abono */

export default function Cocheras() {
  const navigate = useNavigate();
  const [cocheras, setCocheras] = useState(/** @type {Cochera[]} */ ([]));
  const [categorias, setCategorias] = useState(/** @type {CategoriaCochera[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [filtro, setFiltro] = useState("Todas");

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      const [cochData, abonosData, catData] = await Promise.all([
        cocheraService.getAll(),
        abonoService.getOcupadas(),
        categoriaCocheraService.getAll(),
      ]);

      const abonoIncluye = (a, cocheraId) =>
        (Array.isArray(a.plazas) &&
          a.plazas.some(
            (p) =>
              p.activo !== false &&
              (p.cocheraId === cocheraId || p.cochera?.cocheraId === cocheraId)
          )) ||
        a.cocheraId === cocheraId;

      let detalle = cochData.map((c) => ({
        ...c,
        ocupada: abonosData.some((a) => abonoIncluye(a, c.cocheraId)),
        abonos: abonosData.filter((a) => abonoIncluye(a, c.cocheraId)),
      }));

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
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  const filtros = ["Todas", "Ocupadas", "Libres"];
  const cocherasFiltradas = cocheras.filter((c) => {
    if (filtro === "Ocupadas") return c.ocupada;
    if (filtro === "Libres") return !c.ocupada;
    return true;
  });

  const resumen = {
    total: cocheras.length,
    ocupadas: cocheras.filter((c) => c.ocupada).length,
    libres: cocheras.filter((c) => !c.ocupada).length,
  };

  const ocupacionPct =
    resumen.total > 0 ? Math.round((resumen.ocupadas / resumen.total) * 100) : 0;

  const handleDragStart = (e, index) => {
    if (filtro !== "Todas") return;
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (filtro !== "Todas" || draggedIndex === null) return;
    if (hoveredIndex !== index) setHoveredIndex(index);
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
    updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);

    setCocheras(updated);
    localStorage.setItem(
      "cocherasOrder",
      JSON.stringify(updated.map((c) => c.cocheraId))
    );

    setDraggedIndex(null);
    setHoveredIndex(null);
  };

  function nombreCategoria(id) {
    return categorias.find((cat) => cat.categoriaCocheraId === id)?.nombre;
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Cocheras"
        description={`Distribución de plazas · ${ocupacionPct}% ocupación.`}
        loading={loading}
        action={
          <PageHeaderAction
            onClick={() => {
              setSeleccionada(null);
              setModalOpen(true);
            }}
          >
            <Plus size={16} />
            Nueva cochera
          </PageHeaderAction>
        }
        stats={[
          { label: "Totales", value: resumen.total, onClick: () => setFiltro("Todas") },
          { label: "Ocupadas", value: resumen.ocupadas, onClick: () => setFiltro("Ocupadas") },
          {
            label: "Libres",
            value: resumen.libres,
            tone: "success",
            onClick: () => setFiltro("Libres"),
          },
        ]}
      />

      {/* Filtros + hint drag */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-1 bg-surface-muted p-1 w-full sm:w-auto">
          {filtros.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold transition-colors ${
                filtro === f
                  ? "bg-brand text-brand-foreground"
                  : "text-ink-muted hover:text-ink hover:bg-surface-card"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {filtro === "Todas" ? (
          <p className="text-[11px] text-ink-faint font-medium flex items-center gap-1.5">
            <GripVertical size={14} className="opacity-60" />
            Arrastrá para reordenar
          </p>
        ) : null}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando cocheras…</span>
        </div>
      ) : cocherasFiltradas.length === 0 ? (
        <div className="bg-surface-card px-4 py-16 text-center">
          <p className="text-sm text-ink-muted font-medium">No hay cocheras en este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {cocherasFiltradas.map((cochera, index) => {
            const isOcupada = cochera.ocupada;
            const isDragged = draggedIndex === index;
            const isHoveredAsDrop = hoveredIndex === index;
            const catNombre = nombreCategoria(cochera.categoriaCocheraId);

            return (
              <div
                key={cochera.cocheraId}
                draggable={filtro === "Todas"}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={`group relative bg-surface-card transition-all duration-200 ${
                  isOcupada ? "ring-1 ring-inset ring-line" : ""
                } ${isDragged ? "opacity-40 scale-[0.98]" : ""} ${
                  isHoveredAsDrop && !isDragged
                    ? "ring-2 ring-brand bg-brand-muted z-10"
                    : ""
                }`}
              >
                <div
                  className={`absolute top-0 left-0 bottom-0 w-[3px] ${
                    isOcupada ? "bg-brand" : "bg-success"
                  }`}
                />

                <div className="pl-4 pr-3 pt-4 pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        {filtro === "Todas" && (
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-ink-faint hover:text-ink transition-colors"
                            title="Arrastrar para ordenar"
                          >
                            <GripVertical size={16} />
                          </div>
                        )}
                        <p className="text-3xl font-black tracking-tight leading-none text-ink tabular-nums">
                          {cochera.numero}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                            isOcupada
                              ? "bg-brand text-brand-foreground"
                              : "bg-success-muted text-success-ink"
                          }`}
                        >
                          {isOcupada ? (
                            <Lock size={10} strokeWidth={2.5} />
                          ) : (
                            <Unlock size={10} strokeWidth={2.5} />
                          )}
                          {isOcupada ? "Ocupada" : "Libre"}
                        </span>
                        {catNombre ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                            {catNombre}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSeleccionada(cochera);
                        setModalOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-2 text-ink-faint hover:text-ink hover:bg-surface-muted"
                      aria-label="Editar cochera"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>

                  {cochera.observacion && !isOcupada ? (
                    <div className="flex items-start gap-1.5 mb-3 text-[11px] font-medium text-warning-ink bg-warning-muted px-2.5 py-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{cochera.observacion}</span>
                    </div>
                  ) : null}

                  {cochera.abonos.length > 0 ? (
                    <div className="pt-3 border-t border-line space-y-2">
                      {cochera.abonos.map((a) => {
                        const aid = a.abonoId ?? a.abonoCocheraId;
                        const vehiculos =
                          Array.isArray(a.vehiculos) && a.vehiculos.length > 0
                            ? a.vehiculos
                            : a.patente || a.tipoVehiculo
                              ? [{ patente: a.patente, tipoVehiculo: a.tipoVehiculo }]
                              : [];
                        const labelVeh =
                          vehiculos
                            .map((v) =>
                              [v.tipoVehiculo?.nombre, v.patente].filter(Boolean).join(" ")
                            )
                            .filter(Boolean)
                            .join(" · ") || "Sin vehículos";

                        return (
                          <button
                            key={aid}
                            type="button"
                            onClick={() => navigate(`/pagosAbono/${aid}`)}
                            className="w-full flex items-center justify-between gap-2 bg-surface-muted hover:bg-brand-muted px-2.5 py-2 text-left transition-colors group/abono"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-ink truncate">
                                {a.cliente?.nombre}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-ink-muted font-medium">
                                <Car size={11} className="shrink-0 text-ink-faint" />
                                <span className="truncate">{labelVeh}</span>
                              </div>
                            </div>
                            <ChevronRight
                              size={16}
                              className="text-ink-faint group-hover/abono:text-ink shrink-0 transition-colors"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-line border-dashed flex items-center justify-center py-3">
                      <p className="text-[10px] font-bold text-ink-faint tracking-wider uppercase">
                        Sin suscripción
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

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
