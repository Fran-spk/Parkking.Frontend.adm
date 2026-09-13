import api from "./api";

const BASE = "/abonocochera";

export const abonoService = {
  getOcupadas: () =>
    api.get(`${BASE}/ocupadas`).then(r => r.data),

  getAllAbonos: () =>
    api.get(`${BASE}/allAbonos`).then(r => r.data),

  getById: (id) =>
    api.get(`${BASE}/${id}`).then(r => r.data),

  getByCliente: (clienteId) =>
    api.get(`${BASE}/cliente/${clienteId}`).then(r => r.data),

  getByCochera: (cocheraId) =>
    api.get(`${BASE}/cochera/${cocheraId}`).then(r => r.data),

  getByPatente: (patente) =>
    api.get(`${BASE}/patente/${encodeURIComponent(patente)}`).then(r => r.data),

  /** Búsqueda parcial → lista de abonos. */
  buscarPorPatente: (patente) =>
    api.get(`${BASE}/buscar`, { params: { patente } }).then(r => r.data),

  crear: (data) =>
    api.post(BASE, data).then(r => r.data),

  modificar: (id, data) =>
    api.put(`${BASE}/${id}`, data).then(r => r.data),

  agregarPlaza: (id, cocheraId) =>
    api.post(`${BASE}/${id}/plazas`, { cocheraId }).then(r => r.data),

  removerPlaza: (id, abonoPlazaId) =>
    api.delete(`${BASE}/${id}/plazas/${abonoPlazaId}`).then(r => r.data),

  moverPlaza: (id, abonoPlazaId, nuevaCocheraId) =>
    api.put(`${BASE}/${id}/plazas/${abonoPlazaId}/mover`, { nuevaCocheraId }).then(r => r.data),

  /** Compat: mueve la primera plaza activa. */
  mover: (id, nuevaCocheraId) =>
    api.put(`${BASE}/mover/${id}`, nuevaCocheraId).then(r => r.data),

  agregarVehiculo: (id, data) =>
    api.post(`${BASE}/${id}/vehiculos`, data).then(r => r.data),

  modificarVehiculo: (id, abonoVehiculoId, data) =>
    api.put(`${BASE}/${id}/vehiculos/${abonoVehiculoId}`, data).then(r => r.data),

  removerVehiculo: (id, abonoVehiculoId) =>
    api.delete(`${BASE}/${id}/vehiculos/${abonoVehiculoId}`).then(r => r.data),

  darDeBaja: (id) =>
    api.delete(`${BASE}/${id}`).then(r => r.data),
};
