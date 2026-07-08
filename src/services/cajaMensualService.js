import api from "./api";

export const cajaMensualService = {

  cerrar: (year, month) =>
    api.put("/cajas/cerrar", null, { params: { year, month } }).then(r => r.data),

  getMovimientosByAbono: (abonoCocheraId) =>
    api.get(`/cajas/movimientos/abono/${abonoCocheraId}`).then(r => r.data),

  getResumen: (year, month) =>
    api.get("/cajas/resumen", { params: { year, month } }).then(r => r.data),

  getReporteMovimientos: (year, month, desde, hasta) =>
    api.get("/cajas/movimientos/reporte", {
      params: { year, month, desde, hasta },
    }).then(r => r.data),

  getConceptos: (year, month) =>
    api.get("/cajas/conceptos", { params: { year, month } }).then(r => r.data),
};