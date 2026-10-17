import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { abonoService } from "../services/abonoService";
import ModalEditarAbono from "../components/layout/ModalEditarAbono";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Checkbox from "../components/layout/Check";
import Patente from "../components/layout/Patente";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import {
  FILTROS_ABONO,
  abonoIdOf,
  abonoSearchText,
  deudaDe,
  esActivo,
  estadoAbono,
  labelCocheras,
  modalidadLabel,
  pasaFiltroAbono,
  plataAbono,
  plazasDe,
  resumenAbonos,
  vehiculosDe,
} from "../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";
import { fechaCorta, haceCuanto } from "../utils/clienteHelpers";

function periodicidadLabel(value) {
  return PERIODICIDAD_OPTIONS.find((o) => o.value === Number(value))?.label || "Mensual";
}

function Cocheras({ abono }) {
  const nums = plazasDe(abono)
    .map((p) => p.cochera?.numero)
    .filter(Boolean);
  if (nums.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {nums.slice(0, 3).map((n) => (
        <span key={n} className="px-1.5 py-0.5 bg-surface-muted text-[11px] font-bold text-ink tabular-nums">
          {n}
        </span>
      ))}
      {nums.length > 3 && <span className="pk-caption">+{nums.length - 3}</span>}
    </span>
  );
}

function Patentes({ abono }) {
  const vehiculos = vehiculosDe(abono);
  if (vehiculos.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {vehiculos.slice(0, 2).map((v, i) => (
        <span key={v.abonoVehiculoId ?? `${v.patente}-${i}`} className="inline-flex items-center gap-1">
          {v.patente ? <Patente valor={v.patente} size="sm" /> : null}
          <span className="pk-caption hidden 2xl:inline">
            {modalidadLabel(v.modalidad)?.slice(0, 3)}
          </span>
        </span>
      ))}
      {vehiculos.length > 2 && <span className="pk-caption">+{vehiculos.length - 2}</span>}
    </span>
  );
}

function Cuenta({ abono }) {
  const estado = estadoAbono(abono);
  return (
    <div className="leading-tight">
      <p className={`text-sm font-semibold tabular-nums ${estado.texto}`}>{estado.label}</p>
      {deudaDe(abono) > 0 && abono.diasAtraso > 0 && (
        <p className="pk-caption tabular-nums">{abono.diasAtraso} d</p>
      )}
    </div>
  );
}

