import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Car, Calendar, User, Check, AlertCircle, Loader2, Pencil, Plus,
  TrendingUp, TrendingDown, Ban, Wallet, ChevronDown, ChevronRight, Receipt, Search, Banknote,
} from "lucide-react";
import { abonoService } from "../services/abonoService";
import { pagoService } from "../services/pagoService";
import { cajaMensualService } from "../services/cajaMensualService";
import { reciboService } from "../services/reciboService";
import { estacionamientoService } from "../services/estacionamientoService";
import { imprimirReciboPdf } from "../utils/imprimirRecibo";
import ModalRegistrarPago from "../components/layout/ModalRegistrarPago";
import ModalEditarAbono from "../components/layout/ModalEditarAbono";
import ModalCargoReintegro from "../components/layout/ModalCargoReintegro";
import { labelCocheras, plazasDe, vehiculosDe, modalidadLabel, MODALIDAD } from "../utils/abonoHelpers";
import { PERIODICIDAD_OPTIONS } from "../utils/periodicidadHelpers";

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

const TABS = [
  { id: "pagos", label: "Cuotas y pagos" },
  { id: "cargos", label: "Cargos y reintegros" },
];

const VISTAS = [
  { id: "cuotas", label: "Ver cuotas" },
  { id: "pagos", label: "Ver pagos" },
];

const FILTROS_CUOTA = [
  { id: "todos", label: "Todos" },
  { id: "pendiente", label: "Pendientes" },
  { id: "parcial", label: "Parciales" },
  { id: "pagada", label: "Pagadas" },
  { id: "futuro", label: "Futuros" },
  { id: "conCobros", label: "Con cobros" },
];

function clasificarCuota(c) {
  if (c.esFuturo && c.estado !== 2 && Number(c.montoPagado) <= 0) return "futuro";
  if (c.estado === 2 || (Number(c.saldo) <= 0 && Number(c.montoPagado) > 0)) return "pagada";
  if (c.estado === 1 || Number(c.montoPagado) > 0) return "parcial";
  return "pendiente";
}

