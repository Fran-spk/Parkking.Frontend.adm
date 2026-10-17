import api from "./api";

export const tarifaEstadiaService = {
  getAll: (includeInactivas = false) =>
    api.get("/tarifaestadia", { params: { includeInactivas } }).then((r) => r.data),

  agregar: (data) => api.post("/tarifaestadia", data).then((r) => r.data),

  modificar: (id, data) => api.put(`/tarifaestadia/${id}`, data).then((r) => r.data),

  darDeBaja: (id) => api.delete(`/tarifaestadia/${id}`).then((r) => r.data),

  reactivar: (id) => api.put(`/tarifaestadia/${id}/reactivar`).then((r) => r.data),
};
