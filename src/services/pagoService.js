import api from "./api";

/** @typedef {import("../types").Pago} Pago */
/** @typedef {import("../types").Cuota} Cuota */
/** @typedef {import("../types").DeudaPendiente} DeudaPendiente */
/** @typedef {import("../types").DeudaCliente} DeudaCliente */
/** @typedef {import("../types").PagoSugerido} PagoSugerido */
/** @typedef {import("../types").MontoPeriodo} MontoPeriodo */

export const pagoService = {
  /** @returns {Promise<Pago[]>} */
  getByAbono: (abonoId) =>
    api.get(`/pago/abono/${abonoId}`).then((r) => r.data),

  /** @returns {Promise<Cuota[]>} */
  getCuotas: (abonoId) =>
    api.get(`/pago/abono/${abonoId}/cuotas`).then((r) => r.data),

  anularCuota: (abonoId, { cuotaId, periodoInicio }) =>
    api.post(`/pago/abono/${abonoId}/cuotas/anular`, {
      cuotaId: cuotaId || null,
      periodoInicio: periodoInicio || null,
    }),

  /** Período siguiente, sin persistir. null si no corresponde. @returns {Promise<Cuota | null>} */
  getCuotaFutura: (abonoId) =>
    api
      .get(`/pago/abono/${abonoId}/cuota-futura`, { validateStatus: (s) => s === 200 || s === 204 })
      .then((r) => (r.status === 204 ? null : r.data)),

  /** @returns {Promise<Cuota[]>} */
  getCuotasPendientes: (abonoId) =>
    api.get(`/pago/abono/${abonoId}/cuotas-pendientes`).then((r) => r.data),

  /** @returns {Promise<DeudaPendiente[]>} */
  getPendientes: () => api.get("/pago/pendientes").then((r) => r.data),

  /** @returns {Promise<Pago>} */
  getDetalles: (pagoId) =>
    api.get(`/pago/${pagoId}/detalles`).then((r) => r.data),

  /** @returns {Promise<PagoSugerido>} */
  getSugerido: (abonoId, mes = null) =>
    api.get(`/pago/sugerido/${abonoId}`, {
      params: mes ? { mes } : {},
    }).then((r) => r.data),

  /** @returns {Promise<MontoPeriodo>} */
  getMontoPeriodo: (abonoId, periodoInicio = null) =>
    api.get(`/pago/abono/${abonoId}/monto-periodo`, {
      params: periodoInicio ? { periodoInicio } : {},
    }).then((r) => r.data),

  getDetallesCuota: (cuotaId) =>
    api.get(`/pago/cuota/${cuotaId}/detalles`).then((r) => r.data),

  /** @returns {Promise<Pago[]>} */
  getAll: (desde = null, hasta = null) =>
    api.get("/pago", {
      params: {
        ...(desde && { desde }),
        ...(hasta && { hasta }),
      },
    }).then((r) => r.data),

  /** @returns {Promise<Pago[]>} */
  getByCliente: (clienteId) =>
    api.get(`/pago/cliente/${clienteId}`).then((r) => r.data),

  /** @returns {Promise<DeudaCliente>} */
  getDeudaCliente: (clienteId) =>
    api.get(`/pago/deuda/cliente/${clienteId}`).then((r) => r.data),

  pagarSena: ({ senaId, metodoDePagoId, recargo, observacion }) =>
    api
      .post("/pago/sena", { senaId, metodoDePagoId, recargo, observacion })
      .then((r) => r.data),

  /** @returns {Promise<Pago>} */
  registrar: (data) => api.post("/pago/pagar", data).then((r) => r.data),
};
