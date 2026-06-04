import api from "./api";

export const tarifaMensualService = {

  getVigentes: () =>
    api.get("/tarifamensual/vigentes").then(r => r.data),

  getVigente: (tipoVehiculoId, categoriaCocheraId) =>
    api.get("/tarifamensual/vigente", {
      params: { tipoVehiculoId, categoriaCocheraId }
    }).then(r => r.data),

  getHistorial: (tipoVehiculoId, categoriaCocheraId) =>
    api.get("/tarifamensual/historial", {
      params: { tipoVehiculoId, categoriaCocheraId }
    }).then(r => r.data),

  agregar: (tipoVehiculoId, categoriaCocheraId, precio) =>
    api.post("/tarifamensual", {
      tipoVehiculoId,
      categoriaCocheraId: Number(categoriaCocheraId),
      precio: Number(precio),
    }).then(r => r.data),
};