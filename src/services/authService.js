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
      if (data && data.usuario) {
        // Almacenamos la información del usuario en localStorage
        localStorage.setItem("parkking_user", JSON.stringify(data.usuario));
      }
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
