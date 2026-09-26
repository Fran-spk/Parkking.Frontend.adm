import api from "./api";

/** @typedef {import("../types").Recibo} Recibo */

export const reciboService = {
  /** @returns {Promise<Recibo[]>} */
  listar: (params = {}) =>
    api.get("/recibo", { params }).then((r) => r.data),

  /** @returns {Promise<Recibo>} */
  getById: (id) =>
    api.get(`/recibo/${id}`).then((r) => r.data),

  /** @returns {Promise<Recibo>} */
  getByPago: (pagoId) =>
    api.get(`/recibo/pago/${pagoId}`).then((r) => r.data),

  anular: (id, motivo) =>
    api.post(`/recibo/${id}/anular`, { motivo }).then((r) => r.data),

  /** Envía recibo por email. email opcional (override) — va en query para evitar líos de body. */
  enviarEmail: (id, email) => {
    const trimmed = (email || "").trim();
    return api
      .post(
        `/recibo/${id}/enviar-email`,
        trimmed ? { email: trimmed } : {},
        trimmed ? { params: { email: trimmed } } : undefined
      )
      .then((r) => r.data);
  },
};