function estiloCuota(c) {
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
  onVerRecibo,
  reciboBusyId,
  modoMulti,
  seleccionada,
  onToggleSeleccion,
  pagosById,
}) {
  const estilo = estiloCuota(cuota);
  const cobrable = esActivo && !cuota.esFuturo && Number(cuota.saldo) > 0 && cuota.estado !== 2;
  const pct =
    Number(cuota.monto) > 0
      ? Math.min(100, Math.round((Number(cuota.montoPagado) / Number(cuota.monto)) * 100))
      : 0;
  const tieneCobros = (cuota.cobros || []).length > 0;
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
          <input
            type="checkbox"
            checked={seleccionada}
            onChange={onToggleSeleccion}
            title="Incluir en pago múltiple"
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 shrink-0"
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

          {cobrable && cuota.estado === 0 && (
            <p className="text-xs text-gray-400 mt-0.5">Saldo {formatPrecio(cuota.saldo)}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!modoMulti && cobrable ? (
            <button
              onClick={() => onCobrar(cuota)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Cobrar
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
                    className="rounded-lg bg-white border border-gray-100 px-3 py-2.5 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800">
                          A esta cuota: {formatPrecio(cobro.monto)}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatFechaHora(cobro.fechaHora)}
                          {pago?.metodoDePagoNombre ? ` · ${pago.metodoDePagoNombre}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        title="Ver recibo del pago"
                        onClick={() => onVerRecibo?.(pago || cobro)}
                        className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-brand-muted disabled:opacity-40 transition-colors shrink-0"
                      >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
                      </button>
                    </div>
                    <div className="rounded-md bg-gray-50 border border-gray-100 px-2.5 py-1.5">
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
function PagosTransaccionList({ pagos, onVerRecibo, reciboBusyId }) {
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
          <div key={pago.pagoId} className="px-5 py-3.5 hover:bg-slate-50/50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">Pago #{pago.pagoId}</p>
                  {pago.reciboNumero && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Recibo {pago.reciboNumero}
                    </span>
                  )}
                  {detalles.length > 1 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {detalles.length} períodos
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
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatPrecio(total)}</p>
                  {Number(pago.recargo) > 0 && (
                    <p className="text-[10px] text-amber-600">
                      incl. {formatPrecio(pago.recargo)} recargo
                    </p>
                  )}
                </div>
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
  const [tab, setTab] = useState("pagos");
  const [abono, setAbono] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalPago, setModalPago] = useState(null);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalCargo, setModalCargo] = useState(false);
  const [expandidas, setExpandidas] = useState(() => new Set());
  const [reciboBusyId, setReciboBusyId] = useState(null);
  const [avisoRecibo, setAvisoRecibo] = useState(null);
  const [vista, setVista] = useState("cuotas");
  const [filtroCuota, setFiltroCuota] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [seleccionCuotas, setSeleccionCuotas] = useState(() => new Set());
  const [modoMultiPago, setModoMultiPago] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  async function cargarDatos() {
    try {
      setLoading(true);
      const [abonoData, cuotasData, pagosData, movsData] = await Promise.all([
        abonoService.getById(id),
        pagoService.getCuotas(id),
        pagoService.getByAbono(id),
        cajaMensualService.getMovimientosByAbono(id),
      ]);
      setAbono(abonoData);
      setCuotas(cuotasData || []);
      setPagos(Array.isArray(pagosData) ? pagosData : []);
      setMovimientos(movsData);
      setSeleccionCuotas(new Set());
      setModoMultiPago(false);

      // Expandir parciales por defecto
      const parciales = new Set(
        (cuotasData || [])
          .filter((c) => c.estado === 1 || (c.cobros || []).length > 0)
          .filter((c) => c.estado !== 2)
          .map((c) => `${c.periodoInicio}`)
      );
      setExpandidas(parciales);
    } catch (err) {
      setError(err.response?.data || err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  const cuotasCobrables = useMemo(
    () => cuotas.filter((c) => !c.esFuturo && Number(c.saldo) > 0 && c.estado !== 2),
    [cuotas]
  );

  const cuotasSeleccionadas = useMemo(() => {
    return cuotasCobrables
      .filter((c) => seleccionCuotas.has(`${c.periodoInicio}`))
      .sort((a, b) => String(a.periodoInicio).localeCompare(String(b.periodoInicio)));
  }, [cuotasCobrables, seleccionCuotas]);

  const totalSeleccion = cuotasSeleccionadas.reduce((acc, c) => acc + Number(c.saldo || 0), 0);

  const desgloseTarifas = useMemo(() => {
    const conDetalle = cuotas.find(
      c => Array.isArray(c.componentesTarifa) && c.componentesTarifa.length > 0
    );
    if (!conDetalle) return null;
    return {
      esPrecioAcordado: !!conDetalle.esPrecioAcordado,
      componentes: conDetalle.componentesTarifa,
      total: conDetalle.componentesTarifa.reduce((a, x) => a + Number(x.precio || 0), 0),
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

  const deudaMonto = cuotasCobrables.reduce((acc, c) => acc + Number(c.saldo || 0), 0);
  const totalRecaudado = pagos.reduce(
    (acc, p) => acc + Number(p.monto || 0) + Number(p.recargo || 0),
    0
  );
  const totalCargos = movimientos.filter((m) => m.tipoConcepto === 2).reduce((acc, m) => acc + m.monto, 0);
  const totalReintegros = movimientos.filter((m) => m.tipoConcepto === 1).reduce((acc, m) => acc + m.monto, 0);
  const balance = totalCargos - totalReintegros;

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm p-8">
        <Loader2 size={16} className="animate-spin" /> Cargando...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500 text-sm p-8">
        <AlertCircle size={16} /> {typeof error === "string" ? error : "Error al cargar"}
      </div>
    );
  }

  const esActivo = abono.activo === true || abono.activo === "true";
  const plazas = plazasDe(abono);
  const vehiculos = vehiculosDe(abono);
  const primeraCat = plazas[0]?.cochera?.categoriaCochera?.nombre;

  return (
    <div>
      <button
        onClick={() => navigate("/abonos")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver a abonos
      </button>

      {!esActivo && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200 font-medium">
          <Ban size={16} className="text-gray-500" />
          <span>
            Este abono se encuentra <strong>Inactivo / Dado de baja</strong>. No se pueden registrar nuevos movimientos.
          </span>
        </div>
      )}

      {avisoRecibo && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          <AlertCircle size={16} />
          <span className="flex-1">{avisoRecibo}</span>
          <button type="button" onClick={() => setAvisoRecibo(null)} className="text-xs font-semibold underline">
            Cerrar
          </button>
        </div>
      )}

      {/* Cabecera */}
      <div
        className={`bg-white rounded-xl border p-5 mb-6 ${
          !esActivo ? "border-gray-200 bg-gray-50/30" : "border-gray-100"
        }`}
      >
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-2xl font-bold ${esActivo ? "text-indigo-700" : "text-gray-500 line-through"}`}>
                {plazas.length > 1 ? `Cocheras ${labelCocheras(abono)}` : `Cochera ${labelCocheras(abono)}`}
              </span>
              {primeraCat && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{primeraCat}</span>
              )}
              {esActivo ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                  Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                  De baja
                </span>
              )}
              {esActivo && (
                <button
                  onClick={() => setModalEditar(true)}
                  title="Editar abono"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {cuotasCobrables.length > 0 && esActivo && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-lg">
                  <AlertCircle size={13} />
                  {cuotasCobrables.length} {cuotasCobrables.length === 1 ? "período" : "períodos"} ·{" "}
                  {formatPrecio(deudaMonto)}
                </span>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="text-xs text-gray-400">Total cobrado</p>
            <p className="text-xl font-bold text-gray-900">{formatPrecio(totalRecaudado)}</p>
            {esActivo && cuotasCobrables.length > 0 && !modoMultiPago && (
              <button
                onClick={() => setModalPago({ cuota: cuotasCobrables[0], cuotas: null })}
                className="mt-2 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
              >
                <Wallet size={13} /> Cobrar deuda
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <User size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Cliente</p>
              <p className={`text-sm font-medium ${esActivo ? "text-gray-800" : "text-gray-500"}`}>
                {abono.cliente?.nombre}
              </p>
              {abono.cliente?.telefono && <p className="text-xs text-gray-400">{abono.cliente.telefono}</p>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Car size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Vehículos ({vehiculos.length})</p>
              {vehiculos.length === 0 ? (
                <p className="text-sm text-gray-400">Sin vehículos</p>
              ) : (
                <div className="space-y-1.5 mt-0.5">
                  {vehiculos.map((v, i) => (
                    <div key={v.abonoVehiculoId ?? `${v.patente}-${i}`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {v.patente || "S/PAT"}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                            Number(v.modalidad) === MODALIDAD.FLEXIBLE
                              ? "bg-amber-50 text-amber-700"
                              : "bg-indigo-50 text-indigo-600"
                          }`}
                        >
                          {modalidadLabel(v.modalidad)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {[v.tipoVehiculo?.nombre, v.modeloVehiculo].filter(Boolean).join(" · ") || "—"}
                        {Number(v.modalidad) === MODALIDAD.FIJO && v.plaza?.numero
                          ? ` · Plaza ${v.plaza.numero}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400">Plazas</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {plazas.map((p) => (
                <span
                  key={p.abonoPlazaId ?? p.cocheraId}
                  className="text-xs font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded"
                >
                  {p.cochera?.numero ?? p.cocheraId}
                </span>
              ))}
            </div>
            {plazas.length === 1 && primeraCat && (
              <p className="text-[11px] text-gray-400 mt-0.5">{primeraCat}</p>
            )}
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Ingreso / cobro</p>
              <p className="text-sm font-medium text-gray-800">{formatFecha(abono.fechaInicio)}</p>
              <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
                Cobro {formatFecha(abono.fechaInicioCobro || abono.fechaInicio)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400">Periodicidad</p>
            <p className="text-sm font-medium text-gray-800">
              {periodicidadLabel(abono.periodicidadCobro)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Precio del período</p>
            <p className="text-sm font-medium text-gray-800">
              {abono.precioAcordado
                ? formatPrecio(abono.precioAcordado)
                : desgloseTarifas
                  ? formatPrecio(desgloseTarifas.total)
                  : "Tarifa de lista"}
            </p>
            {abono.precioAcordado ? (
              <p className="text-[11px] text-gray-400 mt-0.5">Precio acordado</p>
            ) : desgloseTarifas ? (
              <ul className="mt-1.5 space-y-0.5">
                {desgloseTarifas.componentes.map((c, i) => (
                  <li key={`${c.vehiculoId}_${i}`} className="text-[11px] text-gray-500">
                    <span className="font-mono font-semibold text-gray-700">{c.patente}</span>
                    {c.cocheraNumero ? ` · Plaza ${c.cocheraNumero}` : ""}
                    {c.tipoVehiculoNombre ? ` · ${c.tipoVehiculoNombre}` : ""}
                    {c.categoriaNombre ? ` · ${c.categoriaNombre}` : ""}
                    {" · "}
                    <span className="font-semibold text-gray-700">{formatPrecio(c.precio)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-gray-400 mt-0.5">Tarifa de lista</p>
            )}
            {abono.cobrador && <p className="text-xs text-gray-400 mt-0.5">Cobrador: {abono.cobrador}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {TABS.map(({ id: tid, label }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tid ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "pagos" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">
                  {vista === "cuotas" ? "Línea de períodos" : "Historial de pagos"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {vista === "cuotas"
                    ? modoMultiPago
                      ? `${cuotasFiltradas.length} de ${cuotas.length} períodos · seleccioná cuotas y generá el pago`
                      : `${cuotasFiltradas.length} de ${cuotas.length} períodos`
                    : `${pagosFiltrados.length} pago${pagosFiltrados.length === 1 ? "" : "s"} (transacciones)`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg">
                  {VISTAS.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVista(v.id)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                        vista === v.id
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
                {esActivo && cuotasCobrables.length > 1 && vista === "cuotas" && (
                  <button
                    type="button"
                    onClick={toggleModoMultiPago}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                      modoMultiPago
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Banknote size={13} />
                    {modoMultiPago ? "Cancelar múltiple" : "Pagar múltiples cuotas"}
                  </button>
                )}
                {esActivo && modoMultiPago && cuotasSeleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={generarPagoMultiple}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <Wallet size={13} />
                    Generar pago ({cuotasSeleccionadas.length}) · {formatPrecio(totalSeleccion)}
                  </button>
                )}
                {esActivo && !modoMultiPago && cuotasCobrables.length > 0 && (
                  <button
                    onClick={() => setModalPago({ cuota: cuotasCobrables[0], cuotas: null })}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                  >
                    <Plus size={13} /> Cobrar
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder={vista === "cuotas" ? "Buscar período, pago…" : "Buscar pago, recibo, período…"}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-indigo-400 focus:bg-white"
                />
              </div>
              {vista === "cuotas" &&
                FILTROS_CUOTA.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroCuota(f.id)}
                    className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                      filtroCuota === f.id
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
            </div>
          </div>

          {vista === "cuotas" ? (
            cuotas.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Sin períodos de cobro</div>
            ) : cuotasFiltradas.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Sin períodos para este filtro</div>
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
                      onVerRecibo={handleVerRecibo}
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
          ) : (
            <PagosTransaccionList
              pagos={pagosFiltrados}
              onVerRecibo={handleVerRecibo}
              reciboBusyId={reciboBusyId}
            />
          )}
        </div>
      )}

      {tab === "cargos" && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={13} className="text-red-400" />
                <p className="text-xs text-gray-400">Cargos</p>
              </div>
              <p className="text-xl font-semibold text-red-500">{formatPrecio(totalCargos)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={13} className="text-green-500" />
                <p className="text-xs text-gray-400">Reintegros</p>
              </div>
              <p className="text-xl font-semibold text-green-600">{formatPrecio(totalReintegros)}</p>
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${
                balance > 0
                  ? "bg-red-50 border-red-100"
                  : balance < 0
                    ? "bg-green-50 border-green-100"
                    : "bg-white border-gray-100"
              }`}
            >
              <p className="text-xs text-gray-400 mb-1">Balance</p>
              <p
                className={`text-xl font-semibold ${
                  balance > 0 ? "text-red-500" : balance < 0 ? "text-green-600" : "text-gray-400"
                }`}
              >
                {balance > 0 ? "+" : ""}
                {formatPrecio(balance)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Cargos y reintegros</h2>
                <p className="text-xs text-gray-400 mt-0.5">{movimientos.length} movimientos</p>
              </div>
              {esActivo && (
                <button
                  onClick={() => setModalCargo(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus size={13} /> Agregar
                </button>
              )}
            </div>

            {movimientos.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">Sin movimientos</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {movimientos.map((mov) => (
                  <div key={mov.movimientoCajaId} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          mov.tipoConcepto === 2 ? "bg-red-400" : "bg-green-400"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800">{mov.descripcion}</p>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-full ${
                              mov.tipoConcepto === 2 ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"
                            }`}
                          >
                            {mov.tipoConceptoDescripcion}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatFechaHora(mov.fechaHora)}
                          {mov.responsable && ` · ${mov.responsable}`}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        mov.tipoConcepto === 2 ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {mov.tipoConcepto === 2 ? "+" : "-"}
                      {formatPrecio(mov.monto)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {modalPago && (
        <ModalRegistrarPago
          abono={abono}
          cuota={modalPago.cuota || null}
          cuotas={modalPago.cuotas || null}
          cuotasPendientes={cuotasCobrables}
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
      {modalCargo && (
        <ModalCargoReintegro
          abono={abono}
          onClose={() => setModalCargo(false)}
          onGuardado={() => {
            setModalCargo(false);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
}
