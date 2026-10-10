import api from "./api";

/** @typedef {import("../types").Zona} Zona */

export const zonaService = {
  /** @returns {Promise<Zona[]>} */
  getAll: (includeInactivos = false) =>
    api.get("/zona", { params: { includeInactivos } }).then((r) => r.data),

  agregar: (nombre) => api.post("/zona", { nombre }).then((r) => r.data),

  modificar: (id, nombre) => api.put(`/zona/${id}`, { nombre }).then((r) => r.data),

  darDeBaja: (id) => api.delete(`/zona/${id}`).then((r) => r.data),

  reactivar: (id) => api.put(`/zona/${id}/reactivar`).then((r) => r.data),
};
