import api from "./api";

/** @typedef {import("../types").Estacionamiento} Estacionamiento */
/** @typedef {import("../types").EstacionamientoAcceso} EstacionamientoAcceso */

export const estacionamientoService = {

  /** @returns {Promise<Estacionamiento>} */
  get: () =>
    api.get("/estacionamiento").then(r => r.data),

  /** @param {Partial<Estacionamiento>} data @returns {Promise<Estacionamiento>} */
  modificar: (data) =>
    api.put("/estacionamiento", data).then(r => r.data),


  /** @returns {Promise<EstacionamientoAcceso[]>} */
  async getEstacionamientos() {
    try {
      const response = await api.get("/estacionamiento/misEstacionamientos");
      const data = response?.data ? response.data : response;
      return data;
    } catch (error) {
      const message = error.response?.data || "Error al obtener los estacionamientos";
      throw new Error(message);
    }
  },

  /**
   * Selecciona el estacionamiento activo en el backend
   */
  async seleccionarEstacionamiento(estacionamientoId) {
    try {
      const response = await api.post("/estacionamiento/seleccionarEstacionamiento", { estacionamientoId });
      return response?.data ? response.data : response;
    } catch (error) {
      const message = error.response?.data || "Error al seleccionar el estacionamiento";
      throw new Error(message);
    }
  },
};