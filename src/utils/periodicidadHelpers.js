/** PeriodicidadCobro (backend enum). */
export const PERIODICIDAD = {
  MENSUAL: 0,
  QUINCENAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 4,
  ANUAL: 5,
};

export const PERIODICIDAD_OPTIONS = [
  { value: PERIODICIDAD.MENSUAL, label: "Mensual" },
  { value: PERIODICIDAD.QUINCENAL, label: "Quincenal" },
  { value: PERIODICIDAD.BIMESTRAL, label: "Bimestral" },
  { value: PERIODICIDAD.TRIMESTRAL, label: "Trimestral" },
  { value: PERIODICIDAD.SEMESTRAL, label: "Semestral" },
  { value: PERIODICIDAD.ANUAL, label: "Anual" },
];

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function toDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** @returns {{ inicio: Date, fin: Date }} */
export function periodoQueContiene(fecha, periodicidad) {
  const d = toDateOnly(fecha);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const p = Number(periodicidad);

  if (p === PERIODICIDAD.QUINCENAL) {
    if (day <= 15) {
      return { inicio: new Date(y, m, 1), fin: new Date(y, m, 15) };
    }
    return { inicio: new Date(y, m, 16), fin: new Date(y, m, daysInMonth(y, m)) };
  }

  if (p === PERIODICIDAD.ANUAL) {
    return { inicio: new Date(y, 0, 1), fin: new Date(y, 11, 31) };
  }

  const mesesGrupo =
    p === PERIODICIDAD.BIMESTRAL ? 2
    : p === PERIODICIDAD.TRIMESTRAL ? 3
    : p === PERIODICIDAD.SEMESTRAL ? 6
    : 1;

  if (mesesGrupo > 1) {
    const mesInicioGrupo = Math.floor(m / mesesGrupo) * mesesGrupo;
    const inicio = new Date(y, mesInicioGrupo, 1);
    const finMes = new Date(y, mesInicioGrupo + mesesGrupo - 1, 1);
    const fin = new Date(finMes.getFullYear(), finMes.getMonth(), daysInMonth(finMes.getFullYear(), finMes.getMonth()));
    return { inicio, fin };
  }

  // Mensual
  return {
    inicio: new Date(y, m, 1),
    fin: new Date(y, m, daysInMonth(y, m)),
  };
}

export function siguientePeriodo(inicioActual, finActual, periodicidad) {
  const next = new Date(finActual.getFullYear(), finActual.getMonth(), finActual.getDate() + 1);
  return periodoQueContiene(next, periodicidad);
}

/**
 * FechaInicioCobro a enviar al API.
 * - Si diferirPeriodo: arranca en el período siguiente al del ingreso (sin prorrateo del actual).
 * - Si no: arranca en el período que contiene el ingreso (puede prorratearse en backend).
 */
export function calcularFechaInicioCobro(fechaIngreso, periodicidad, diferirPeriodo) {
  const actual = periodoQueContiene(fechaIngreso, periodicidad);
  if (!diferirPeriodo) return actual.inicio;
  return siguientePeriodo(actual.inicio, actual.fin, periodicidad).inicio;
}

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatearPeriodoLabel(inicio, fin, periodicidad) {
  const p = Number(periodicidad);
  const i = toDateOnly(inicio);
  const f = toDateOnly(fin);

  if (p === PERIODICIDAD.QUINCENAL) {
    const mitad = i.getDate() <= 15 ? "1ª quincena" : "2ª quincena";
    return `${mitad} ${MESES_ES[i.getMonth()]} ${i.getFullYear()}`;
  }
  if (p === PERIODICIDAD.MENSUAL) {
    return `${MESES_ES[i.getMonth()]} ${i.getFullYear()}`;
  }

  const di = String(i.getDate()).padStart(2, "0");
  const mi = String(i.getMonth() + 1).padStart(2, "0");
  const df = String(f.getDate()).padStart(2, "0");
  const mf = String(f.getMonth() + 1).padStart(2, "0");
  return `${di}/${mi}/${i.getFullYear()} – ${df}/${mf}/${f.getFullYear()}`;
}

export function formatDateYmd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Espejo de DatosEstacionamiento.CalcularMontoPrimeraCuota (preview UI). */
export function calcularMontoPrimeraCuota({
  montoBase,
  fechaIngreso,
  fechaInicioCobro,
  periodicidad,
  diasUmbralProporcional,
}) {
  const base = Number(montoBase) || 0;
  if (base <= 0) return 0;

  if (Number(periodicidad) !== PERIODICIDAD.MENSUAL) return base;

  const periodoCobro = periodoQueContiene(fechaInicioCobro, periodicidad);
  const periodoIngreso = periodoQueContiene(fechaIngreso, periodicidad);
  if (periodoCobro.inicio.getTime() !== periodoIngreso.inicio.getTime()) return base;

  if (diasUmbralProporcional == null || diasUmbralProporcional === "") return base;

  const umbral = Number(diasUmbralProporcional);
  const dia = fechaIngreso.getDate();
  if (dia <= umbral) return base;

  const y = fechaIngreso.getFullYear();
  const m = fechaIngreso.getMonth();
  const diasMes = new Date(y, m + 1, 0).getDate();
  const diasRestantes = diasMes - dia + 1;
  return Math.round((base / diasMes) * diasRestantes);
}
