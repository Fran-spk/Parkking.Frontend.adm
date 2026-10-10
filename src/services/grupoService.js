import api from "./api";

export const grupoService = {
  getAll: () => api.get("/Grupo").then((r) => r.data),

  getById: (id) => api.get(`/Grupo/${id}`).then((r) => r.data),

  getModulos: () => api.get("/Grupo/modulos").then((r) => r.data),

  /**
   * @param {{ nombre: string, descripcion?: string, estado?: number, accionIds: number[] }} body
   */
  crear: (body) => api.post("/Grupo", body).then((r) => r.data),

  /**
   * @param {number} id
   * @param {{ nombre: string, descripcion?: string, estado: number, accionIds: number[] }} body
   */
  modificar: (id, body) => api.put(`/Grupo/${id}`, body).then((r) => r.data),

  eliminar: (id) => api.delete(`/Grupo/${id}`).then((r) => r.data),
};

/** EstadoGrupo: Habilitado = 1, Deshabilitado = 2 */
export const ESTADO_GRUPO = {
  Habilitado: 1,
  Deshabilitado: 2,
};
