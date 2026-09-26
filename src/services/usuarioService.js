import api from "./api";

/** @typedef {import("../types").Usuario} Usuario */
/** @typedef {import("../types").UsuarioResumen} UsuarioResumen */

export const usuarioService = {

  /** @returns {Promise<Usuario>} */
  getPerfil: () =>
    api.get("/Usuario").then(r => r.data),

  /** @returns {Promise<UsuarioResumen[]>} */
  listarDelEstacionamiento: () =>
    api.get("/Usuario/del-estacionamiento").then(r => r.data),

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
