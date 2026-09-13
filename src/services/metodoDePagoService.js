import api from "./api";

export const metodoDePagoService = {
  getAll: (includeInactivos = false) =>
    api.get("/metododepago", { params: { includeInactivos } }).then((r) => r.data),

  agregar: (nombre) =>
    api.post("/metododepago", { nombre }).then((r) => r.data),

  modificar: (id, nombre) =>
    api.put(`/metododepago/${id}`, { nombre }).then((r) => r.data),

  darDeBaja: (id) =>
    api.delete(`/metododepago/${id}`).then((r) => r.data),

  reactivar: (id) =>
    api.put(`/metododepago/${id}/reactivar`).then((r) => r.data),
};
