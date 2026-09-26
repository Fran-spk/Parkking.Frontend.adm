/**
 * @typedef {object} Movimiento
 * @property {number} movimientoId
 * @property {number} estacionamientoId
 * @property {number} cuentaCorrienteEstacionamientoId
 * @property {number | null} clienteId
 * @property {number | null} cuentaCorrienteClienteId
 * @property {number | null} pagoId
 * @property {number} importe
 * @property {number} tipo
 * @property {string} tipoDescripcion
 * @property {string} concepto
 * @property {string} fechaHora
 * @property {number} usuarioId
 * @property {number[]} grupoFinancieroIds
 */

/**
 * @typedef {object} AuditoriaMovimiento
 * @property {number} auditoriaMovimientoId
 * @property {string} fechaHora
 * @property {number} usuarioId
 * @property {string | null} ip
 * @property {string | null} userAgent
 * @property {string} detalle
 */

/**
 * @typedef {Movimiento & { auditorias: AuditoriaMovimiento[] }} MovimientoDetalle
 */

/**
 * @typedef {object} CuentaCorriente
 * @property {number | null} cuentaCorrienteId
 * @property {number} estacionamientoId
 * @property {number | null} clienteId
 * @property {number} saldo
 * @property {boolean} existe
 * @property {Movimiento[]} movimientos
 */

/**
 * @typedef {object} Cargo
 * @property {number} cargoId
 * @property {number} clienteId
 * @property {number | null} abonoId
 * @property {number} importe
 * @property {string} concepto
 * @property {string} fechaHora
 */

/**
 * @typedef {object} Reintegro
 * @property {number} reintegroId
 * @property {number | null} clienteId
 * @property {number | null} abonoId
 * @property {number} movimientoId
 * @property {number} importe
 * @property {string} beneficiario
 * @property {string} motivo
 * @property {string} medio
 * @property {string} fechaHora
 */

/**
 * @typedef {object} OperacionFinanciera
 * @property {number | null} cargoId
 * @property {number | null} movimientoId
 * @property {number | null} ajusteFinancieroId
 * @property {string} tipo
 * @property {number} importe
 * @property {number | null} clienteId
 * @property {number[]} grupoFinancieroIds
 */

/**
 * @typedef {object} TipoGasto
 * @property {number} tipoGastoId
 * @property {string} nombre
 * @property {boolean} activo
 */

/**
 * @typedef {object} GrupoFinanciero
 * @property {number} grupoFinancieroId
 * @property {string} nombre
 * @property {string | null} descripcion
 * @property {boolean} activo
 */

/**
 * @typedef {object} GrupoFinancieroPeriodo
 * @property {number} grupoFinancieroId
 * @property {string} nombre
 * @property {string | null} desde
 * @property {string | null} hasta
 * @property {number} totalIngresos
 * @property {number} totalEgresos
 * @property {number} neto
 * @property {Movimiento[]} movimientos
 */

/**
 * @typedef {object} ReglaAsignacion
 * @property {number} reglaAsignacionId
 * @property {number} grupoFinancieroId
 * @property {string} grupoNombre
 * @property {number} criterio
 * @property {string} criterioDescripcion
 * @property {number | null} clienteId
 * @property {number | null} tipoGastoId
 * @property {boolean} activa
 */

export {};

/** Signo del importe tal como lo guarda el estacionamiento. */
export const TipoMovimiento = {
  Ingreso: 0,
  Egreso: 1,
  Reintegro: 2,
  Ajuste: 3,
};

export const tipoMovimientoLabel = {
  [TipoMovimiento.Ingreso]: "Ingreso",
  [TipoMovimiento.Egreso]: "Egreso",
  [TipoMovimiento.Reintegro]: "Reintegro",
  [TipoMovimiento.Ajuste]: "Ajuste",
};

/** Cobro, gasto, reintegro o ajuste, para las listas. */
export function etiquetaMovimiento(movimiento) {
  const tipo = Number(movimiento?.tipo);
  if (tipo === TipoMovimiento.Ingreso) return movimiento?.pagoId ? "Cobro" : "Ingreso";
  if (tipo === TipoMovimiento.Egreso) return "Gasto";
  if (tipo === TipoMovimiento.Reintegro) return "Reintegro";
  if (tipo === TipoMovimiento.Ajuste) return "Ajuste";
  return movimiento?.tipoDescripcion || "Movimiento";
}

/** Impacto en la cuenta del cliente. El ajuste usa el mismo signo que el grupo. */
export function impactoEnCliente(movimiento) {
  const importe = Number(movimiento?.importe) || 0;
  const tipo = Number(movimiento?.tipo);
  if (tipo === TipoMovimiento.Reintegro || tipo === TipoMovimiento.Ajuste) return importe;
  return -importe;
}
