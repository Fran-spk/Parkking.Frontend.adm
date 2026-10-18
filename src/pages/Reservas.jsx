import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, Recycle } from "lucide-react";
import { reservaService } from "../services/reservaService";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Checkbox from "../components/layout/Check";
import Patente from "../components/layout/Patente";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import { fechaCorta, plata, whatsappUrl } from "../utils/clienteHelpers";
import {
  FILTROS_RESERVA,
  bordeReserva,
  cocherasDe,
  esVigente,
  estadoSena,
  nombreReserva,
  pasaFiltroReserva,
  patentesDe,
  periodoReserva,
  reservaCoincide,
  resumenReservas,
} from "../utils/reservaHelpers";

function Cocheras({ reserva }) {
  const nums = cocherasDe(reserva);
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

function Patentes({ reserva }) {
  const lista = patentesDe(reserva);
  if (lista.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {lista.slice(0, 2).map((p) => (
        <Patente key={p} valor={p} size="sm" />
      ))}
      {lista.length > 2 && <span className="pk-caption">+{lista.length - 2}</span>}
    </span>
  );
}

function Seña({ reserva }) {
  const estado = estadoSena(reserva);
  return <p className={`text-sm font-semibold tabular-nums ${estado.texto}`}>{estado.label}</p>;
}

function Acciones({ reserva, onAbrir }) {
  const icono = "pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted";
  const wa = whatsappUrl(reserva.telefono);
  return (
    <div className="flex items-center justify-end gap-0.5">
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" title="WhatsApp" className={icono}>
          <MessageCircle size={15} />
        </a>
      )}
      {esVigente(reserva) && !reserva.automatica && (
        <button type="button" title="Transformar a abono" onClick={onAbrir} className={icono}>
          <Recycle size={15} />
        </button>
      )}
    </div>
  );
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function Reservas() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("vigentes");
  const [historicos, setHistoricos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reservaService.getAll();
      setReservas(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg = e.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudieron cargar las reservas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = useMemo(() => resumenReservas(reservas, historicos), [reservas, historicos]);
  const visibles = useMemo(
    () => reservas.filter((r) => pasaFiltroReserva(r, filtro, historicos) && reservaCoincide(r, busqueda)),
    [reservas, filtro, historicos, busqueda]
  );

  const paginaClave = `${filtro}|${busqueda}|${historicos}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const hayFiltros = filtro !== "vigentes" || busqueda.trim() !== "";

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Reservas"
        description="Cocheras apartadas, con seña y fecha de inicio."
        loading={loading}
        action={
          <PageHeaderAction onClick={() => navigate("/reservas/nueva")}>
            <Plus size={16} />
            Nueva reserva
          </PageHeaderAction>
        }
        stats={[
          { label: "Vigentes", value: resumen.vigentes, onClick: () => setFiltro("vigentes") },
          { label: "Automáticas", value: resumen.automaticas, tone: "warning", onClick: () => setFiltro("automaticas") },
          { label: "Con seña", value: resumen.conSena, tone: "danger", onClick: () => setFiltro("sena") },
          { label: "Seña pendiente", value: plata(resumen.senaTotal), tone: "danger", onClick: () => setFiltro("sena") },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Nombre, teléfono, cochera o patente"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Filtrar reservas"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS_RESERVA.map((f) => ({ ...f, cantidad: resumen.cantidades[f.value] }))}
        />
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("vigentes");
              setBusqueda("");
            }}
          >
            Limpiar filtros
          </button>
        )}
        <label className="ml-auto flex items-center gap-2 pk-caption font-semibold cursor-pointer select-none">
          <Checkbox checked={historicos} onChange={(e) => setHistoricos(e.target.checked)} />
          Ver bajas y transformadas
        </label>
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando reservas…</span>
        </div>
      ) : reservas.length === 0 ? (
        <Vacio texto="Todavía no hay reservas. Cargá la primera con Nueva reserva." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ninguna reserva coincide con la búsqueda." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Titular</th>
                  <th className="pk-label font-bold px-3 py-2.5">Cocheras</th>
                  <th className="pk-label font-bold px-3 py-2.5">Patentes</th>
                  <th className="pk-label font-bold px-3 py-2.5">Período</th>
                  <th className="pk-label font-bold px-3 py-2.5">Seña</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((r) => (
                  <tr
                    key={r.reservaId}
                    onClick={() => navigate(`/reservas/${r.reservaId}`)}
                    className={`border-b border-line cursor-pointer hover:bg-surface-page ${esVigente(r) ? "" : "opacity-55"}`}
                  >
                    <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${bordeReserva(r)}`}>
                      <p className="font-semibold text-ink truncate">
                        {nombreReserva(r)}
                        {r.automatica ? <span className="ml-2 pk-caption text-warning-ink font-semibold">Automática</span> : null}
                      </p>
                      <p className="pk-caption truncate tabular-nums">{r.telefono || r.email || "\u00a0"}</p>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <Cocheras reserva={r} />
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <Patentes reserva={r} />
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <p className="font-semibold text-ink">{periodoReserva(r)}</p>
                      <p className="pk-caption tabular-nums">
                        {fechaCorta(r.fechaInicio)} – {fechaCorta(r.fechaVencimiento)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <Seña reserva={r} />
                      {r.precioAcordado != null && <p className="pk-caption tabular-nums">Cuota {plata(r.precioAcordado)}</p>}
                    </td>
                    <td className="pl-2 pr-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <Acciones reserva={r} onAbrir={() => navigate(`/reservas/${r.reservaId}`)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((r) => (
              <li key={r.reservaId} className={esVigente(r) ? "" : "opacity-55"}>
                <button
                  type="button"
                  onClick={() => navigate(`/reservas/${r.reservaId}`)}
                  className={`w-full text-left px-4 py-3 border-l-[3px] ${bordeReserva(r)}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink truncate">
                      {nombreReserva(r)}
                      {r.automatica ? <span className="ml-2 pk-caption text-warning-ink">Auto</span> : null}
                    </span>
                    <Seña reserva={r} />
                  </div>
                  <p className="pk-caption mt-0.5">{periodoReserva(r)}</p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <Cocheras reserva={r} />
                    <Patentes reserva={r} />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}
    </div>
  );
}
