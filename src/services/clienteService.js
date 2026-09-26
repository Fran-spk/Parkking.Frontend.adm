import api from "./api";

/** @typedef {import("../types").Cliente} Cliente */
/** @typedef {import("../types").ClienteRequest} ClienteRequest */
/** @typedef {import("../types").Vehiculo} Vehiculo */

export const clienteService = {
  /** @returns {Promise<Cliente[]>} */
  getAll: (includeInactivos = false) =>
    api.get("/cliente", { params: { includeInactivos } }).then((r) => r.data),

  /** @returns {Promise<Cliente>} */
  getById: (id) => api.get(`/cliente/${id}`).then((r) => r.data),

  /** @returns {Promise<Vehiculo[]>} */
  getVehiculos: (clienteId, soloDisponibles = false) =>
    api.get(`/cliente/${clienteId}/vehiculos`, { params: { soloDisponibles } }).then((r) => r.data),

  /** @param {ClienteRequest} data @returns {Promise<Cliente>} */
  agregar: (data) => api.post("/cliente", data).then((r) => r.data),

  /** @param {number} id @param {ClienteRequest} data @returns {Promise<Cliente>} */
  modificar: (id, data) => api.put(`/cliente/${id}`, data).then((r) => r.data),

  darDeBaja: (id) => api.delete(`/cliente/${id}`).then((r) => r.data),

  reactivar: (id) => api.put(`/cliente/${id}/reactivar`).then((r) => r.data),
};
