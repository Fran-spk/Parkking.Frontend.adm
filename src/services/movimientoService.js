import api from "./api";

/** @typedef {import("../types").Movimiento} Movimiento */

export const movimientoService = {
  /** @returns {Promise<Movimiento[]>} */
  listar: ({ desde, hasta, tipo, clienteId, usuarioId, grupoFinancieroId } = {}) => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    if (tipo !== undefined && tipo !== null && tipo !== "") params.tipo = tipo;
    if (clienteId) params.clienteId = clienteId;
    if (usuarioId) params.usuarioId = usuarioId;
    if (grupoFinancieroId) params.grupoFinancieroId = grupoFinancieroId;
    return api.get("/movimientos", { params }).then((r) => r.data);
  },

  /** @returns {Promise<Movimiento>} */
  getById: (id) => api.get(`/movimientos/${id}`).then((r) => r.data),
};
