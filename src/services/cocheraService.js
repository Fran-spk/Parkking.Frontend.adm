import api from "./api";

/** @typedef {import("../types").Cochera} Cochera */

export const cocheraService = {

  /** @returns {Promise<Cochera[]>} */
  getAll: () =>
    api.get("/cochera").then(r => r.data),

  /** @returns {Promise<Cochera[]>} */
  getLibresByVehiculo: (tipoVehiculoId) =>
    api.get(`/cochera/libres/${tipoVehiculoId}`).then(r => r.data),

 /** @returns {Promise<Cochera>} */
 agregar: (request) => 
  api.post("/cochera", request).then(r => r.data),

  /** @returns {Promise<Cochera>} */
  modificar: (id, request) =>
    api.put(`/cochera/${id}`, request).then(r => r.data),

  desactivar: (id) =>
    api.delete(`/cochera/${id}`).then(r => r.data),
};