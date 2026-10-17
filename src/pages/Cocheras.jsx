import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { cocheraService } from "../services/cocheraService";
import { categoriaCocheraService } from "../services/categoriaCocheraService";
import { zonaService } from "../services/zonaService";
import { estacionamientoService } from "../services/estacionamientoService";
import { tipoVehiculoService } from "../services/tipoVehiculoService";
import { dashboardService } from "../services/dashboardService";
import ModalCochera from "../components/layout/ModalCochera";
import CocheraCard from "../components/layout/CocheraCard";
import BarraOcupacionCocheras from "../components/layout/BarraOcupacionCocheras";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import FilterSelect from "../components/layout/FilterSelect";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import SearchField from "../components/layout/SearchField";
import Checkbox from "../components/layout/Check";
import {
  FILTROS_COCHERA,
  cocheraCoincide,
  deudasPorAbono,
  estadoCochera,
  pasaFiltro,
  resumenCocheras,
} from "../utils/cocheraHelpers";

/** @typedef {import("../types").Cochera} Cochera */
/** @typedef {import("../types").CategoriaCochera} CategoriaCochera */
/** @typedef {import("../types").Zona} Zona */

function Vacio({ texto }) {
  return (
    <div className="bg-surface-card px-4 py-16 text-center">
      <p className="text-sm text-ink-muted font-medium">{texto}</p>
    </div>
  );
}

function Grilla({ cocheras, ...cardProps }) {
  if (cocheras.length === 0) return <Vacio texto="No hay cocheras en este filtro." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
      {cocheras.map((c) => (
        <CocheraCard
          key={c.cocheraId}
          cochera={c}
          categoria={cardProps.nombreCategoria(c.categoriaCocheraId)}
          tipos={cardProps.tipos}
          deudas={cardProps.deudas}
          onDarDeBaja={cardProps.onDarDeBaja}
          dandoDeBaja={cardProps.bajaId === c.cocheraId}
        />
      ))}
    </div>
  );
}

function SeccionZona({ grupo, ...cardProps }) {
  const libres = grupo.items.filter((c) => ["libre", "parcial"].includes(estadoCochera(c))).length;
  return (
    <section className="space-y-3">
      <header className="flex items-baseline justify-between gap-3 border-b border-line-strong pb-1.5">
        <h2 className="text-sm font-bold text-ink">{grupo.nombre}</h2>
        <span className="pk-caption text-ink-muted tabular-nums">
          {grupo.items.length} cocheras · {libres} con lugar
        </span>
      </header>
      <Grilla cocheras={grupo.items} {...cardProps} />
    </section>
  );
}

