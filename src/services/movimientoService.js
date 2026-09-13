import api from "./api";

export const movimientoService = {
  registrarCargoCliente: (abonoId, descripcion, monto, responsable) =>
    api
      .post("/movimientos/cargo-cliente", {
        abonoId: Number(abonoId),
        descripcion,
        monto: Number(monto),
        responsable: responsable || null,
      })
      .then((r) => r.data),

  registrarReintegroCliente: (abonoId, descripcion, monto, responsable) =>
    api
      .post("/movimientos/reintegro-cliente", {
        abonoId: Number(abonoId),
        descripcion,
        monto: Number(monto),
        responsable: responsable || null,
      })
      .then((r) => r.data),

  registrarGastoEstacionamiento: (descripcion, monto, responsable) =>
    api
      .post("/movimientos/gasto-estacionamiento", {
        descripcion,
        monto: Number(monto),
        responsable: responsable || null,
      })
      .then((r) => r.data),
};
