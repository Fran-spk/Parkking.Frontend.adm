import api from "./api";

export const permisosService = {
  /** @param {number} usuarioId */
  get: (usuarioId) => api.get(`/permisos/${usuarioId}`).then((r) => r.data),

  /**
   * @param {number} usuarioId
   * @param {number[]} grupoIds
   */
  asignarGrupos: (usuarioId, grupoIds) =>
    api.put(`/permisos/${usuarioId}/grupos`, { grupoIds }).then((r) => r.data),

  /**
   * @param {number} usuarioId
   * @param {number[]} accionIds
   */
  asignarAccionesExtras: (usuarioId, accionIds) =>
    api
      .put(`/permisos/${usuarioId}/acciones-extras`, { accionIds })
      .then((r) => r.data),
};
