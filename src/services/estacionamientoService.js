import api from "./api";
import { authService } from "./authService";
import { destinoPostLogin } from "../utils/playa";

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
  /**
   * Un solo estacionamiento entra directo. Varios van al selector.
   * @param {import("react-router-dom").NavigateFunction} navigate
   */
  async entrar(navigate) {
    const lista = await this.getEstacionamientos();
    const items = Array.isArray(lista) ? lista : [];
    localStorage.setItem("parkking_cantidad_estacionamientos", String(items.length));

    if (items.length !== 1) {
      navigate("/seleccion-estacionamientos", { replace: true });
      return;
    }

    const est = items[0];
    const estacionamientoId = est.id || est.Id;
    await this.seleccionarEstacionamiento(estacionamientoId);
    localStorage.setItem("parkking_estacionamiento", JSON.stringify(est));
    window.dispatchEvent(new Event("estacionamiento_changed"));
    await authService.me();
    navigate(destinoPostLogin(), { replace: true });
  },

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