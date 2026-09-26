import api from "./api";

/** @typedef {import("../types").GrupoFinanciero} GrupoFinanciero */
/** @typedef {import("../types").GrupoFinancieroPeriodo} GrupoFinancieroPeriodo */

export const grupoFinancieroService = {
  /** @returns {Promise<GrupoFinanciero[]>} */
  getAll: (includeInactivos = false) =>
    api.get("/grupos-financieros", { params: { includeInactivos } }).then((r) => r.data),

  /** @returns {Promise<GrupoFinanciero>} */
  getById: (id) => api.get(`/grupos-financieros/${id}`).then((r) => r.data),

  /** @returns {Promise<GrupoFinancieroPeriodo>} */
  periodo: (id, desde, hasta) => {
    const params = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    return api.get(`/grupos-financieros/${id}/periodo`, { params }).then((r) => r.data);
  },

  /** @returns {Promise<GrupoFinanciero>} */
  agregar: (nombre, descripcion) =>
    api.post("/grupos-financieros", { nombre, descripcion: descripcion || null }).then((r) => r.data),

  /** @returns {Promise<GrupoFinanciero>} */
  modificar: (id, nombre, descripcion) =>
    api.put(`/grupos-financieros/${id}`, { nombre, descripcion: descripcion || null }).then((r) => r.data),

  darDeBaja: (id) => api.delete(`/grupos-financieros/${id}`).then((r) => r.data),

  reactivar: (id) => api.put(`/grupos-financieros/${id}/reactivar`).then((r) => r.data),
};
