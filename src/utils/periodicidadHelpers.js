/** PeriodicidadCobro (backend enum). */
export const PERIODICIDAD = {
  MENSUAL: 0,
  QUINCENAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 4,
  ANUAL: 5,
};

/** PoliticaPrimerPeriodo (backend enum). */
export const POLITICA_PRIMER_PERIODO = {
  PRORRATEAR: 0,
  OMITIR_MES_ENTRANTE: 1,
  COMPLETO: 2,
};

export const PERIODICIDAD_OPTIONS = [
  { value: PERIODICIDAD.MENSUAL, label: "Mensual" },
  { value: PERIODICIDAD.QUINCENAL, label: "Quincenal" },
  { value: PERIODICIDAD.BIMESTRAL, label: "Bimestral" },
  { value: PERIODICIDAD.TRIMESTRAL, label: "Trimestral" },
  { value: PERIODICIDAD.SEMESTRAL, label: "Semestral" },
  { value: PERIODICIDAD.ANUAL, label: "Anual" },
];

export const DIA_MAX_SIN_PRORRATEO = 2;

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function toDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function mesesPorCiclo(periodicidad) {
  const p = Number(periodicidad);
  if (p === PERIODICIDAD.BIMESTRAL) return 2;
  if (p === PERIODICIDAD.TRIMESTRAL) return 3;
  if (p === PERIODICIDAD.SEMESTRAL) return 6;
  if (p === PERIODICIDAD.ANUAL) return 12;
  if (p === PERIODICIDAD.MENSUAL) return 1;
  return 0; // quincenal
}

function esAgrupacionMensual(periodicidad) {
  const p = Number(periodicidad);
  return (
    p === PERIODICIDAD.MENSUAL ||
    p === PERIODICIDAD.BIMESTRAL ||
    p === PERIODICIDAD.TRIMESTRAL ||
    p === PERIODICIDAD.SEMESTRAL
  );
}

