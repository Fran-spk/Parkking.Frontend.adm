import api from "./api";

export const cajaMensualService = {

  // Trae la caja de un mes con sus movimientos y si es ingresos o egresos
  getByMes: (year, month) =>
    api.get("/cajamensual/mes", { params: { year, month } }).then(r => r.data )
  ,

  // Registrar gasto operativo manual
  registrarGasto: (year, month, descripcion, monto, responsable, tipoConcepto) =>
    api.post("/cajamensual/movimiento", {
      year, month,
      tipo: 1, // Egreso
      descripcion,
      monto,
      responsable: responsable || null,
      tipoConcepto: tipoConcepto || null,
    }).then(r => r.data),

  // Cerrar caja del mes
  cerrar: (year, month) =>
    api.put("/cajamensual/cerrar", null, { params: { year, month } }).then(r => r.data),

  getMovimientosByAbono: (abonoCocheraId) =>
    api.get(`/cajamensual/movimientos/abono/${abonoCocheraId}`).then(r => r.data),

    registrarMovimientoAbono: (abonoCocheraId, tipoConcepto, descripcion, monto, responsable, clienteNombre) => {
    const hoy = new Date();
    return api.post("/cajamensual/movimiento", {
        year:           hoy.getFullYear(),
        month:          hoy.getMonth() + 1,
        tipoConcepto,        // 2 = CargoCliente, 1 = ReintegroCliente
        descripcion,
        monto:          Number(monto),
        responsable:    responsable || null,
        abonoCocheraId: Number(abonoCocheraId),
        clienteNombre:  clienteNombre || null,
    }).then(r => r.data);
    },
};