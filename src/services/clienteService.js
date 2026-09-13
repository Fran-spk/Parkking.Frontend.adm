import api from "./api";

export const clienteService = {

  // Trae clientes activos o todos si includeInactivos = true
  getAll: (includeInactivos = false) =>
    api.get("/cliente", { params: { includeInactivos } }).then(r => r.data),

  // Trae un cliente con sus abonos activos
  getById: (id) =>
    api.get(`/cliente/${id}`).then(r => r.data),

  /** Vehículos del cliente. soloDisponibles = libres (no en abono activo). */
  getVehiculos: (clienteId, soloDisponibles = false) =>
    api.get(`/cliente/${clienteId}/vehiculos`, { params: { soloDisponibles } }).then(r => r.data),

  // Crear cliente
  agregar: (data) =>
    api.post("/cliente", data).then(r => r.data),

  // Modificar cliente
  modificar: (id, data) =>
    api.put(`/cliente/${id}`, data).then(r => r.data),

  // Dar de baja
  darDeBaja: (id) =>
    api.delete(`/cliente/${id}`).then(r => r.data),

  reactivar: (id) =>
  api.put(`/cliente/${id}/reactivar`).then(r => r.data),
};