function anclaDesde(fecha) {
  const d = toDateOnly(fecha);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function floorDiv(a, b) {
  return Math.floor(a / b);
}

/** Ciclo N-meses anclado al mes de inicio del abono. */
function cicloAgrupacion(fecha, n, ancla) {
  const d = toDateOnly(fecha);
  const a = anclaDesde(ancla);
  const monthsFrom =
    (d.getFullYear() - a.getFullYear()) * 12 + (d.getMonth() - a.getMonth());
  const cycleIndex = floorDiv(monthsFrom, n);
  const start = new Date(a.getFullYear(), a.getMonth() + cycleIndex * n, 1);
  const finMes = new Date(start.getFullYear(), start.getMonth() + n - 1, 1);
  const fin = new Date(
    finMes.getFullYear(),
    finMes.getMonth(),
    daysInMonth(finMes.getFullYear(), finMes.getMonth())
  );
  return { inicio: start, fin };
}

function slotQuincenal(fecha) {
  const d = toDateOnly(fecha);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  if (day <= 15) {
    return { inicio: new Date(y, m, 1), fin: new Date(y, m, 15) };
  }
  return { inicio: new Date(y, m, 16), fin: new Date(y, m, daysInMonth(y, m)) };
}

/**
 * @returns {{ inicio: Date, fin: Date }}
 */
export function periodoQueContiene(fecha, periodicidad, anclaFechaInicio = null) {
  const p = Number(periodicidad);
  if (p === PERIODICIDAD.QUINCENAL) return slotQuincenal(fecha);

  const n = mesesPorCiclo(p);
  const ancla = anclaFechaInicio ? anclaDesde(anclaFechaInicio) : anclaDesde(fecha);
  return cicloAgrupacion(fecha, n, ancla);
}

export function siguientePeriodo(inicioActual, finActual, periodicidad, anclaFechaInicio = null) {
  const next = new Date(finActual.getFullYear(), finActual.getMonth(), finActual.getDate() + 1);
  return periodoQueContiene(next, periodicidad, anclaFechaInicio ?? inicioActual);
}

function normalizarPolitica(fechaIngreso, politica) {
  if (
    Number(politica) === POLITICA_PRIMER_PERIODO.PRORRATEAR &&
    fechaIngreso.getDate() <= DIA_MAX_SIN_PRORRATEO
  ) {
    return POLITICA_PRIMER_PERIODO.COMPLETO;
  }
  return Number(politica);
}

function roundAway(n) {
  return Math.round(n);
}

/**
 * Preview alineado al backend (AgrupacionMensual / Quincenal / Anual).
 * @returns {{ periodo: {inicio:Date, fin:Date}, monto: number, fueProrrateado: boolean }}
 */
export function resolverPrimerPeriodo({
  fechaIngreso,
  periodicidad,
  politica,
  montoBaseCiclo,
}) {
  const base = Number(montoBaseCiclo) || 0;
  const pol = normalizarPolitica(fechaIngreso, politica);
  const p = Number(periodicidad);
  const ancla = anclaDesde(fechaIngreso);

  if (p === PERIODICIDAD.QUINCENAL) {
    const slot = slotQuincenal(fechaIngreso);
    if (pol === POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE) {
      const next = siguientePeriodo(slot.inicio, slot.fin, p);
      return { periodo: next, monto: roundAway(base), fueProrrateado: false };
    }
    if (pol === POLITICA_PRIMER_PERIODO.PRORRATEAR) {
      const diasSlot =
        Math.round((slot.fin - slot.inicio) / (24 * 60 * 60 * 1000)) + 1;
      const diasRest =
        Math.round((slot.fin - toDateOnly(fechaIngreso)) / (24 * 60 * 60 * 1000)) + 1;
      return {
        periodo: { inicio: toDateOnly(fechaIngreso), fin: slot.fin },
        monto: roundAway((base * diasRest) / diasSlot),
        fueProrrateado: true,
      };
    }
    return {
      periodo: { inicio: toDateOnly(fechaIngreso), fin: slot.fin },
      monto: roundAway(base),
      fueProrrateado: false,
    };
  }

  // Anual: prorrateo a escala del ciclo
  if (p === PERIODICIDAD.ANUAL) {
    const ciclo = cicloAgrupacion(fechaIngreso, 12, ancla);
    if (pol === POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE) {
      const next = cicloAgrupacion(
        new Date(ciclo.fin.getFullYear(), ciclo.fin.getMonth(), ciclo.fin.getDate() + 1),
        12,
        ancla
      );
      return { periodo: next, monto: roundAway(base), fueProrrateado: false };
    }
    if (pol === POLITICA_PRIMER_PERIODO.PRORRATEAR) {
      const diasCiclo =
        Math.round((ciclo.fin - ciclo.inicio) / (24 * 60 * 60 * 1000)) + 1;
      const diasRest =
        Math.round((ciclo.fin - toDateOnly(fechaIngreso)) / (24 * 60 * 60 * 1000)) + 1;
      return {
        periodo: { inicio: toDateOnly(fechaIngreso), fin: ciclo.fin },
        monto: roundAway((base * diasRest) / diasCiclo),
        fueProrrateado: true,
      };
    }
    return {
      periodo: { inicio: toDateOnly(fechaIngreso), fin: ciclo.fin },
      monto: roundAway(base),
      fueProrrateado: false,
    };
  }

  // Agrupación mensual (1/2/3/6)
  const n = mesesPorCiclo(p);
  const ciclo = cicloAgrupacion(fechaIngreso, n, ancla);
  const aporteMes = base / n;

  if (pol === POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE) {
    const mesAlta = anclaDesde(fechaIngreso);
    const mesInicioCiclo = anclaDesde(ciclo.inicio);
    const offset =
      (mesAlta.getFullYear() - mesInicioCiclo.getFullYear()) * 12 +
      (mesAlta.getMonth() - mesInicioCiclo.getMonth());
    const mesesRestantes = n - 1 - offset;
    if (mesesRestantes <= 0) {
      const next = cicloAgrupacion(
        new Date(ciclo.fin.getFullYear(), ciclo.fin.getMonth(), ciclo.fin.getDate() + 1),
        n,
        ancla
      );
      return { periodo: next, monto: roundAway(base), fueProrrateado: false };
    }
    const inicioCobro = new Date(mesAlta.getFullYear(), mesAlta.getMonth() + 1, 1);
    return {
      periodo: { inicio: inicioCobro, fin: ciclo.fin },
      monto: roundAway(aporteMes * mesesRestantes),
      fueProrrateado: false,
    };
  }

  if (pol === POLITICA_PRIMER_PERIODO.PRORRATEAR) {
    const diasMes = daysInMonth(fechaIngreso.getFullYear(), fechaIngreso.getMonth());
    const diasRest = diasMes - fechaIngreso.getDate() + 1;
    const montoMes0 = (aporteMes * diasRest) / diasMes;
    const monto = n === 1
      ? roundAway(montoMes0)
      : roundAway(montoMes0 + aporteMes * (n - 1));
    return {
      periodo: { inicio: toDateOnly(fechaIngreso), fin: ciclo.fin },
      monto,
      fueProrrateado: true,
    };
  }

  return {
    periodo: { inicio: toDateOnly(fechaIngreso), fin: ciclo.fin },
    monto: roundAway(base),
    fueProrrateado: false,
  };
}

/** Labels de política según periodicidad. */
export function opcionesPoliticaPrimerPeriodo(periodicidad) {
  const p = Number(periodicidad);
  if (p === PERIODICIDAD.QUINCENAL) {
    return [
      { value: POLITICA_PRIMER_PERIODO.PRORRATEAR, label: "Prorratear la quincena de ingreso" },
      { value: POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE, label: "Omitir quincena entrante" },
      { value: POLITICA_PRIMER_PERIODO.COMPLETO, label: "Cobrar la quincena completa" },
    ];
  }
  if (p === PERIODICIDAD.ANUAL) {
    return [
      { value: POLITICA_PRIMER_PERIODO.PRORRATEAR, label: "Prorratear el año de ingreso" },
      { value: POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE, label: "Omitir año-ciclo entrante" },
      { value: POLITICA_PRIMER_PERIODO.COMPLETO, label: "Cobrar el año-ciclo completo" },
    ];
  }
  // mes / bi / tri / sem
  return [
    { value: POLITICA_PRIMER_PERIODO.PRORRATEAR, label: "Prorratear el mes de ingreso" },
    { value: POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE, label: "Omitir mes entrante" },
    { value: POLITICA_PRIMER_PERIODO.COMPLETO, label: "Cobrar el mes de ingreso completo" },
  ];
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
  if (p === PERIODICIDAD.MENSUAL && i.getDate() === 1 && f.getDate() === daysInMonth(f.getFullYear(), f.getMonth())) {
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

// Compat re-exports usados por código viejo
export function calcularFechaInicioCobro(fechaIngreso, periodicidad, diferirPeriodo) {
  const r = resolverPrimerPeriodo({
    fechaIngreso,
    periodicidad,
    politica: diferirPeriodo
      ? POLITICA_PRIMER_PERIODO.OMITIR_MES_ENTRANTE
      : POLITICA_PRIMER_PERIODO.COMPLETO,
    montoBaseCiclo: 0,
  });
  return r.periodo.inicio;
}

export function calcularMontoPrimeraCuota({
  montoBase,
  fechaIngreso,
  periodicidad,
  politica = POLITICA_PRIMER_PERIODO.COMPLETO,
}) {
  return resolverPrimerPeriodo({
    fechaIngreso,
    periodicidad,
    politica,
    montoBaseCiclo: montoBase,
  }).monto;
}

export { esAgrupacionMensual };
