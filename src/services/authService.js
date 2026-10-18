import api from "./api";
import { permisosStore } from "../utils/permisosStore";

/** @typedef {import("../types").LoginResponse} LoginResponse */

function apiErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data?.mensaje) return data.mensaje;
  if (data?.title) return data.title;
  return fallback;
}

export const authService = {
  /**
   * Realiza el inicio de sesión del usuario.
   * @param {string} login UsuarioName único (no email).
   * @param {string} password Contraseña.
   * @returns {Promise<LoginResponse>}
   */
  async login(login, password) {
    try {
      const response = await api.post("/Auth/login", { login, password });
      const data = response?.data ? response.data : response;
      localStorage.setItem("parkking_user", JSON.stringify(data || { isAuthenticated: true }));
      permisosStore.clear();
      return data;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "Error de red o de servidor al iniciar sesión"));
    }
  },

  /**
   * Pide una clave nueva al backend. Se genera, se hashea y se manda al mail del usuario.
   * @param {string} login UsuarioName único.
   * @returns {Promise<string>}
   */
  async restablecerClave(login) {
    try {
      const response = await api.post("/Auth/restablecer-clave", { login });
      const data = response?.data ?? response;
      if (typeof data === "string" && data.trim()) return data;
      return "Si el usuario existe, te mandamos una contraseña nueva al mail.";
    } catch (error) {
      throw new Error(apiErrorMessage(error, "No se pudo restablecer la contraseña"));
    }
  },

  /**
   * Usuario + permisos del estacionamiento activo (si hay tenant cookie válida).
   * @returns {Promise<{ id: number, nombre?: string, email?: string, permisos?: object }>}
   */
  async me() {
    const response = await api.get("/Auth/me");
    const data = response?.data ?? response;
    permisosStore.setFromMe(data);
    return data;
  },

  /**
   * Cierra la sesión del usuario.
   */
  async logout() {
    try {
      await api.post("/Auth/logout");
    } catch (error) {
      console.error("Error al notificar logout al backend:", error);
    } finally {
      localStorage.removeItem("parkking_user");
      localStorage.removeItem("parkking_estacionamiento");
      permisosStore.clear();
    }
  },

  /**
   * Retorna el usuario actual del localStorage si está autenticado.
   * @returns {LoginResponse | null}
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem("parkking_user");
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch {
      localStorage.removeItem("parkking_user");
      return null;
    }
  },

  /**
   * Determina si el usuario está autenticado.
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },
};
