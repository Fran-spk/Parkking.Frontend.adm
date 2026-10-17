import api from "./api";

export const zonaRotativoService = {
  getAll: (includeInactivas = false) =>
    api.get("/zonarotativo", { params: { includeInactivas } }).then((r) => r.data),

  agregar: (data) => api.post("/zonarotativo", data).then((r) => r.data),

  modificar: (id, data) => api.put(`/zonarotativo/${id}`, data).then((r) => r.data),

  darDeBaja: (id) => api.delete(`/zonarotativo/${id}`).then((r) => r.data),

  reactivar: (id) => api.put(`/zonarotativo/${id}/reactivar`).then((r) => r.data),

  agregarTipo: (zonaRotativoId, tipoVehiculoId) =>
    api.post("/zonarotativotipo", { zonaRotativoId, tipoVehiculoId }).then((r) => r.data),

  quitarTipo: (id) => api.delete(`/zonarotativotipo/${id}`).then((r) => r.data),
};
