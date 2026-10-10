import api from "./api";

export const reservaService = {
  getConfig: () => api.get("/reservas/configuracion").then((r) => r.data),
  guardarConfig: (data) => api.put("/reservas/configuracion", data).then((r) => r.data),
  getAll: () => api.get("/reservas").then((r) => r.data),
  getById: (id) => api.get(`/reservas/${id}`).then((r) => r.data),
  avisos: (cocheraId) => api.get("/reservas/avisos", { params: { cocheraId } }).then((r) => r.data),
  crear: (data) => api.post("/reservas", data).then((r) => r.data),
  editar: (id, data) => api.put(`/reservas/${id}`, data).then((r) => r.data),
  baja: (id) => api.post(`/reservas/${id}/baja`).then((r) => r.data),
  crearSena: (id, importe) => api.post(`/reservas/${id}/senas`, { importe }).then((r) => r.data),
  transformar: (id, data) => api.post(`/reservas/${id}/transformar`, data).then((r) => r.data),
};
