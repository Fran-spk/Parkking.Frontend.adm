import api from "./api";

/** @typedef {import("../types").TarifaVigente} TarifaVigente */
/** @typedef {import("../types").TarifaHistorial} TarifaHistorial */

export const tarifaMensualService = {
  /** @returns {Promise<TarifaVigente[]>} */
  getVigentes: (periodicidadCobro) =>
    api
      .get("/tarifamensual/vigentes", {
        params: periodicidadCobro != null ? { periodicidadCobro } : undefined,
      })
      .then((r) => r.data),

  /** @returns {Promise<TarifaVigente>} */
  getVigente: (tipoVehiculoId, categoriaCocheraId, periodicidadCobro = 0) =>
    api
      .get("/tarifamensual/vigente", {
        params: { tipoVehiculoId, categoriaCocheraId, periodicidadCobro },
      })
      .then((r) => r.data),

  /** @returns {Promise<TarifaHistorial[]>} */
  getHistorial: (tipoVehiculoId, categoriaCocheraId, periodicidadCobro = 0) =>
    api
      .get("/tarifamensual/historial", {
        params: { tipoVehiculoId, categoriaCocheraId, periodicidadCobro },
      })
      .then((r) => r.data),

  agregar: (tipoVehiculoId, categoriaCocheraId, periodicidadCobro, precio) =>
    api
      .post("/tarifamensual", {
        tipoVehiculoId,
        categoriaCocheraId: Number(categoriaCocheraId),
        periodicidadCobro: Number(periodicidadCobro),
        precio: Number(precio),
      })
      .then((r) => r.data),

  completarFaltantes: (precioMensualDefault = 50000) =>
    api
      .post("/tarifamensual/completar-faltantes", null, {
        params: { precioMensualDefault },
      })
      .then((r) => r.data),
};
