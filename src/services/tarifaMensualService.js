import api from "./api";

export const tarifaMensualService = {

  getVigentes: (periodicidadCobro) =>
    api.get("/tarifamensual/vigentes", {
      params: periodicidadCobro != null ? { periodicidadCobro } : undefined,
    }).then(r => r.data),

  getVigente: (tipoVehiculoId, categoriaCocheraId, periodicidadCobro = 0) =>
    api.get("/tarifamensual/vigente", {
      params: { tipoVehiculoId, categoriaCocheraId, periodicidadCobro },
    }).then(r => r.data),

  getHistorial: (tipoVehiculoId, categoriaCocheraId, periodicidadCobro = 0) =>
    api.get("/tarifamensual/historial", {
      params: { tipoVehiculoId, categoriaCocheraId, periodicidadCobro },
    }).then(r => r.data),

  agregar: (tipoVehiculoId, categoriaCocheraId, periodicidadCobro, precio) =>
    api.post("/tarifamensual", {
      tipoVehiculoId,
      categoriaCocheraId: Number(categoriaCocheraId),
      periodicidadCobro: Number(periodicidadCobro),
      precio: Number(precio),
    }).then(r => r.data),
};
