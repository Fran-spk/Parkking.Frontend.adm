import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cocheraService } from "../services/cocheraService";
import { categoriaCocheraService } from "../services/categoriaCocheraService";
import { zonaService } from "../services/zonaService";
import { estacionamientoService } from "../services/estacionamientoService";
import ModalCochera from "../components/layout/ModalCochera";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import FilterSelect from "../components/layout/FilterSelect";
import Checkbox from "../components/layout/Check";

/** @typedef {import("../types").Cochera} Cochera */
/** @typedef {import("../types").CategoriaCochera} CategoriaCochera */
/** @typedef {import("../types").Zona} Zona */

function nombreEstado(estado) {
  return Number(estado) === 1 ? "Deshabilitada" : "Habilitada";
}

function CocheraCard({ cochera, categoria, onDarDeBaja, dandoDeBaja }) {
  const navigate = useNavigate();
  const abonos = cochera.abonosActivos ?? 0;
  const libre = abonos === 0;

  return (
    <article className="flex h-[220px] flex-col bg-surface-card border border-line p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-3xl font-black tracking-tight leading-none text-ink tabular-nums">
          {cochera.numero}
        </p>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
            libre ? "bg-success-muted text-success-ink" : "bg-brand text-brand-foreground"
          }`}
        >
          {libre ? "Libre" : "Ocupada"}
        </span>
      </div>

      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-faint font-semibold uppercase tracking-wider text-[10px]">Categoría</dt>
          <dd className="font-bold text-ink truncate">{categoria || "—"}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-faint font-semibold uppercase tracking-wider text-[10px]">Estado</dt>
          <dd className="font-bold text-ink">{nombreEstado(cochera.estadoCochera)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-faint font-semibold uppercase tracking-wider text-[10px]">Abonos</dt>
          <dd className="font-bold text-ink tabular-nums">{abonos}</dd>
        </div>
      </dl>

      <div className="mt-auto pt-3 flex items-center justify-between gap-3">
        {libre ? (
          <button
            type="button"
            disabled={dandoDeBaja}
            onClick={() => onDarDeBaja?.(cochera)}
            className="text-xs font-bold text-danger hover:text-danger-ink disabled:opacity-40"
          >
            {dandoDeBaja ? "Dando de baja…" : "Dar de baja"}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => navigate(`/cocheras/${cochera.cocheraId}`)}
          className="text-xs font-bold text-brand hover:text-brand-strong"
        >
          Ver más
        </button>
      </div>
    </article>
  );
}

function Grilla({ cocheras, nombreCategoria, onDarDeBaja, bajaId }) {
  if (cocheras.length === 0) {
    return (
      <div className="bg-surface-card px-4 py-16 text-center">
        <p className="text-sm text-ink-muted font-medium">No hay cocheras en este filtro.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {cocheras.map((cochera) => (
        <CocheraCard
          key={cochera.cocheraId}
          cochera={cochera}
          categoria={nombreCategoria(cochera.categoriaCocheraId)}
          onDarDeBaja={onDarDeBaja}
          dandoDeBaja={bajaId === cochera.cocheraId}
        />
      ))}
    </div>
  );
}

export default function Cocheras() {
  const [cocheras, setCocheras] = useState(/** @type {Cochera[]} */ ([]));
  const [categorias, setCategorias] = useState(/** @type {CategoriaCochera[]} */ ([]));
  const [zonas, setZonas] = useState(/** @type {Zona[]} */ ([]));
  const [trabajarConZonas, setTrabajarConZonas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState("Todas");
  const [porZona, setPorZona] = useState(false);
  const [zonaIndex, setZonaIndex] = useState(0);
  const [bajaId, setBajaId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setLoading(true);
      const [cochData, catData, zonaData, est] = await Promise.all([
        cocheraService.getAll(),
        categoriaCocheraService.getAll(),
        zonaService.getAll(),
        estacionamientoService.get(),
      ]);
      setCocheras(Array.isArray(cochData) ? cochData : []);
      setCategorias(Array.isArray(catData) ? catData : []);
      setZonas(Array.isArray(zonaData) ? zonaData : []);
      setTrabajarConZonas(!!est?.trabajarConZonas);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  const filtros = ["Todas", "Ocupadas", "Libres"];
  const cocherasFiltradas = cocheras.filter((c) => {
    const abonos = c.abonosActivos ?? 0;
    if (filtro === "Ocupadas") return abonos > 0;
    if (filtro === "Libres") return abonos === 0;
    return true;
  });

  const resumen = {
    total: cocheras.length,
    ocupadas: cocheras.filter((c) => (c.abonosActivos ?? 0) > 0).length,
    libres: cocheras.filter((c) => (c.abonosActivos ?? 0) === 0).length,
  };
  const ocupacionPct =
    resumen.total > 0 ? Math.round((resumen.ocupadas / resumen.total) * 100) : 0;

  const grupos = useMemo(() => {
    /** @type {{ id: string, nombre: string, items: Cochera[] }[]} */
    const lista = zonas.map((z) => ({
      id: String(z.zonaId),
      nombre: z.nombre,
      items: cocherasFiltradas.filter((c) => (c.zonaId ?? c.zona?.zonaId) === z.zonaId),
    }));
    const sinZona = cocherasFiltradas.filter((c) => !(c.zonaId ?? c.zona?.zonaId));
    if (sinZona.length > 0) {
      lista.push({ id: "sin", nombre: "Sin zona", items: sinZona });
    }
    return lista.filter((g) => g.items.length > 0);
  }, [zonas, cocherasFiltradas]);

  const indice = grupos.length === 0 ? 0 : Math.min(zonaIndex, grupos.length - 1);
  const grupoActual = grupos[indice];

  function nombreCategoria(id) {
    return categorias.find((cat) => cat.categoriaCocheraId === id)?.nombre;
  }

  async function darDeBaja(cochera) {
    if ((cochera.abonosActivos ?? 0) > 0) return;
    if (!confirm(`¿Dar de baja la cochera ${cochera.numero}?`)) return;
    try {
      setError(null);
      setBajaId(cochera.cocheraId);
      await cocheraService.desactivar(cochera.cocheraId);
      await cargarDatos();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja la cochera");
    } finally {
      setBajaId(null);
    }
  }

  function irZona(delta) {
    setZonaIndex((i) => {
      const actual = grupos.length === 0 ? 0 : Math.min(i, grupos.length - 1);
      return Math.min(grupos.length - 1, Math.max(0, actual + delta));
    });
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterSelect
          ariaLabel="Filtrar cocheras"
          value={filtro}
          onChange={setFiltro}
          options={filtros.map((f) => ({ value: f, label: f }))}
        />
        <label className="flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
          <Checkbox
            checked={porZona}
            onChange={(e) => {
              setPorZona(e.target.checked);
              setZonaIndex(0);
            }}
          />
          Organizar por zona
        </label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando cocheras…</span>
        </div>
      ) : porZona ? (
        grupos.length === 0 ? (
          <div className="bg-surface-card px-4 py-16 text-center">
            <p className="text-sm text-ink-muted font-medium">No hay cocheras en este filtro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => irZona(-1)}
                disabled={indice === 0}
                className="p-2 border border-line text-ink disabled:opacity-30 hover:bg-surface-muted"
                aria-label="Zona anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-center min-w-0">
                <p className="text-sm font-bold text-ink truncate">{grupoActual.nombre}</p>
                <p className="pk-caption">
                  {indice + 1} / {grupos.length} · {grupoActual.items.length} cocheras
                </p>
              </div>
              <button
                type="button"
                onClick={() => irZona(1)}
                disabled={indice >= grupos.length - 1}
                className="p-2 border border-line text-ink disabled:opacity-30 hover:bg-surface-muted"
                aria-label="Zona siguiente"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  width: `${grupos.length * 100}%`,
                  transform: `translateX(-${(indice * 100) / grupos.length}%)`,
                }}
              >
                {grupos.map((grupo) => (
                  <div key={grupo.id} style={{ width: `${100 / grupos.length}%` }}>
                    <Grilla
                      cocheras={grupo.items}
                      nombreCategoria={nombreCategoria}
                      onDarDeBaja={darDeBaja}
                      bajaId={bajaId}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      ) : (
        <Grilla
          cocheras={cocherasFiltradas}
          nombreCategoria={nombreCategoria}
          onDarDeBaja={darDeBaja}
          bajaId={bajaId}
        />
      )}

      {modalOpen && (
        <ModalCochera
          categorias={categorias}
          zonas={zonas}
          exigirZona={trabajarConZonas}
          onClose={() => setModalOpen(false)}
          onGuardar={cargarDatos}
        />
      )}
    </div>
  );
}
