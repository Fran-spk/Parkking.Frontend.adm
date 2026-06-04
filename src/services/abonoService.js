import api from "./api";

export const abonoService = {

  // Trae todos los abonos activos con cochera, cliente y tipo vehículo
  getOcupadas: () =>
    api.get("/abonocochera/ocupadas").then(r => r.data),
  //trae todos los abonos historicos
  getAllAbonos: () =>
    api.get("/abonocochera/allAbonos").then(r => r.data),
  // Abonos de un cliente
  getByCliente: (clienteId) =>
    api.get(`/abonocochera/cliente/${clienteId}`).then(r => r.data),
  // Abonos de una cochera (historial)
  getByCochera: (cocheraId) =>
    api.get(`/abonocochera/cochera/${cocheraId}`).then(r => r.data),
  // Buscar por patente
  getByPatente: (patente) =>
    api.get(`/abonocochera/patente/${patente}`).then(r => r.data),
  // Crear abono
  crear: (data) =>
    api.post("/abonocochera", data).then(r => r.data),
  // Modificar datos del abono
  modificar: (id, data) =>
    api.put(`/abonocochera/${id}`, data).then(r => r.data),

  // Mover abono a otra cochera
  mover: (id, nuevaCocheraId) =>
    api.put(`/abonocochera/mover/${id}`, nuevaCocheraId).then(r => r.data),

  // Intercambiar dos cocheras
  swap: (abonoCocheraId1, abonoCocheraId2) =>
    api.put("/abonocochera/swap", { abonoCocheraId1, abonoCocheraId2 }).then(r => r.data),

  // Dar de baja
  darDeBaja: (id) =>
    api.delete(`/abonocochera/${id}`).then(r => r.data),
};