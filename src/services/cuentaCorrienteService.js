import api from "./api";

/** @typedef {import("../types").CuentaCorriente} CuentaCorriente */

function paramsDe(desde, hasta) {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  return params;
}

export const cuentaCorrienteService = {
  /** @returns {Promise<CuentaCorriente>} */
  estacionamiento: (desde, hasta) =>
    api
      .get("/cuentas-corrientes/estacionamiento", { params: paramsDe(desde, hasta) })
      .then((r) => r.data),

  /** @returns {Promise<CuentaCorriente>} */
  cliente: (clienteId, desde, hasta) =>
    api
      .get(`/cuentas-corrientes/clientes/${clienteId}`, { params: paramsDe(desde, hasta) })
      .then((r) => r.data),
};
