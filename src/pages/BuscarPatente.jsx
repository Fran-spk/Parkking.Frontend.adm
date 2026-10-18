import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { abonoService } from "../services/abonoService";
import { estadiaService } from "../services/estadiaService";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Patente from "../components/layout/Patente";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import {
  abonoIdOf,
  esActivo,
  labelCocheras,
  modalidadLabel,
  vehiculosDe,
} from "../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";
import { fechaCorta, plata } from "../utils/clienteHelpers";

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "abonos", label: "Abonos" },
  { value: "estadias", label: "Estadías" },
];

const ESTADO_ESTADIA = {
  0: { label: "Adentro", texto: "text-success-ink", borde: "border-l-success" },
  1: { label: "Cerrada", texto: "text-ink-muted", borde: "border-l-transparent" },
  2: { label: "Anulada", texto: "text-ink-faint", borde: "border-l-transparent" },
};

function periodicidadLabel(value) {
  return PERIODICIDAD_OPTIONS.find((o) => o.value === Number(value))?.label || "Mensual";
}

function estadoEstadia(e) {
  return ESTADO_ESTADIA[Number(e.estado)] || ESTADO_ESTADIA[1];
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function BuscarPatente() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enPlaya = pathname.startsWith("/playa");
  const [query, setQuery] = useState("");
  const [filas, setFilas] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);

  async function buscar(e) {
    e?.preventDefault();
    const q = query.trim();
    if (q.length < 2) {
      setError("Ingresá al menos 2 caracteres");
      setFilas(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [abonosData, estadiasData] = await Promise.all([
        abonoService.buscarPorPatente(q).catch((err) => {
          const msg = err.response?.data;
          if (typeof msg === "string" && msg.toLowerCase().includes("caracteres")) throw err;
          return [];
        }),
        estadiaService.listar({ patente: q.replace(/[\s-]/g, "").toUpperCase() }).catch(() => []),
      ]);
      const abonos = (Array.isArray(abonosData) ? abonosData : []).map((abono) => ({
        key: `abono-${abonoIdOf(abono)}`,
        tipo: "abono",
        fecha: abono.fechaInicio,
        abono,
      }));
      const estadias = (Array.isArray(estadiasData) ? estadiasData : []).map((estadia) => ({
        key: `estadia-${estadia.estadiaId}`,
        tipo: "estadia",
        fecha: estadia.horaEntrada,
        estadia,
      }));
      setFilas(
        [...abonos, ...estadias].sort((a, b) => String(b.fecha || "").localeCompare(String(a.fecha || "")))
      );
      setFiltro("todos");
      setPagina(1);
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo buscar");
      setFilas(null);
    } finally {
      setLoading(false);
    }
  }

  const cantidades = useMemo(() => {
    const list = filas || [];
    return {
      todos: list.length,
      abonos: list.filter((f) => f.tipo === "abono").length,
      estadias: list.filter((f) => f.tipo === "estadia").length,
    };
  }, [filas]);

  const visibles = useMemo(() => {
    if (!filas) return [];
    if (filtro === "todos") return filas;
    if (filtro === "abonos") return filas.filter((f) => f.tipo === "abono");
    return filas.filter((f) => f.tipo === "estadia");
  }, [filas, filtro]);

  const visPage = paginaDe(visibles, pagina);

  function abrir(fila) {
    if (fila.tipo === "abono") {
      navigate(`/pagosAbono/${abonoIdOf(fila.abono)}`);
      return;
    }
    navigate(Number(fila.estadia.estado) === 0 ? (enPlaya ? "/playa" : "/rotativo") : "/rotativo/historico");
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Buscar patente"
        description="Abonos y estadías rotativas, por patente parcial o completa."
        loading={loading && !filas}
        stats={
          filas
            ? [
                { label: "Resultados", value: cantidades.todos, onClick: () => setFiltro("todos") },
                { label: "Abonos", value: cantidades.abonos, onClick: () => setFiltro("abonos") },
                { label: "Estadías", value: cantidades.estadias, onClick: () => setFiltro("estadias") },
              ]
            : [
                { label: "Resultados", value: "—" },
                { label: "Abonos", value: "—" },
                { label: "Estadías", value: "—" },
              ]
        }
      />

      <form onSubmit={buscar} className="flex flex-wrap items-center gap-3">
        <SearchField
          value={query}
          onChange={(v) => setQuery(v.toUpperCase())}
          placeholder="Ej. AB123 / AB123CD"
          autoFocus
          className="w-full sm:w-80"
          inputClassName="font-mono font-bold tracking-wider uppercase"
        />
        <PageHeaderAction type="submit" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Buscar
        </PageHeaderAction>
        {filas && (
          <FiltroSegmentado
            ariaLabel="Filtrar resultados"
            value={filtro}
            onChange={(v) => {
              setFiltro(v);
              setPagina(1);
            }}
            opciones={FILTROS.map((f) => ({ ...f, cantidad: cantidades[f.value] }))}
          />
        )}
      </form>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading && !filas ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Buscando…</span>
        </div>
      ) : !filas ? (
        <Vacio texto="Escribí una patente y buscá. Encuentra abonos y estadías." />
      ) : visibles.length === 0 ? (
        <Vacio texto={filas.length === 0 ? "Nada para esa patente." : "Nada en este filtro."} />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[22%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Tipo</th>
                  <th className="pk-label font-bold px-3 py-2.5">Patente</th>
                  <th className="pk-label font-bold px-3 py-2.5">Titular / zona</th>
                  <th className="pk-label font-bold px-3 py-2.5">Detalle</th>
                  <th className="pk-label font-bold px-3 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visPage.map((fila) =>
                  fila.tipo === "abono" ? (
                    <FilaAbono key={fila.key} abono={fila.abono} onOpen={() => abrir(fila)} />
                  ) : (
                    <FilaEstadia key={fila.key} estadia={fila.estadia} onOpen={() => abrir(fila)} />
                  )
                )}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((fila) => {
              if (fila.tipo === "abono") {
                const abono = fila.abono;
                const activo = esActivo(abono);
                const vehiculos = vehiculosDe(abono);
                return (
                  <li key={fila.key}>
                    <button type="button" onClick={() => abrir(fila)} className={`w-full text-left px-4 py-3 border-l-[3px] ${activo ? "border-l-success" : "border-l-transparent"}`}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold text-ink truncate">{abono.cliente?.nombre || "Sin cliente"}</span>
                        <span className="pk-caption font-semibold">{activo ? "Abono activo" : "Abono baja"}</span>
                      </div>
                      <p className="pk-caption mt-0.5">Cochera {labelCocheras(abono)}</p>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {vehiculos.map((v, i) =>
                          v.patente ? <Patente key={v.abonoVehiculoId ?? i} valor={v.patente} size="sm" /> : null
                        )}
                      </div>
                    </button>
                  </li>
                );
              }
              const e = fila.estadia;
              const est = estadoEstadia(e);
              return (
                <li key={fila.key}>
                  <button type="button" onClick={() => abrir(fila)} className={`w-full text-left px-4 py-3 border-l-[3px] ${est.borde}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      {e.patente ? <Patente valor={e.patente} size="sm" /> : <span className="text-ink-faint">S/PAT</span>}
                      <span className={`pk-caption font-semibold ${est.texto}`}>{est.label}</span>
                    </div>
                    <p className="pk-caption mt-1">
                      {e.tipoVehiculoNombre}
                      {e.zonaNombre ? ` · ${e.zonaNombre}` : ""} · {fechaCorta(e.horaEntrada)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}
    </div>
  );
}

function FilaAbono({ abono, onOpen }) {
  const activo = esActivo(abono);
  const vehiculos = vehiculosDe(abono);
  return (
    <tr onClick={onOpen} className={`border-b border-line cursor-pointer hover:bg-surface-page ${activo ? "" : "opacity-55"}`}>
      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${activo ? "border-l-success" : "border-l-transparent"}`}>
        <p className="font-semibold text-ink">Abono</p>
        <p className="pk-caption">{periodicidadLabel(abono.periodicidadCobro)}</p>
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        <span className="inline-flex items-center gap-1 flex-wrap">
          {vehiculos.length === 0 ? <span className="text-ink-faint">—</span> : null}
          {vehiculos.slice(0, 2).map((v, i) =>
            v.patente ? <Patente key={v.abonoVehiculoId ?? i} valor={v.patente} size="sm" /> : null
          )}
          {vehiculos.length > 2 && <span className="pk-caption">+{vehiculos.length - 2}</span>}
        </span>
        {vehiculos[0] && <p className="pk-caption mt-0.5">{modalidadLabel(vehiculos[0].modalidad)}</p>}
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        <p className="font-semibold text-ink truncate">{abono.cliente?.nombre || "Sin cliente"}</p>
        <p className="pk-caption truncate">{abono.cliente?.telefono || "\u00a0"}</p>
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        <p className="font-semibold text-ink">Cochera {labelCocheras(abono)}</p>
        <p className="pk-caption">Desde {fechaCorta(abono.fechaInicio)}</p>
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        <p className={`text-sm font-semibold ${activo ? "text-success-ink" : "text-ink-faint"}`}>
          {activo ? "Activo" : "De baja"}
        </p>
        {abono.precioAcordado != null && <p className="pk-caption tabular-nums">{plata(abono.precioAcordado)}</p>}
      </td>
    </tr>
  );
}

function FilaEstadia({ estadia, onOpen }) {
  const est = estadoEstadia(estadia);
  return (
    <tr onClick={onOpen} className={`border-b border-line cursor-pointer hover:bg-surface-page ${Number(estadia.estado) === 2 ? "opacity-55" : ""}`}>
      <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${est.borde}`}>
        <p className="font-semibold text-ink">Estadía</p>
        <p className="pk-caption">{estadia.tipoVehiculoNombre || "Rotativo"}</p>
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        {estadia.patente ? <Patente valor={estadia.patente} size="sm" /> : <span className="text-ink-faint">S/PAT</span>}
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        <p className="font-semibold text-ink truncate">{estadia.zonaNombre || "Rotativo"}</p>
        <p className="pk-caption">{estadia.esAbonado ? "Abonado" : "Rotativo"}</p>
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        <p className="font-semibold text-ink tabular-nums">{fechaCorta(estadia.horaEntrada)}</p>
        <p className="pk-caption">
          {estadia.horaSalida ? `Salió ${fechaCorta(estadia.horaSalida)}` : "Sigue adentro"}
        </p>
      </td>
      <td className="px-3 py-2.5 overflow-hidden">
        <p className={`text-sm font-semibold ${est.texto}`}>{est.label}</p>
        {estadia.monto != null && <p className="pk-caption tabular-nums">{plata(estadia.monto)}</p>}
      </td>
    </tr>
  );
}
