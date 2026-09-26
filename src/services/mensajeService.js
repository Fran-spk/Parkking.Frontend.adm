import api from "./api";

/** @typedef {import("../types").Mensaje} Mensaje */

export const mensajeService = {
  /** @returns {Promise<Mensaje[]>} */
  listar: ({ tipo, estado, take = 100 } = {}) =>
    api
      .get("/mensaje", {
        params: {
          ...(tipo ? { tipo } : {}),
          ...(estado ? { estado } : {}),
          take,
        },
      })
      .then((r) => r.data),

  /** @returns {Promise<Mensaje[]>} */
  porAbono: (abonoId, take = 50) =>
    api.get(`/mensaje/abono/${abonoId}`, { params: { take } }).then((r) => r.data),

  /** @returns {Promise<Mensaje[]>} */
  porRecibo: (reciboId, take = 50) =>
    api.get(`/mensaje/recibo/${reciboId}`, { params: { take } }).then((r) => r.data),
};
