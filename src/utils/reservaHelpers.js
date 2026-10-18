import { fechaCorta, plata } from "./clienteHelpers";

export const ESTADO_RESERVA = {
  VIGENTE: 0,
  VENCIDA: 1,
  BAJA: 2,
  TRANSFORMADA: 3,
};

export const ESTADO_SENA = {
  PENDIENTE: 0,
  PAGADA: 1,
  ANULADA: 2,
};

export const FILTROS_RESERVA = [
  { value: "vigentes", label: "Vigentes" },
  { value: "sena", label: "Seña" },
  { value: "automaticas", label: "Automáticas" },
  { value: "vencidas", label: "Vencidas" },
  { value: "todas", label: "Todas" },
];

export function nombreReserva(r) {
  return r?.clienteNombre || r?.nombre || "Sin nombre";
}

export function cocherasDe(r) {
  return (r?.cocheras ?? []).map((c) => c.numero).filter(Boolean);
}

export function patentesDe(r) {
  return [...new Set((r?.vehiculos ?? []).map((v) => v.patente).filter(Boolean))];
}

export function senaPendiente(r) {
  return (r?.senas ?? [])
    .filter((s) => Number(s.estado) === ESTADO_SENA.PENDIENTE)
    .reduce((acc, s) => acc + Number(s.importe || 0), 0);
}

export function senaPagada(r) {
  return (r?.senas ?? [])
    .filter((s) => Number(s.estado) === ESTADO_SENA.PAGADA)
    .reduce((acc, s) => acc + Number(s.importe || 0), 0);
}

export function esVigente(r) {
  return Number(r?.estado) === ESTADO_RESERVA.VIGENTE;
}

function hoy() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function diasHasta(fecha) {
  if (!fecha) return null;
  const d = typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? new Date(`${fecha}T00:00:00`) : new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - hoy().getTime()) / 86400000);
}

export function periodoReserva(r) {
  const aInicio = diasHasta(r.fechaInicio);
  const aVence = diasHasta(r.fechaVencimiento);
  if (!esVigente(r)) {
    if (Number(r.estado) === ESTADO_RESERVA.TRANSFORMADA) return "Pasó a abono";
    if (Number(r.estado) === ESTADO_RESERVA.BAJA) return "Dada de baja";
    if (aVence != null && aVence < 0) return `Venció hace ${Math.abs(aVence)} d`;
    return "Vencida";
  }
  if (aInicio != null && aInicio > 0) return `Empieza en ${aInicio} d`;
  if (aInicio === 0) return "Empieza hoy";
  if (aVence != null && aVence < 0) return `Venció hace ${Math.abs(aVence)} d`;
  if (aVence != null && aVence <= 14) return aVence === 0 ? "Vence hoy" : `Vence en ${aVence} d`;
  return `Desde ${fechaCorta(r.fechaInicio)}`;
}

export function estadoSena(r) {
  const debe = senaPendiente(r);
  const cobrada = senaPagada(r);
  if (debe > 0) return { id: "deuda", label: `Seña ${plata(debe)}`, texto: "text-danger-ink" };
  if (cobrada > 0) return { id: "ok", label: "Seña cobrada", texto: "text-success-ink" };
  if (esVigente(r)) return { id: "sin", label: "Sin seña", texto: "text-ink-faint" };
  return { id: "sin", label: "—", texto: "text-ink-faint" };
}

export function bordeReserva(r) {
  if (senaPendiente(r) > 0) return "border-l-danger";
  if (r.automatica && esVigente(r)) return "border-l-warning";
  if (esVigente(r)) return "border-l-brand";
  return "border-l-transparent";
}

export function pasaFiltroReserva(r, filtro, historicos) {
  const estado = Number(r.estado);
  if (!historicos && (estado === ESTADO_RESERVA.BAJA || estado === ESTADO_RESERVA.TRANSFORMADA)) return false;
  if (filtro === "vigentes") return esVigente(r);
  if (filtro === "sena") return senaPendiente(r) > 0;
  if (filtro === "automaticas") return !!r.automatica && (historicos || esVigente(r));
  if (filtro === "vencidas") return estado === ESTADO_RESERVA.VENCIDA;
  return true;
}

const normalizar = (s) => String(s ?? "").toLowerCase().replace(/[\s.-]/g, "");

export function reservaCoincide(r, busqueda) {
  const q = normalizar(busqueda);
  if (!q) return true;
  return [
    nombreReserva(r),
    r.telefono,
    r.email,
    r.observacion,
    ...cocherasDe(r),
    ...patentesDe(r),
  ].some((v) => normalizar(v).includes(q));
}

export function resumenReservas(reservas, historicos = false) {
  const vigentes = reservas.filter(esVigente);
  const conSena = reservas.filter((r) => senaPendiente(r) > 0);
  return {
    vigentes: vigentes.length,
    automaticas: vigentes.filter((r) => r.automatica).length,
    conSena: conSena.length,
    senaTotal: conSena.reduce((s, r) => s + senaPendiente(r), 0),
    cantidades: Object.fromEntries(
      FILTROS_RESERVA.map((f) => [f.value, reservas.filter((r) => pasaFiltroReserva(r, f.value, historicos)).length])
    ),
  };
}
