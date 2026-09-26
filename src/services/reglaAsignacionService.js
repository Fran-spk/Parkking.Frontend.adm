import api from "./api";

/** @typedef {import("../types").ReglaAsignacion} ReglaAsignacion */

export const CriterioRegla = {
  Cliente: 0,
  TipoGasto: 1,
};

export const reglaAsignacionService = {
  /** @returns {Promise<ReglaAsignacion[]>} */
  getAll: (includeInactivas = false) =>
    api.get("/reglas-asignacion", { params: { includeInactivas } }).then((r) => r.data),

  /** @returns {Promise<ReglaAsignacion>} */
  agregar: ({ grupoFinancieroId, criterio, clienteId, tipoGastoId }) =>
    api
      .post("/reglas-asignacion", {
        grupoFinancieroId: Number(grupoFinancieroId),
        criterio: Number(criterio),
        clienteId: clienteId ? Number(clienteId) : null,
        tipoGastoId: tipoGastoId ? Number(tipoGastoId) : null,
      })
      .then((r) => r.data),

  /** @returns {Promise<ReglaAsignacion>} */
  modificar: (id, { grupoFinancieroId, criterio, clienteId, tipoGastoId }) =>
    api
      .put(`/reglas-asignacion/${id}`, {
        grupoFinancieroId: Number(grupoFinancieroId),
        criterio: Number(criterio),
        clienteId: clienteId ? Number(clienteId) : null,
        tipoGastoId: tipoGastoId ? Number(tipoGastoId) : null,
      })
      .then((r) => r.data),

  darDeBaja: (id) => api.delete(`/reglas-asignacion/${id}`).then((r) => r.data),

  reactivar: (id) => api.put(`/reglas-asignacion/${id}/reactivar`).then((r) => r.data),
};
