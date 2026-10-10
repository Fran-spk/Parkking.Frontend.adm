import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Car,
  Calendar,
  User,
  Check,
  AlertCircle,
  Loader2,
  Pencil,
  Ban,
  Wallet,
  ChevronDown,
  ChevronRight,
  Receipt,
  Banknote,
  FileText,
  Eye,
  ParkingSquare,
} from "lucide-react";
import { abonoService } from "../services/abonoService";
import { pagoService } from "../services/pagoService";
import { operacionFinancieraService } from "../services/operacionFinancieraService";
import { reciboService } from "../services/reciboService";
import { estacionamientoService } from "../services/estacionamientoService";
import { imprimirReciboPdf } from "../utils/imprimirRecibo";
import ModalRegistrarPago from "../components/layout/ModalRegistrarPago";
import ModalEditarAbono from "../components/layout/ModalEditarAbono";
import ModalDetallePago from "../components/layout/ModalDetallePago";
import DocumentosAbono from "../components/layout/DocumentosAbono";
import CargosReintegrosAbono from "../components/layout/CargosReintegrosAbono";
import PageHeader, { PageHeaderAction } from "../components/layout/PageHeader";
import SearchField from "../components/layout/SearchField";
import FilterSelect from "../components/layout/FilterSelect";
import Checkbox from "../components/layout/Check";
import { labelCocheras, plazasDe, vehiculosDe, modalidadLabel, nombreTipoVehiculo, MODALIDAD } from "../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";

/** @typedef {import("../types").Abono} Abono */
/** @typedef {import("../types").Cuota} Cuota */
/** @typedef {import("../types").Pago} Pago */

function parseLocal(fechaInput) {
  if (!fechaInput) return null;
  if (fechaInput instanceof Date) return fechaInput;
  const soloFecha = String(fechaInput).split("T")[0];
  const [y, m, d] = soloFecha.split("-").map(Number);
  return new Date(y, m - 1, d || 1);
}

function formatFecha(fecha) {
  const d = parseLocal(fecha);
  return d
    ? d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";
}

function formatFechaHora(fecha) {
  if (!fecha) return "-";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(precio || 0);
}

function periodicidadLabel(value) {
  return PERIODICIDAD_OPTIONS.find((o) => o.value === Number(value))?.label || "Mensual";
}

const ESTADO = {
  0: "Pendiente",
  1: "Parcial",
  2: "Pagada",
  3: "Anulada",
};

const VISTAS = [
  { id: "cuotas", label: "Cuotas" },
  { id: "pagos", label: "Pagos" },
  { id: "extras", label: "Cargos y reintegros" },
];

const FILTROS_CUOTA = [
  { id: "todos", label: "Todos" },
  { id: "pendiente", label: "Pendientes" },
  { id: "parcial", label: "Parciales" },
  { id: "pagada", label: "Pagadas" },
  { id: "anulada", label: "Anuladas" },
  { id: "futuro", label: "Futuros" },
  { id: "conCobros", label: "Con pagos" },
];

function clasificarCuota(c) {
  if (c.estado === 3) return "anulada";
  if (c.esFuturo && c.estado !== 2 && Number(c.montoPagado) <= 0) return "futuro";
  if (c.estado === 2 || (Number(c.saldo) <= 0 && Number(c.montoPagado) > 0)) return "pagada";
  if (c.estado === 1 || Number(c.montoPagado) > 0) return "parcial";
  return "pendiente";
}

function estiloCuota(c) {
  if (c.estado === 3) {
    return {
      row: "bg-gray-50/40",
      dot: "bg-gray-300",
      title: "text-gray-400 line-through",
      badge: "bg-gray-100 text-gray-500 border-gray-200",
      label: "Anulada",
    };
  }
  if (c.esFuturo) {
    return {
      row: "bg-gray-50/60",
      dot: "bg-gray-300",
      title: "text-gray-500",
      badge: "bg-gray-100 text-gray-500 border-gray-200",
      label: "Futuro",
    };
  }
  if (c.estado === 2 || (Number(c.saldo) <= 0 && Number(c.montoPagado) > 0)) {
    return {
      row: "",
      dot: "bg-emerald-400",
      title: "text-gray-800",
      badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
      label: "Pagada",
    };
  }
  if (c.estado === 1 || Number(c.montoPagado) > 0) {
    return {
      row: "bg-amber-50/40",
      dot: "bg-amber-400",
      title: "text-amber-900",
      badge: "bg-amber-50 text-amber-700 border-amber-100",
      label: "Parcial",
    };
  }
  return {
    row: "bg-red-50/50",
    dot: "bg-red-400",
    title: "text-red-800",
    badge: "bg-red-50 text-red-600 border-red-100",
    label: ESTADO[c.estado] || "Pendiente",
  };
}

