import api from "./api";

export const cocheraService = {

  getAll: () =>
    api.get("/cochera").then(r => r.data),

  getLibresByVehiculo: (tipoVehiculoId) =>
    api.get(`/cochera/libres/${tipoVehiculoId}`).then(r => r.data),

 agregar: (request) => 
  api.post("/cochera", request).then(r => r.data),

  modificar: (id, request) =>
    api.put(`/cochera/${id}`, request).then(r => r.data),

  desactivar: (id) =>
    api.delete(`/cochera/${id}`).then(r => r.data),
};