import api from "./api";

/** @typedef {import("../types").Cargo} Cargo */
/** @typedef {import("../types").Reintegro} Reintegro */
/** @typedef {import("../types").OperacionFinanciera} OperacionFinanciera */

export const operacionFinancieraService = {
  /** @returns {Promise<OperacionFinanciera>} */
  crearCargo: ({ clienteId, abonoId, importe, concepto }) =>
    api
      .post("/operaciones-financieras/cargos", {
        clienteId: Number(clienteId),
        abonoId: Number(abonoId),
        importe: Number(importe),
        concepto,
      })
      .then((r) => r.data),

  /** @returns {Promise<OperacionFinanciera>} */
  crearAjuste: ({ clienteId, abonoId, tipoGastoId, importe, aFavorDelCliente, motivo, grupoFinancieroIds }) =>
    api
      .post("/operaciones-financieras/ajustes", {
        clienteId: clienteId ? Number(clienteId) : null,
        abonoId: abonoId ? Number(abonoId) : null,
        tipoGastoId: tipoGastoId ? Number(tipoGastoId) : null,
        importe: Math.abs(Number(importe)),
        aFavorDelCliente: !!aFavorDelCliente,
        motivo,
        grupoFinancieroIds: grupoFinancieroIds || [],
      })
      .then((r) => r.data),

  /** @returns {Promise<OperacionFinanciera>} */
  crearReintegro: ({
    clienteId,
    abonoId,
    tipoGastoId,
    importe,
    beneficiario,
    motivo,
    medio,
    grupoFinancieroIds,
  }) =>
    api
      .post("/operaciones-financieras/reintegros", {
        clienteId: clienteId ? Number(clienteId) : null,
        abonoId: abonoId ? Number(abonoId) : null,
        tipoGastoId: tipoGastoId ? Number(tipoGastoId) : null,
        importe: Number(importe),
        beneficiario,
        motivo,
        medio,
        grupoFinancieroIds: grupoFinancieroIds || [],
      })
      .then((r) => r.data),

  /** @returns {Promise<Cargo[]>} */
  cargosPorAbono: (abonoId) =>
    api.get("/operaciones-financieras/cargos", { params: { abonoId } }).then((r) => r.data),

  /** @returns {Promise<Reintegro[]>} */
  reintegrosPorAbono: (abonoId) =>
    api.get("/operaciones-financieras/reintegros", { params: { abonoId } }).then((r) => r.data),

  /** @returns {Promise<import("../types").OperacionFinanciera>} */
  crearGasto: ({ tipoGastoId, importe, concepto, grupoFinancieroIds }) =>
    api
      .post("/operaciones-financieras/gastos", {
        tipoGastoId: Number(tipoGastoId),
        importe: Number(importe),
        concepto,
        grupoFinancieroIds: grupoFinancieroIds || [],
      })
      .then((r) => r.data),
};
