import api from "./api";

export const usuarioService = {

  /**
   * Obtiene el perfil del usuario autenticado.
   * @returns {{ usuario, mail, nombre, telefono }}
   */
  getPerfil: () =>
    api.get("/Usuario").then(r => r.data),

  /**
   * Modifica nombre y teléfono del usuario autenticado.
   * @param {{ nombre: string, telefono: string }} data
   */
  modificarPerfil: (data) =>
    api.put("/Usuario", data).then(r => r.data),

  /**
   * Cambia la contraseña del usuario autenticado.
   * @param {{ passwordActual: string, passwordNueva: string }} data
   */
  cambiarPassword: (data) =>
    api.put("/Usuario/cambiarPassword", data).then(r => r.data),
};
