import api from "./api";

export const tipoVehiculoService = {

  getAll: (includeInactivos = false) =>
    api.get("/tipovehiculo", { params: { includeInactivos } }).then(r => r.data),

  agregar: (nombre) =>
    api.post("/tipovehiculo", JSON.stringify(nombre), {
      headers: { "Content-Type": "application/json" },
    }).then(r => r.data),

  modificar: (id, nuevoNombre) =>
    api.put(`/tipovehiculo/${id}`, JSON.stringify(nuevoNombre), {
      headers: { "Content-Type": "application/json" },
    }).then(r => r.data),

  darDeBaja: (id) =>
    api.delete(`/tipovehiculo/${id}`).then(r => r.data),

  reactivar: (id) =>
    api.put(`/tipovehiculo/${id}/reactivar`).then(r => r.data),
};