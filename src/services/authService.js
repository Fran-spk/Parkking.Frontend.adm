import api from "./api";

export const authService = {
  /**
   * Realiza el inicio de sesión del usuario.
   * @param {string} login Nombre de usuario o correo electrónico.
   * @param {string} password Contraseña.
   */
  async login(login, password) {
    try {
      const response = await api.post("/Auth/login", { login, password });
      const data = response?.data ? response.data : response;
      // Guardar información mínima del usuario para el AuthGuard
      localStorage.setItem("parkking_user", JSON.stringify(data || { isAuthenticated: true }));
      return data;
    } catch (error) {
      const message = error.response?.data || "Error de red o de servidor al iniciar sesión";
      throw new Error(message);
    }
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
    }
  },

  /**
   * Obtiene los estacionamientos asignados al usuario.
   */
  async getEstacionamientos() {
    try {
      const response = await api.get("/Auth/estacionamientos");
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
      const response = await api.post("/Auth/seleccionar-estacionamiento", { estacionamientoId });
      return response?.data ? response.data : response;
    } catch (error) {
      const message = error.response?.data || "Error al seleccionar el estacionamiento";
      throw new Error(message);
    }
  },

  /**
   * Retorna el usuario actual del localStorage si está autenticado.
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem("parkking_user");
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (e) {
      localStorage.removeItem("parkking_user");
      return null;
    }
  },

  /**
   * Determina si el usuario está autenticado.
   */
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  }
};