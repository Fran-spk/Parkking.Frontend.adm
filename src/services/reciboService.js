import api from "./api";

export const reciboService = {
  listar: (params = {}) =>
    api.get("/recibo", { params }).then((r) => r.data),

  getById: (id) =>
    api.get(`/recibo/${id}`).then((r) => r.data),

  getByPago: (pagoId) =>
    api.get(`/recibo/pago/${pagoId}`).then((r) => r.data),

  anular: (id, motivo) =>
    api.post(`/recibo/${id}/anular`, { motivo }).then((r) => r.data),
};
