import api from "./api";

export const movimientoService = {

  // Cargo al cliente (debe pagar) — POST /movimientos/cargo-cliente
  registrarCargoCliente: (abonoCocheraId, descripcion, monto, responsable) =>
    api.post("/movimientos/cargo-cliente", {
      abonoCocheraId: Number(abonoCocheraId),
      descripcion,
      monto: Number(monto),
      responsable: responsable || null,
    }).then(r => r.data),

  // Reintegro al cliente (el estacionamiento devuelve) — POST /movimientos/reintegro-cliente
  registrarReintegroCliente: (abonoCocheraId, descripcion, monto, responsable) =>
    api.post("/movimientos/reintegro-cliente", {
      abonoCocheraId: Number(abonoCocheraId),
      descripcion,
      monto: Number(monto),
      responsable: responsable || null,
    }).then(r => r.data),

  // Gasto operativo del estacionamiento — POST /movimientos/gasto-estacionamiento
  registrarGastoEstacionamiento: (descripcion, monto, responsable) =>
    api.post("/movimientos/gasto-estacionamiento", {
      descripcion,
      monto: Number(monto),
      responsable: responsable || null,
    }).then(r => r.data),
};