function Acciones({ abono, onPagos, onEditar, onBaja }) {
  const icono = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";
  const activo = esActivo(abono);
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button type="button" title="Pagos" onClick={onPagos} className={icono}>
        <CreditCard size={15} />
      </button>
      {activo && (
        <>
          <button type="button" title="Editar" onClick={onEditar} className={icono}>
            <Pencil size={15} />
          </button>
          <button
            type="button"
            title="Dar de baja"
            onClick={onBaja}
            className={`${icono} hover:text-danger-ink`}
          >
            <Trash2 size={15} />
          </button>
        </>
      )}
    </div>
  );
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function Abonos() {
  const navigate = useNavigate();
  const [abonos, setAbonos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [verHistoricos, setVerHistoricos] = useState(false);
  const [modalEditar, setModalEditar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);

  const cargarAbonos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await abonoService.listado(verHistoricos);
      setAbonos(Array.isArray(data) ? data : []);
    } catch {
      setError("No se pudieron cargar los abonos");
    } finally {
      setLoading(false);
    }
  }, [verHistoricos]);

  useEffect(() => {
    cargarAbonos();
  }, [cargarAbonos]);

  const resumen = useMemo(() => resumenAbonos(abonos), [abonos]);
  const visibles = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return abonos.filter((a) => pasaFiltroAbono(a, filtro) && (!q || abonoSearchText(a).includes(q)));
  }, [abonos, filtro, busqueda]);

  const paginaClave = `${filtro}|${busqueda}|${verHistoricos}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const hayFiltros = filtro !== "todos" || busqueda.trim() !== "";

  async function handleDarDeBaja(abono) {
    if (!confirm(`¿Dar de baja el abono de ${abono.cliente?.nombre} (cocheras ${labelCocheras(abono)})?\n\nEsta acción libera las plazas.`)) {
      return;
    }
    try {
      await abonoService.darDeBaja(abonoIdOf(abono));
      cargarAbonos();
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo dar de baja el abono");
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Abonos"
        description="Contratos, plazas y el estado de cada cuenta."
        loading={loading}
        action={
          <PageHeaderAction onClick={() => navigate("/abonos/nuevo")}>
            <Plus size={16} />
            Nuevo abono
          </PageHeaderAction>
        }
        stats={[
          { label: "Activos", value: resumen.activos, onClick: () => setFiltro("todos") },
          { label: "Al día", value: resumen.alDia, tone: "success", onClick: () => setFiltro("aldia") },
          { label: "Con deuda", value: resumen.conDeuda, tone: "danger", onClick: () => setFiltro("deuda") },
          { label: "Deuda total", value: plataAbono(resumen.deudaTotal), tone: "danger", onClick: () => setFiltro("deuda") },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Cliente, cochera, patente o cobrador"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Filtrar abonos"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS_ABONO.map((f) => ({ ...f, cantidad: resumen.cantidades[f.value] }))}
        />
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("todos");
              setBusqueda("");
            }}
          >
            Limpiar filtros
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
          <Checkbox checked={verHistoricos} onChange={(e) => setVerHistoricos(e.target.checked)} />
          Ver dados de baja
        </label>
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando abonos…</span>
        </div>
      ) : abonos.length === 0 ? (
        <Vacio texto="Todavía no hay abonos. Cargá el primero con Nuevo abono." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún abono coincide con la búsqueda." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[12%] hidden lg:table-column" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Cliente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cocheras</th>
                  <th className="pk-label font-bold px-3 py-2.5">Patentes</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cuota</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cuenta</th>
                  <th className="pk-label font-bold px-3 py-2.5 hidden lg:table-cell">Último pago</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((abono) => {
                  const id = abonoIdOf(abono);
                  const activo = esActivo(abono);
                  const deuda = deudaDe(abono);
                  return (
                    <tr
                      key={id}
                      onClick={() => navigate(`/pagosAbono/${id}`)}
                      className={`border-b border-line cursor-pointer hover:bg-surface-page ${activo ? "" : "opacity-55"}`}
                    >
                      <td
                        className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${
                          deuda > 0 ? "border-l-danger" : "border-l-transparent"
                        }`}
                      >
                        <p className="font-semibold text-ink truncate">{abono.cliente?.nombre ?? "Sin cliente"}</p>
                        <p className="pk-caption truncate">
                          {[abono.cliente?.telefono, abono.cobrador && `Cobra ${abono.cobrador}`].filter(Boolean).join(" · ") || "\u00a0"}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <Cocheras abono={abono} />
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <Patentes abono={abono} />
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <p className="font-semibold text-ink tabular-nums">
                          {abono.precioAcordado != null ? plataAbono(abono.precioAcordado) : "Lista"}
                        </p>
                        <p className="pk-caption">
                          {periodicidadLabel(abono.periodicidadCobro)} · {fechaCorta(abono.fechaInicio)}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden">
                        <Cuenta abono={abono} />
                      </td>
                      <td className="px-3 py-2.5 overflow-hidden hidden lg:table-cell">
                        {abono.ultimoPago ? (
                          <div className="leading-tight">
                            <p className="text-ink tabular-nums">{fechaCorta(abono.ultimoPago)}</p>
                            <p className="pk-caption">{haceCuanto(abono.ultimoPago)}</p>
                          </div>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="pl-2 pr-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Acciones
                          abono={abono}
                          onPagos={() => navigate(`/pagosAbono/${id}`)}
                          onEditar={() => setModalEditar(abono)}
                          onBaja={() => handleDarDeBaja(abono)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((abono) => {
              const id = abonoIdOf(abono);
              const activo = esActivo(abono);
              const deuda = deudaDe(abono);
              return (
                <li key={id} className={activo ? "" : "opacity-55"}>
                  <button
                    type="button"
                    onClick={() => navigate(`/pagosAbono/${id}`)}
                    className={`w-full text-left px-4 py-3 border-l-[3px] ${deuda > 0 ? "border-l-danger" : "border-l-transparent"}`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-ink truncate">{abono.cliente?.nombre ?? "Sin cliente"}</span>
                      <Cuenta abono={abono} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <Cocheras abono={abono} />
                      <Patentes abono={abono} />
                    </div>
                    <p className="pk-caption mt-1 tabular-nums">
                      {abono.precioAcordado != null ? plataAbono(abono.precioAcordado) : "Lista"} · {periodicidadLabel(abono.periodicidadCobro)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}

      {modalEditar && (
        <ModalEditarAbono
          abono={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardado={() => {
            setModalEditar(null);
            cargarAbonos();
          }}
        />
      )}
    </div>
  );
}