export default function Cocheras() {
  const [cocheras, setCocheras] = useState(/** @type {Cochera[]} */ ([]));
  const [categorias, setCategorias] = useState(/** @type {CategoriaCochera[]} */ ([]));
  const [zonas, setZonas] = useState(/** @type {Zona[]} */ ([]));
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [trabajarConZonas, setTrabajarConZonas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState("todas");
  const [categoriaId, setCategoriaId] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [porZona, setPorZona] = useState(false);
  const [bajaId, setBajaId] = useState(null);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [cochData, catData, zonaData, est, tiposData] = await Promise.all([
        cocheraService.getAll(),
        categoriaCocheraService.getAll(),
        zonaService.getAll(),
        estacionamientoService.get(),
        tipoVehiculoService.getAll(true).catch(() => []),
      ]);
      setCocheras(Array.isArray(cochData) ? cochData : []);
      setCategorias(Array.isArray(catData) ? catData : []);
      setZonas(Array.isArray(zonaData) ? zonaData : []);
      setTiposVehiculo(Array.isArray(tiposData) ? tiposData : []);
      setTrabajarConZonas(!!est?.trabajarConZonas);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar las cocheras");
    } finally {
      setLoading(false);
    }
    dashboardService
      .getSummary()
      .then((d) => setAlertas(Array.isArray(d?.alertasDeudores) ? d.alertasDeudores : []))
      .catch(() => setAlertas([]));
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const tipos = useMemo(() => new Map(tiposVehiculo.map((t) => [t.tipoVehiculoId, t.nombre])), [tiposVehiculo]);
  const deudas = useMemo(() => deudasPorAbono(alertas), [alertas]);
  const resumen = useMemo(() => resumenCocheras(cocheras, deudas), [cocheras, deudas]);

  const filtradas = useMemo(
    () =>
      cocheras.filter(
        (c) =>
          pasaFiltro(c, filtro, deudas) &&
          (categoriaId === "" || Number(c.categoriaCocheraId) === Number(categoriaId)) &&
          cocheraCoincide(c, busqueda)
      ),
    [cocheras, filtro, deudas, categoriaId, busqueda]
  );

  const grupos = useMemo(() => {
    const lista = zonas
      .map((z) => ({
        id: String(z.zonaId),
        nombre: z.nombre,
        items: filtradas.filter((c) => (c.zonaId ?? c.zona?.zonaId) === z.zonaId),
      }))
      .filter((g) => g.items.length > 0);
    const sinZona = filtradas.filter((c) => !(c.zonaId ?? c.zona?.zonaId));
    if (sinZona.length > 0) lista.push({ id: "sin", nombre: "Sin zona", items: sinZona });
    return lista;
  }, [zonas, filtradas]);

  const nombreCategoria = useCallback(
    (id) => categorias.find((cat) => cat.categoriaCocheraId === id)?.nombre,
    [categorias]
  );

  async function darDeBaja(cochera) {
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

  const { porEstado, cantidades, ocupacionPct } = resumen;
  const cardProps = { nombreCategoria, tipos, deudas, onDarDeBaja: darDeBaja, bajaId };
  const hayFiltros = filtro !== "todas" || categoriaId !== "" || busqueda.trim() !== "";

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Cocheras"
        description={`${cocheras.length} cocheras · ${ocupacionPct}% de ocupación de las que se ofrecen.`}
        loading={loading}
        action={
          <PageHeaderAction onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Nueva cochera
          </PageHeaderAction>
        }
        stats={[
          { label: "Libres", value: cantidades.libres, tone: "success", onClick: () => setFiltro("libres") },
          { label: "Ocupadas", value: cantidades.ocupadas, onClick: () => setFiltro("ocupadas") },
          { label: "Reservadas", value: cantidades.reservadas, tone: "warning", onClick: () => setFiltro("reservadas") },
          { label: "Con deuda", value: cantidades.deuda, tone: "danger", onClick: () => setFiltro("deuda") },
        ]}
      />

      {!loading && <BarraOcupacionCocheras porEstado={porEstado} total={cocheras.length} />}

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Número, cliente o patente"
          className="w-full sm:w-64"
        />
        <FiltroSegmentado
          ariaLabel="Filtrar cocheras"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS_COCHERA.map((f) => ({ ...f, cantidad: cantidades[f.value] }))}
        />
        {categorias.length > 1 && (
          <FilterSelect
            ariaLabel="Categoría"
            value={categoriaId}
            onChange={setCategoriaId}
            options={[
              { value: "", label: "Todas las categorías" },
              ...categorias.map((c) => ({ value: c.categoriaCocheraId, label: c.nombre })),
            ]}
          />
        )}
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("todas");
              setCategoriaId("");
              setBusqueda("");
            }}
          >
            Limpiar filtros
          </button>
        )}
        {zonas.length > 0 && (
          <label className="ml-auto flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
            <Checkbox checked={porZona} onChange={(e) => setPorZona(e.target.checked)} />
            Organizar por zona
          </label>
        )}
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando cocheras…</span>
        </div>
      ) : cocheras.length === 0 ? (
        <Vacio texto="Todavía no hay cocheras. Cargá la primera con Nueva cochera." />
      ) : porZona ? (
        grupos.length === 0 ? (
          <Vacio texto="No hay cocheras en este filtro." />
        ) : (
          <div className="space-y-8">
            {grupos.map((g) => (
              <SeccionZona key={g.id} grupo={g} {...cardProps} />
            ))}
          </div>
        )
      ) : (
        <Grilla cocheras={filtradas} {...cardProps} />
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
