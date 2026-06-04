import api from "./api";

export const categoriaCocheraService = {

  getAll: (includeInactivos = false) =>
    api.get("/categoriacochera", { params: { includeInactivos } }).then(r => r.data),

  agregar: (nombre) =>
    api.post("/categoriacochera", { nombre}).then(r => r.data),

  modificar: (id, nombre) =>
    api.put(`/categoriacochera/${id}`, { nombre}).then(r => r.data),

  darDeBaja: (id) =>
    api.delete(`/categoriacochera/${id}`).then(r => r.data),

  reactivar: (id) =>
    api.put(`/categoriacochera/${id}/reactivar`).then(r => r.data),
};