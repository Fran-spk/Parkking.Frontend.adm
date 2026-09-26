import api from "./api";

/** @typedef {import("../types").TipoGasto} TipoGasto */

export const tipoGastoService = {
  /** @returns {Promise<TipoGasto[]>} */
  getAll: (includeInactivos = false) =>
    api.get("/tipos-gasto", { params: { includeInactivos } }).then((r) => r.data),

  /** @returns {Promise<TipoGasto>} */
  agregar: (nombre) => api.post("/tipos-gasto", { nombre }).then((r) => r.data),

  /** @returns {Promise<TipoGasto>} */
  modificar: (id, nombre) => api.put(`/tipos-gasto/${id}`, { nombre }).then((r) => r.data),

  darDeBaja: (id) => api.delete(`/tipos-gasto/${id}`).then((r) => r.data),

  reactivar: (id) => api.put(`/tipos-gasto/${id}/reactivar`).then((r) => r.data),
};
