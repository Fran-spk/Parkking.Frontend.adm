import { useEffect, useMemo, useState } from "react";
import { Eye, Receipt } from "lucide-react";
import DatePicker from "react-datepicker";
import { es } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { pagoService } from "../services/pagoService";
import { estadiaService } from "../services/estadiaService";
import { reciboService } from "../services/reciboService";
import { estacionamientoService } from "../services/estacionamientoService";
import { imprimirReciboPdf } from "../utils/imprimirRecibo";
import ModalDetallePago from "../components/layout/ModalDetallePago";
import PageHeader from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FiltroSegmentado from "../components/layout/FiltroSegmentado";
import Patente from "../components/layout/Patente";
import Paginacion, { paginaDe } from "../components/layout/Paginacion";
import { fieldClass } from "../components/layout/FilterSelect";
import { fechaCorta, plata } from "../utils/clienteHelpers";

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "abonos", label: "Abonos" },
  { value: "estadias", label: "Estadías" },
];

function rangoMes(date, fin) {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  if (!fin) return `${y}-${m}-01`;
  const ultimo = new Date(y, date.getMonth() + 1, 0).getDate();
  return `${y}-${m}-${String(ultimo).padStart(2, "0")}`;
}

function periodoAbono(pago) {
  const detalles = pago.detalles || [];
  if (detalles.length === 1) return detalles[0].periodoLabel || "—";
  if (detalles.length > 1) return `${detalles.length} períodos`;
  if (!pago.mes) return "—";
  return new Date(`${String(pago.mes).split("T")[0]}T00:00:00`).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function unificar(abonos, estadias) {
  const a = (Array.isArray(abonos) ? abonos : []).map((p) => ({
    key: `abono-${p.pagoId}`,
    origen: "abono",
    pagoId: p.pagoId,
    fecha: p.fechaHoraCarga,
    titular: p.clienteNombre || "—",
    patente: null,
    lugar: p.numeroCochera || "—",
    detalle: periodoAbono(p),
    metodo: p.metodoDePagoNombre,
    monto: Number(p.monto || 0) + Number(p.recargo || 0),
    recargo: Number(p.recargo || 0),
    reciboId: p.reciboId,
    reciboNumero: p.reciboNumero,
    raw: p,
  }));
  const e = (Array.isArray(estadias) ? estadias : []).map((p) => ({
    key: `estadia-${p.pagoId}`,
    origen: "estadia",
    pagoId: p.pagoId,
    fecha: p.fechaHora,
    titular: p.patente || "Rotativo",
    patente: p.patente,
    lugar: p.zonaNombre || p.tipoVehiculoNombre || "Rotativo",
    detalle: p.tipoVehiculoNombre || "Estadía",
    metodo: p.metodoDePagoNombre,
    monto: Number(p.monto || 0),
    recargo: 0,
    reciboId: p.reciboId,
    reciboNumero: p.reciboNumero,
    raw: {
      pagoId: p.pagoId,
      fechaHoraCarga: p.fechaHora,
      monto: p.monto,
      recargo: 0,
      clienteNombre: p.patente,
      numeroCochera: p.zonaNombre,
      metodoDePagoNombre: p.metodoDePagoNombre,
      reciboId: p.reciboId,
      reciboNumero: p.reciboNumero,
      observacion: "Estadía",
      detalles: [],
    },
  }));
  return [...a, ...e].sort((x, y) => new Date(y.fecha) - new Date(x.fecha));
}

function coincide(p, q) {
  if (!q) return true;
  return [p.titular, p.lugar, p.detalle, p.patente, p.reciboNumero, String(p.pagoId)].some((v) =>
    String(v || "").toLowerCase().includes(q)
  );
}

function Vacio({ texto }) {
  return <div className="bg-surface-card px-4 py-16 text-center text-sm font-medium text-ink-muted">{texto}</div>;
}

export default function Pagos() {
  const [filas, setFilas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [desde, setDesde] = useState(null);
  const [hasta, setHasta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagoDetalle, setPagoDetalle] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [reciboBusyId, setReciboBusyId] = useState(null);
  const [metaEst, setMetaEst] = useState({ nombre: "Parkking", direccion: "" });

  useEffect(() => {
    estacionamientoService
      .get()
      .then((d) => setMetaEst({ nombre: d?.nombre || "Parkking", direccion: d?.direccion || "" }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    cargar();
  }, [desde, hasta]);

  async function cargar() {
    try {
      setError(null);
      setLoading(true);
      const desdeStr = rangoMes(desde, false);
      const hastaStr = rangoMes(hasta, true);
      const [abonos, estadias] = await Promise.all([
        pagoService.getAll(desdeStr, hastaStr),
        estadiaService.pagos({
          ...(desdeStr && { desde: desdeStr }),
          ...(hastaStr && { hasta: hastaStr }),
        }).catch(() => []),
      ]);
      setFilas(unificar(abonos, estadias));
    } catch {
      setError("No se pudo cargar los pagos");
    } finally {
      setLoading(false);
    }
  }

  const cantidades = useMemo(() => {
    const c = { todos: filas.length, abonos: 0, estadias: 0 };
    for (const f of filas) c[f.origen === "estadia" ? "estadias" : "abonos"] += 1;
    return c;
  }, [filas]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter((f) => {
      if (filtro === "abonos" && f.origen !== "abono") return false;
      if (filtro === "estadias" && f.origen !== "estadia") return false;
      return coincide(f, q);
    });
  }, [filas, filtro, busqueda]);

  const paginaClave = `${filtro}|${busqueda}|${desde}|${hasta}`;
  useEffect(() => {
    setPagina(1);
  }, [paginaClave]);

  const visPage = paginaDe(visibles, pagina);
  const totalMonto = visibles.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const totalRecargo = visibles.reduce((acc, p) => acc + Number(p.recargo || 0), 0);
  const hayFiltros = filtro !== "todos" || busqueda.trim() !== "" || desde || hasta;

  async function handleVerRecibo(fila) {
    if (!fila.reciboId && !fila.pagoId) return;
    try {
      setReciboBusyId(fila.pagoId);
      const recibo = fila.reciboId ? await reciboService.getById(fila.reciboId) : await reciboService.getByPago(fila.pagoId);
      imprimirReciboPdf(recibo, {
        nombreEstacionamiento: metaEst.nombre,
        direccion: metaEst.direccion,
      });
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : "No se pudo abrir el recibo");
    } finally {
      setReciboBusyId(null);
    }
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in-up">
      <PageHeader
        title="Pagos"
        description="Cobros de abonos y de estadías rotativas."
        loading={loading}
        stats={[
          { label: "Transacciones", value: visibles.length, onClick: () => setFiltro("todos") },
          { label: "Abonos", value: cantidades.abonos, onClick: () => setFiltro("abonos") },
          { label: "Estadías", value: cantidades.estadias, onClick: () => setFiltro("estadias") },
          { label: "Cobrado", value: plata(totalMonto) },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Cliente, patente, cochera o recibo"
          className="w-full sm:w-80"
        />
        <FiltroSegmentado
          ariaLabel="Origen del pago"
          value={filtro}
          onChange={setFiltro}
          opciones={FILTROS.map((f) => ({ ...f, cantidad: cantidades[f.value] }))}
        />
        <DatePicker
          selected={desde}
          onChange={setDesde}
          locale={es}
          dateFormat="MM/yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          placeholderText="Desde"
          isClearable
          className={`${fieldClass} w-36`}
        />
        <DatePicker
          selected={hasta}
          onChange={setHasta}
          locale={es}
          dateFormat="MM/yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          placeholderText="Hasta"
          isClearable
          minDate={desde}
          className={`${fieldClass} w-36`}
        />
        {hayFiltros && (
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => {
              setFiltro("todos");
              setBusqueda("");
              setDesde(null);
              setHasta(null);
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="px-4 py-3 bg-danger-muted text-danger-ink text-sm">{error}</p>}
      {totalRecargo > 0 && filtro !== "estadias" && (
        <p className="pk-caption">Recargos en este recorte: {plata(totalRecargo)}</p>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-9 h-9 border-2 border-brand-soft border-t-brand animate-spin" />
          <span className="pk-caption">Cargando pagos…</span>
        </div>
      ) : filas.length === 0 ? (
        <Vacio texto="Todavía no hay pagos en este período." />
      ) : visibles.length === 0 ? (
        <Vacio texto="Ningún pago coincide con este filtro." />
      ) : (
        <>
          <div className="hidden md:block bg-surface-card overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[16%]" />
                <col className="w-[22%]" />
                <col className="w-[16%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line-strong text-left">
                  <th className="pk-label font-bold pl-4 pr-3 py-2.5">Fecha</th>
                  <th className="pk-label font-bold px-3 py-2.5">Titular</th>
                  <th className="pk-label font-bold px-3 py-2.5">Origen</th>
                  <th className="pk-label font-bold px-3 py-2.5">Detalle</th>
                  <th className="pk-label font-bold px-3 py-2.5">Monto</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visPage.map((p) => (
                  <tr
                    key={p.key}
                    className="border-b border-line cursor-pointer hover:bg-surface-page"
                    onClick={() => (p.origen === "abono" ? setPagoDetalle(p) : handleVerRecibo(p))}
                  >
                    <td className={`pl-4 pr-3 py-2.5 overflow-hidden border-l-[3px] ${p.origen === "estadia" ? "border-l-brand" : "border-l-transparent"}`}>
                      <p className="font-semibold text-ink tabular-nums">{fechaCorta(p.fecha)}</p>
                      <p className="pk-caption">{p.metodo || "\u00a0"}</p>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      {p.patente ? (
                        <div className="flex items-center gap-1.5">
                          <Patente valor={p.patente} size="sm" />
                        </div>
                      ) : (
                        <p className="font-semibold text-ink truncate">{p.titular}</p>
                      )}
                      <p className="pk-caption truncate">{p.lugar}</p>
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <p className="font-semibold text-ink">{p.origen === "estadia" ? "Estadía" : "Abono"}</p>
                      {p.reciboNumero && <p className="pk-caption">Recibo {p.reciboNumero}</p>}
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <p className="font-semibold text-ink capitalize truncate">{p.detalle}</p>
                      {p.recargo > 0 && <p className="pk-caption text-warning-ink">incl. {plata(p.recargo)} recargo</p>}
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden">
                      <p className="font-semibold text-ink tabular-nums">{plata(p.monto)}</p>
                    </td>
                    <td className="pl-2 pr-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        {p.origen === "abono" && (
                          <button type="button" title="Ver detalle" onClick={() => setPagoDetalle(p)} className="pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted">
                            <Eye size={15} />
                          </button>
                        )}
                        {(p.reciboId || p.pagoId) && (
                          <button
                            type="button"
                            title="Ver recibo"
                            disabled={reciboBusyId === p.pagoId}
                            onClick={() => handleVerRecibo(p)}
                            className="pk-icon-btn p-1.5 text-ink-faint hover:text-ink hover:bg-surface-muted"
                          >
                            <Receipt size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden bg-surface-card divide-y divide-line">
            {visPage.map((p) => (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => (p.origen === "abono" ? setPagoDetalle(p) : handleVerRecibo(p))}
                  className={`w-full text-left px-4 py-3 border-l-[3px] ${p.origen === "estadia" ? "border-l-brand" : "border-l-transparent"}`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-ink truncate">{p.patente || p.titular}</span>
                    <span className="text-sm font-semibold tabular-nums">{plata(p.monto)}</span>
                  </div>
                  <p className="pk-caption mt-0.5">
                    {p.origen === "estadia" ? "Estadía" : "Abono"} · {fechaCorta(p.fecha)} · {p.detalle}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <Paginacion pagina={pagina} total={visibles.length} onChange={setPagina} />
        </>
      )}

      {pagoDetalle && pagoDetalle.origen === "abono" && (
        <ModalDetallePago
          pago={pagoDetalle.raw}
          pagoId={pagoDetalle.pagoId}
          onClose={() => setPagoDetalle(null)}
          onVerRecibo={() => {
            setPagoDetalle(null);
            handleVerRecibo(pagoDetalle);
          }}
        />
      )}
    </div>
  );
}