function CuotaTimelineItem({
  cuota,
  esActivo,
  expandido,
  onToggle,
  onCobrar,
  onAnular,
  onVerRecibo,
  onVerDetalle,
  reciboBusyId,
  modoMulti,
  seleccionada,
  onToggleSeleccion,
  pagosById,
}) {
  const estilo = estiloCuota(cuota);
  const tieneCobros = (cuota.cobros || []).length > 0;
  const cobrable = esActivo && !cuota.esFuturo && Number(cuota.saldo) > 0 && cuota.estado !== 2 && cuota.estado !== 3;
  const adelantable = esActivo && !!cuota.esFuturo && Number(cuota.saldo) > 0 && cuota.estado !== 2 && cuota.estado !== 3;
  const anulable =
    esActivo &&
    cuota.estado !== 2 &&
    cuota.estado !== 3 &&
    !tieneCobros &&
    Number(cuota.montoPagado) <= 0 &&
    (Number(cuota.saldo) > 0 || (cuota.esFuturo && Number(cuota.monto) > 0));
  const pct =
    Number(cuota.monto) > 0
      ? Math.min(100, Math.round((Number(cuota.montoPagado) / Number(cuota.monto)) * 100))
      : 0;
  const detallesLiq = cuota.detallesLiquidacion || [];
  const tieneLiquidacion = detallesLiq.length > 0;
  const expandible = tieneCobros || tieneLiquidacion || cuota.estado === 1 || cuota.estado === 2;

  return (
    <div
      className={`border-b border-gray-50 last:border-0 ${
        modoMulti && seleccionada ? "bg-indigo-50/50" : estilo.row
      }`}
    >
      <div className="flex items-center gap-3 px-5 py-3.5">
        {modoMulti && cobrable ? (
          <Checkbox
            checked={seleccionada}
            onChange={onToggleSeleccion}
            title="Incluir en pago múltiple"
          />
        ) : modoMulti ? (
          <span className="w-3.5 shrink-0" />
        ) : null}

        <button
          type="button"
          disabled={!expandible}
          onClick={onToggle}
          className={`p-0.5 rounded ${expandible ? "text-gray-400 hover:text-gray-600" : "text-transparent"}`}
          aria-label="Expandir"
        >
          {expandido ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${estilo.dot}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold capitalize ${estilo.title}`}>{cuota.periodoLabel}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${estilo.badge}`}>
              {estilo.label}
            </span>
            {cuota.vencida && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium bg-rose-50 text-rose-700 border-rose-100">
                Vencida
              </span>
            )}
          </div>

          {(cuota.estado === 1 || Number(cuota.montoPagado) > 0) && cuota.estado !== 2 && (
            <div className="mt-2 max-w-xs">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>
                  {formatPrecio(cuota.montoPagado)} / {formatPrecio(cuota.monto)}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {cuota.estado === 2 && (
            <p className="text-xs text-gray-400 mt-0.5">{formatPrecio(cuota.monto)}</p>
          )}

          {(cobrable || adelantable) && cuota.estado === 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {adelantable ? "Período que todavía no empezó · " : ""}
              Saldo {formatPrecio(cuota.saldo)}
              {cuota.fechaVencimiento ? ` · vence ${formatFecha(cuota.fechaVencimiento)}` : ""}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!modoMulti && anulable && (
            <button
              type="button"
              onClick={() => onAnular?.(cuota)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-line-strong text-ink-muted hover:bg-surface-muted"
            >
              Anular
            </button>
          )}
          {!modoMulti && (cobrable || adelantable) ? (
            <button
              onClick={() => onCobrar(cuota)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                adelantable
                  ? "border-brand/30 bg-brand-muted text-brand hover:bg-brand-soft"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {adelantable ? "Adelantar" : "Pagar"}
            </button>
          ) : cuota.estado === 2 ? (
            <div className="flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">
              <Check size={12} className="text-emerald-600" />
            </div>
          ) : null}
        </div>
      </div>

      {expandido && (tieneLiquidacion || tieneCobros) && (
        <div className="px-5 pb-4 pl-14 space-y-3">
          {tieneLiquidacion && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Cómo se armó el monto
              </p>
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 space-y-1.5">
                {detallesLiq.map((d) => (
                  <div
                    key={d.detalleCuotaId}
                    className="flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">
                        {d.descripcion || d.tipoLabel || "Línea"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {d.tipoLabel}
                        {d.tarifaMensualId ? ` · tarifa #${d.tarifaMensualId}` : ""}
                        {d.patente ? ` · ${d.patente}` : ""}
                      </p>
                    </div>
                    <p
                      className={`font-semibold shrink-0 ${
                        Number(d.importe) < 0 ? "text-amber-700" : "text-gray-800"
                      }`}
                    >
                      {formatPrecio(d.importe)}
                    </p>
                  </div>
                ))}
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-xs font-bold text-gray-900">
                  <span>Total cuota</span>
                  <span>{formatPrecio(cuota.monto)}</span>
                </div>
              </div>
            </div>
          )}

          {tieneCobros && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Aplicado a este período
              </p>
              {cuota.cobros.map((cobro) => {
                const busy = reciboBusyId === cobro.pagoId;
                const pago = pagosById?.get?.(cobro.pagoId);
                const detalles = pago?.detalles || [];
                const multi = detalles.length > 1;
                const totalPago =
                  Number(pago?.monto ?? 0) + Number(pago?.recargo ?? cobro.recargoPago ?? 0);
                return (
                  <div
                    key={cobro.detallePagoId}
                    className="rounded-lg bg-white border border-transparent px-3 py-2.5 space-y-1.5 cursor-pointer hover:bg-slate-50/80"
                    onClick={() => onVerDetalle?.(pago || { pagoId: cobro.pagoId })}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800">
                          A esta cuota: {formatPrecio(cobro.monto)}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatFechaHora(cobro.fechaHora)}
                          {cobro.adelantado ? " · Adelanto" : ""}
                          {pago?.metodoDePagoNombre ? ` · ${pago.metodoDePagoNombre}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          title="Ver detalle"
                          onClick={() => onVerDetalle?.(pago || { pagoId: cobro.pagoId })}
                          className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          title="Ver recibo del pago"
                          onClick={() => onVerRecibo?.(pago || cobro)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-brand-muted disabled:opacity-40 transition-colors"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="rounded-md bg-gray-50 border border-transparent px-2.5 py-1.5">
                      <p className="text-[11px] text-gray-600">
                        <span className="font-semibold text-gray-800">Pago #{cobro.pagoId}</span>
                        {cobro.reciboNumero || pago?.reciboNumero
                          ? ` · Recibo ${cobro.reciboNumero || pago.reciboNumero}`
                          : ""}
                        {" · "}
                        Total transacción {formatPrecio(totalPago || cobro.monto)}
                      </p>
                      {multi ? (
                        <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                          Engloba {detalles.length} períodos:{" "}
                          {detalles.map((d) => d.periodoLabel).filter(Boolean).join(" · ")}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Una sola cuota en esta transacción
                        </p>
                      )}
                      {Number(pago?.recargo ?? cobro.recargoPago) > 0 && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          Recargo del pago: {formatPrecio(pago?.recargo ?? cobro.recargoPago)}
                        </p>
                      )}
                    </div>
                    {cobro.observacion && (
                      <p className="text-[11px] text-gray-400">{cobro.observacion}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Lista de pagos = transacciones (no filas por período). */
function PagosTransaccionList({ pagos, onVerRecibo, onVerDetalle, reciboBusyId }) {
  if (pagos.length === 0) {
    return <div className="py-10 text-center text-sm text-gray-400">Sin pagos registrados</div>;
  }

  return (
    <div className="divide-y divide-gray-50">
      {pagos.map((pago) => {
        const busy = reciboBusyId === pago.pagoId;
        const detalles = pago.detalles || [];
        const total = Number(pago.monto || 0) + Number(pago.recargo || 0);
        return (
          <div
            key={pago.pagoId}
            className="px-5 py-3.5 hover:bg-slate-50/50 cursor-pointer"
            onClick={() => onVerDetalle?.(pago)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">Pago #{pago.pagoId}</p>
                  {pago.reciboNumero && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Recibo {pago.reciboNumero}
                    </span>
                  )}
                  {detalles.some((d) => d.adelantado) && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-muted text-brand">
                      Adelanto
                    </span>
                  )}
                  {detalles.length > 1 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {detalles.length} ítems
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatFechaHora(pago.fechaHoraCarga)}
                  {pago.metodoDePagoNombre ? ` · ${pago.metodoDePagoNombre}` : ""}
                </p>
                {pago.observacion && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{pago.observacion}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="text-right mr-1">
                  <p className="text-sm font-semibold text-gray-900">{formatPrecio(total)}</p>
                  {Number(pago.recargo) > 0 && (
                    <p className="text-[10px] text-amber-600">
                      incl. {formatPrecio(pago.recargo)} recargo
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  title="Ver detalle"
                  onClick={() => onVerDetalle?.(pago)}
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Eye size={14} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  title="Ver recibo"
                  onClick={() => onVerRecibo?.(pago)}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-brand-muted disabled:opacity-40 transition-colors"
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
                </button>
              </div>
            </div>
            {detalles.length > 0 && (
              <div className="mt-2 ml-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                {detalles.map((d) => (
                  <div
                    key={d.detallePagoId}
                    className="flex items-center justify-between gap-3 text-xs text-gray-500"
                  >
                    <span className="capitalize">{d.periodoLabel || "Período"}</span>
                    <span className="font-medium text-gray-700 tabular-nums">
                      {formatPrecio(d.monto)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PagosAbono() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [abono, setAbono] = useState(/** @type {Abono | null} */ (null));
  const [cuotas, setCuotas] = useState(/** @type {Cuota[]} */ ([]));
  const [cargosImpagos, setCargosImpagos] = useState(/** @type {{ importe: number, pagado?: boolean }[]} */ ([]));
  const [pagos, setPagos] = useState(/** @type {Pago[]} */ ([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalPago, setModalPago] = useState(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [pagoDetalle, setPagoDetalle] = useState(null);
  const [expandidas, setExpandidas] = useState(() => new Set());
  const [reciboBusyId, setReciboBusyId] = useState(null);
  const [avisoRecibo, setAvisoRecibo] = useState(null);
  const [contratoBusy, setContratoBusy] = useState(false);
  const [avisoContrato, setAvisoContrato] = useState(null);
  const [vista, setVista] = useState("cuotas");
  const [filtroCuota, setFiltroCuota] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionCuotas, setSeleccionCuotas] = useState(() => new Set());
  const [modoMultiPago, setModoMultiPago] = useState(false);
  const [revisionCargos, setRevisionCargos] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    try {
      setLoading(true);
      const [abonoData, cuotasData, pagosData, futura, cargosData] = await Promise.all([
        abonoService.getById(id),
        pagoService.getCuotas(id),
        pagoService.getByAbono(id),
        pagoService.getCuotaFutura(id).catch(() => null),
        operacionFinancieraService.cargosPorAbono(id).catch(() => []),
      ]);
      setAbono(abonoData);
      const lista = cuotasData || [];
      if (futura && !lista.some((c) => c.periodoInicio === futura.periodoInicio))
        lista.push(futura);
      setCuotas(lista);
      setPagos(Array.isArray(pagosData) ? pagosData : []);
      setCargosImpagos(
        (Array.isArray(cargosData) ? cargosData : []).filter(
          (c) => !c.pagado && Number(c.estado) !== 2
        )
      );
      setSeleccionCuotas(new Set());
      setModoMultiPago(false);

      const parciales = new Set(
        (cuotasData || [])
          .filter((c) => c.estado === 1 || (c.cobros || []).length > 0)
          .filter((c) => c.estado !== 2)
          .map((c) => `${c.periodoInicio}`)
      );
      setExpandidas(parciales);
      setRevisionCargos((n) => n + 1);
    } catch (err) {
      setError(err.response?.data || err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  const cuotasCobrables = useMemo(
    () => cuotas.filter((c) => !c.esFuturo && Number(c.saldo) > 0 && c.estado !== 2 && c.estado !== 3),
    [cuotas]
  );

  const cuotasSeleccionadas = useMemo(() => {
    return cuotasCobrables
      .filter((c) => seleccionCuotas.has(`${c.periodoInicio}`))
      .sort((a, b) => String(a.periodoInicio).localeCompare(String(b.periodoInicio)));
  }, [cuotasCobrables, seleccionCuotas]);

  const totalSeleccion = cuotasSeleccionadas.reduce((acc, c) => acc + Number(c.saldo || 0), 0);

  const desgloseTarifas = useMemo(() => {
    const conDetalle = cuotas.filter(
      (c) => Array.isArray(c.componentesTarifa) && c.componentesTarifa.length > 0
    );
    if (conDetalle.length === 0) return null;
    const hoy = new Date().toISOString().slice(0, 10);
    const dia = (value) => String(value || "").slice(0, 10);
    const actual =
      conDetalle.find((c) => dia(c.periodoInicio) <= hoy && dia(c.periodoFin) >= hoy) ||
      [...conDetalle].reverse().find((c) => !c.esFuturo) ||
      conDetalle[conDetalle.length - 1];
    return {
      esPrecioAcordado: !!actual.esPrecioAcordado,
      componentes: actual.componentesTarifa,
      total: actual.componentesTarifa.reduce((a, x) => a + Number(x.precio || 0), 0),
    };
  }, [cuotas]);

  function toggleModoMultiPago() {
    setModoMultiPago((prev) => {
      if (prev) setSeleccionCuotas(new Set());
      return !prev;
    });
  }

  function toggleSeleccionCuota(cuota) {
    const key = `${cuota.periodoInicio}`;
    setSeleccionCuotas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function generarPagoMultiple() {
    if (cuotasSeleccionadas.length === 0) return;
    if (cuotasSeleccionadas.length === 1) {
      setModalPago({ cuota: cuotasSeleccionadas[0], cuotas: null });
      return;
    }
    setModalPago({ cuota: null, cuotas: cuotasSeleccionadas });
  }

  async function anularCuota(cuota) {
    const label = cuota.periodoLabel || "este período";
    if (!window.confirm(`¿Anular la cuota de ${label}? Deja de ser deuda y no se vuelve a generar.`))
      return;
    try {
      await pagoService.anularCuota(id, {
        cuotaId: cuota.cuotaId || null,
        periodoInicio: String(cuota.periodoInicio).split("T")[0],
      });
      await cargarDatos();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : err.message || "No se pudo anular la cuota");
    }
  }

  async function anularCargo(cargo) {
    if (!window.confirm("¿Anular este cargo? Deja de ser deuda.")) return;
    try {
      await operacionFinancieraService.anularCargo(cargo.cargoId);
      await cargarDatos();
    } catch (err) {
      const msg = err.response?.data;
      setError(typeof msg === "string" ? msg : err.message || "No se pudo anular el cargo");
    }
  }

  const q = busqueda.trim().toLowerCase();

  const cuotasFiltradas = useMemo(() => {
    return cuotas.filter((c) => {
      const clase = clasificarCuota(c);
      if (filtroCuota === "conCobros" && !(c.cobros || []).length) return false;
      if (filtroCuota !== "todos" && filtroCuota !== "conCobros" && clase !== filtroCuota) return false;
      if (!q) return true;
      const hayCobroMatch = (c.cobros || []).some(
        (cobro) =>
          String(cobro.pagoId).includes(q) ||
          String(cobro.reciboNumero || "").toLowerCase().includes(q) ||
          String(cobro.observacion || "").toLowerCase().includes(q)
      );
      return (
        String(c.periodoLabel || "").toLowerCase().includes(q) ||
        String(c.periodoInicio || "").includes(q) ||
        hayCobroMatch
      );
    });
  }, [cuotas, filtroCuota, q]);

  const pagosById = useMemo(() => {
    const map = new Map();
    for (const p of pagos) map.set(p.pagoId, p);
    return map;
  }, [pagos]);

  const pagosFiltrados = useMemo(() => {
    const list = [...pagos].sort(
      (a, b) => new Date(b.fechaHoraCarga) - new Date(a.fechaHoraCarga)
    );
    if (!q) return list;
    return list.filter((p) => {
      const periodos = (p.detalles || []).map((d) => d.periodoLabel).join(" ");
      return (
        String(p.pagoId).includes(q) ||
        String(p.reciboNumero || "").toLowerCase().includes(q) ||
        String(p.observacion || "").toLowerCase().includes(q) ||
        String(p.metodoDePagoNombre || "").toLowerCase().includes(q) ||
        periodos.toLowerCase().includes(q)
      );
    });
  }, [pagos, q]);

  const deudaMonto =
    cuotasCobrables.reduce((acc, c) => acc + Number(c.saldo || 0), 0) +
    cargosImpagos.reduce((acc, c) => acc + Number(c.importe || 0), 0);
  const totalRecaudado = pagos.reduce(
    (acc, p) => acc + Number(p.monto || 0) + Number(p.recargo || 0),
    0
  );

  function toggleExpand(key) {
    setExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleVerRecibo(ref) {
    try {
      const pagoId = ref.pagoId;
      setReciboBusyId(pagoId);
      setAvisoRecibo(null);
      const [recibo, datos] = await Promise.all([
        ref.reciboId
          ? reciboService.getById(ref.reciboId)
          : reciboService.getByPago(pagoId),
        estacionamientoService.get().catch(() => null),
      ]);
      imprimirReciboPdf(recibo, {
        nombreEstacionamiento: datos?.nombre,
        direccion: datos?.direccion,
      });
    } catch (err) {
      const msg = err.response?.data;
      setAvisoRecibo(typeof msg === "string" ? msg : "No se pudo abrir el recibo de este pago");
    } finally {
      setReciboBusyId(null);
    }
  }

  async function handleDescargarContrato() {
    try {
      setContratoBusy(true);
      setAvisoContrato(null);
      await abonoService.descargarContrato(id);
    } catch (err) {
      setAvisoContrato(err.message || "No se pudo generar el contrato");
    } finally {
      setContratoBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink-faint text-sm p-8">
        <Loader2 size={16} className="animate-spin" /> Cargando...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-danger text-sm p-8">
        <AlertCircle size={16} /> {typeof error === "string" ? error : "Error al cargar"}
      </div>
    );
  }

  const esActivo = abono.activo === true || abono.activo === "true";
  const plazas = plazasDe(abono);
  const vehiculos = vehiculosDe(abono);
  const primeraCat = plazas[0]?.cochera?.categoriaCochera?.nombre;
  const tituloPlaza =
    plazas.length > 1
      ? `Cocheras ${labelCocheras(abono)}`
      : `Cochera ${labelCocheras(abono)}`;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <button
        type="button"
        onClick={() => navigate("/abonos")}
        className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={16} /> Volver a abonos
      </button>

      {!esActivo && (
        <div className="flex items-center gap-2 px-4 py-3 bg-surface-muted text-ink text-sm font-medium">
          <Ban size={16} className="text-ink-muted" />
          <span>
            Este abono se encuentra <strong>inactivo / dado de baja</strong>. No se pueden
            registrar nuevos movimientos.
          </span>
        </div>
      )}

      {(avisoRecibo || avisoContrato) && (
        <div className="space-y-2">
          {avisoRecibo && (
            <div className="flex items-center gap-2 px-4 py-3 bg-danger-muted text-danger-ink text-sm">
              <AlertCircle size={16} />
              <span className="flex-1">{avisoRecibo}</span>
              <button
                type="button"
                onClick={() => setAvisoRecibo(null)}
                className="text-xs font-semibold underline"
              >
                Cerrar
              </button>
            </div>
          )}
          {avisoContrato && (
            <div className="flex items-center gap-2 px-4 py-3 bg-danger-muted text-danger-ink text-sm">
              <AlertCircle size={16} />
              <span className="flex-1">{avisoContrato}</span>
              <button
                type="button"
                onClick={() => setAvisoContrato(null)}
                className="text-xs font-semibold underline"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

      <PageHeader
        title={tituloPlaza}
        description={[
          abono.cliente?.nombre,
          periodicidadLabel(abono.periodicidadCobro),
          primeraCat,
          esActivo ? "Activo" : "De baja",
        ]
          .filter(Boolean)
          .join(" · ")}
        loading={false}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {esActivo && (
              <button
                type="button"
                onClick={() => setModalEditar(true)}
                title="Editar abono"
                className="p-2.5 text-ink-faint hover:text-ink hover:bg-surface-muted transition-colors"
              >
                <Pencil size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={handleDescargarContrato}
              disabled={contratoBusy}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-ink bg-surface-muted hover:bg-brand-muted transition-colors disabled:opacity-60"
            >
              {contratoBusy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <FileText size={13} />
              )}
              Contrato
            </button>
            {esActivo && (cuotasCobrables.length > 0 || cargosImpagos.length > 0) && !modoMultiPago && (
              <PageHeaderAction
                onClick={() =>
                  setModalPago({
                    deudas: [
                      ...cuotasCobrables.map((c) => ({
                        key: `cuota-${c.cuotaId ?? c.periodoInicio}`,
                        tipo: "cuota",
                        label: c.periodoLabel,
                        saldo: Number(c.saldo),
                        cuota: c,
                      })),
                      ...cargosImpagos.map((c) => ({
                        key: `cargo-${c.cargoId}`,
                        tipo: "cargo",
                        label: c.concepto,
                        saldo: Number(c.importe),
                        cargo: c,
                      })),
                    ],
                  })
                }
              >
                <Wallet size={14} /> Pagar
              </PageHeaderAction>
            )}
          </div>
        }
        stats={[
          { label: "Cobrado", value: formatPrecio(totalRecaudado) },
          {
            label: "Deuda",
            value: formatPrecio(deudaMonto),
            tone: deudaMonto > 0 ? "danger" : "default",
          },
          { label: "Pagos", value: pagos.length },
        ]}
      />

      <div className="bg-surface-card px-4 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="flex items-start gap-2">
          <User size={14} className="text-ink-faint mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="pk-label">Cliente</p>
            <p className="text-sm font-semibold text-ink truncate">
              {abono.cliente?.nombre || "—"}
            </p>
            {abono.cliente?.telefono && (
              <p className="text-xs text-ink-faint">{abono.cliente.telefono}</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Car size={14} className="text-ink-faint mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="pk-label">Vehículos</p>
            {vehiculos.length === 0 ? (
              <p className="text-sm text-ink-faint">Sin vehículos</p>
            ) : (
              <div className="space-y-1 mt-0.5">
                {vehiculos.map((v, i) => (
                  <div
                    key={v.abonoVehiculoId ?? `${v.patente}-${i}`}
                    className="flex items-center gap-1 flex-wrap"
                  >
                    <span className="font-mono text-[11px] font-bold bg-surface-muted px-1.5 py-0.5">
                      {v.patente || "S/PAT"}
                    </span>
                    {nombreTipoVehiculo(v) && (
                      <span className="text-[11px] font-semibold text-ink-muted">
                        {nombreTipoVehiculo(v)}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-ink-muted">
                      {modalidadLabel(v.modalidad)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Calendar size={14} className="text-ink-faint mt-0.5 shrink-0" />
          <div>
            <p className="pk-label">Ingreso / cobro</p>
            <p className="text-sm font-semibold text-ink">{formatFecha(abono.fechaInicio)}</p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Cobro {formatFecha(abono.fechaInicioCobro || abono.fechaInicio)}
            </p>
          </div>
        </div>
        <div>
          <p className="pk-label">Periodicidad</p>
          <p className="text-sm font-semibold text-ink">
            {periodicidadLabel(abono.periodicidadCobro)}
          </p>
        </div>
        <div>
          <p className="pk-label">Precio período</p>
          <p className="text-sm font-semibold text-ink">
            {abono.precioAcordado
              ? formatPrecio(abono.precioAcordado)
              : desgloseTarifas
                ? formatPrecio(desgloseTarifas.total)
                : "Tarifa de lista"}
          </p>
          {abono.cobrador && (
            <p className="text-[11px] text-ink-faint mt-0.5">Cobrador: {abono.cobrador}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-start">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-end gap-1 px-2">
            {VISTAS.map((v) => {
              const activa = vista === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVista(v.id)}
                  className={`px-4 py-2 text-xs font-semibold border border-b-0 -mb-px ${
                    activa
                      ? "bg-surface-card text-ink border-line"
                      : "bg-surface-muted text-ink-muted border-transparent hover:text-ink"
                  }`}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
          <div className="bg-surface-card border border-line overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-line space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-ink-faint">
                {vista === "cuotas"
                  ? modoMultiPago
                    ? `${cuotasFiltradas.length} de ${cuotas.length} períodos · seleccioná cuotas y generá el pago`
                    : `${cuotasFiltradas.length} de ${cuotas.length} períodos`
                  : vista === "pagos"
                    ? `${pagosFiltrados.length} pago${pagosFiltrados.length === 1 ? "" : "s"}`
                    : "Obligaciones y devoluciones de este abono"}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {esActivo && cuotasCobrables.length > 1 && vista === "cuotas" && (
                  <button
                    type="button"
                    onClick={toggleModoMultiPago}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 transition-colors ${
                      modoMultiPago
                        ? "bg-brand-muted text-ink"
                        : "bg-surface-muted text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Banknote size={13} />
                    {modoMultiPago ? "Cancelar múltiple" : "Pagar múltiples"}
                  </button>
                )}
                {esActivo && modoMultiPago && cuotasSeleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={generarPagoMultiple}
                    className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-foreground text-xs font-medium px-3 py-2 transition-colors"
                  >
                    <Wallet size={13} />
                    Generar pago ({cuotasSeleccionadas.length}) · {formatPrecio(totalSeleccion)}
                  </button>
                )}
              </div>
            </div>

            {vista !== "extras" && (
            <div className="flex items-center gap-2 flex-wrap">
              <SearchField
                value={busqueda}
                onChange={setBusqueda}
                placeholder={
                  vista === "cuotas"
                    ? "Buscar período, pago…"
                    : "Buscar pago, recibo, período…"
                }
                className="flex-1 min-w-[180px] max-w-xs"
              />
              {vista === "cuotas" && (
                <FilterSelect
                  ariaLabel="Filtrar cuotas"
                  value={filtroCuota}
                  onChange={setFiltroCuota}
                  options={FILTROS_CUOTA.map((f) => ({ value: f.id, label: f.label }))}
                />
              )}
            </div>
            )}
          </div>

          {vista === "cuotas" ? (
            cuotas.length === 0 ? (
              <div className="py-10 text-center text-sm text-ink-faint">Sin períodos</div>
            ) : cuotasFiltradas.length === 0 ? (
              <div className="py-10 text-center text-sm text-ink-faint">
                Sin períodos para este filtro
              </div>
            ) : (
              <div>
                {cuotasFiltradas.map((c) => {
                  const key = `${c.periodoInicio}`;
                  return (
                    <CuotaTimelineItem
                      key={key}
                      cuota={c}
                      esActivo={esActivo}
                      expandido={expandidas.has(key)}
                      onToggle={() => toggleExpand(key)}
                      onCobrar={(cuota) => setModalPago({ cuota, cuotas: null })}
                      onAnular={anularCuota}
                      onVerRecibo={handleVerRecibo}
                      onVerDetalle={setPagoDetalle}
                      reciboBusyId={reciboBusyId}
                      modoMulti={modoMultiPago}
                      seleccionada={seleccionCuotas.has(key)}
                      onToggleSeleccion={() => toggleSeleccionCuota(c)}
                      pagosById={pagosById}
                    />
                  );
                })}
              </div>
            )
          ) : vista === "pagos" ? (
            <PagosTransaccionList
              pagos={pagosFiltrados}
              onVerRecibo={handleVerRecibo}
              onVerDetalle={setPagoDetalle}
              reciboBusyId={reciboBusyId}
            />
          ) : (
            abono && (
              <CargosReintegrosAbono
                abono={abono}
                pagos={pagos}
                revision={revisionCargos}
                onPagarCargo={(cargo) =>
                  setModalPago({ cuota: null, cuotas: null, cargo })
                }
                onAnularCargo={anularCargo}
                onVerDetalle={setPagoDetalle}
                onVerRecibo={handleVerRecibo}
                reciboBusyId={reciboBusyId}
              />
            )
          )}
          </div>
        </div>

        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-20 space-y-3">
          <DocumentosAbono abono={abono} />

          <aside className="bg-surface-card border border-line overflow-hidden">
            <div className="px-3.5 py-3 border-b border-line flex items-center gap-2">
              <ParkingSquare size={15} className="text-ink-faint shrink-0" />
              <div className="min-w-0">
                <h2 className="text-xs font-bold text-ink tracking-tight">Cocheras</h2>
                <p className="text-[10px] text-ink-faint">
                  {plazas.length} vinculada{plazas.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {plazas.length === 0 ? (
              <p className="px-3.5 py-4 text-xs text-ink-faint text-center">Sin plazas</p>
            ) : (
              <ul className="divide-y divide-line">
                {plazas.map((p) => {
                  const num = p.cochera?.numero ?? p.cocheraId;
                  const cat =
                    p.cochera?.categoriaCochera?.nombre ||
                    p.cochera?.categoriaNombre ||
                    null;
                  const vehiculoFijo = vehiculos.find((v) => {
                    if (Number(v.modalidad) === MODALIDAD.FLEXIBLE) return false;
                    if (p.abonoPlazaId && v.abonoPlazaId === p.abonoPlazaId) return true;
                    const vCocheraId = v.plaza?.cocheraId ?? v.cocheraId;
                    const pCocheraId = p.cocheraId ?? p.cochera?.cocheraId;
                    if (vCocheraId && pCocheraId && Number(vCocheraId) === Number(pCocheraId)) {
                      return true;
                    }
                    const vNum = v.plaza?.numero ?? v.plaza?.cochera?.numero;
                    if (vNum != null && String(vNum) === String(num)) return true;
                    return false;
                  });
                  const vinculo = vehiculoFijo
                    ? vehiculoFijo.patente || "Sin patente"
                    : "Flexible";

                  return (
                    <li key={p.abonoPlazaId ?? p.cocheraId ?? num}>
                      <button
                        type="button"
                        onClick={() => navigate("/cocheras")}
                        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-surface-muted transition-colors group"
                        title="Ir a cocheras"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink tabular-nums leading-none">
                            {num}
                          </p>
                          <p className="text-[10px] text-ink-muted mt-1 truncate">
                            {vehiculoFijo ? (
                              <span className="font-mono font-semibold text-ink">
                                {vinculo}
                                {nombreTipoVehiculo(vehiculoFijo)
                                  ? ` · ${nombreTipoVehiculo(vehiculoFijo)}`
                                  : ""}
                              </span>
                            ) : (
                              <span className="font-semibold text-warning-ink">Flexible</span>
                            )}
                            {cat ? (
                              <span className="text-ink-faint"> · {cat}</span>
                            ) : null}
                          </p>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-ink-faint group-hover:text-ink shrink-0 transition-colors"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </div>

      {modalPago && (
        <ModalRegistrarPago
          abono={abono}
          cuota={modalPago.cuota || null}
          cuotas={modalPago.cuotas || null}
          cuotasPendientes={cuotasCobrables}
          cargo={modalPago.cargo || null}
          deudas={modalPago.deudas || null}
          onClose={() => setModalPago(null)}
          onRegistrado={() => {
            setModalPago(null);
            setSeleccionCuotas(new Set());
            setModoMultiPago(false);
            cargarDatos();
          }}
        />
      )}
      {modalEditar && (
        <ModalEditarAbono
          abono={abono}
          onClose={() => setModalEditar(false)}
          onGuardado={() => {
            setModalEditar(false);
            cargarDatos();
          }}
        />
      )}
      {pagoDetalle && (
        <ModalDetallePago
          pago={pagoDetalle}
          pagoId={pagoDetalle.pagoId}
          onClose={() => setPagoDetalle(null)}
          onVerRecibo={(pago) => {
            setPagoDetalle(null);
            handleVerRecibo(pago);
          }}
        />
      )}
    </div>
  );
}
