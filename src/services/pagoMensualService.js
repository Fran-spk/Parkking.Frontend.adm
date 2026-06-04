import api from "./api";

export const pagoMensualService = {

  getByAbono: (abonoCocheraId) =>
    api.get(`/pagomensual/abono/${abonoCocheraId}`).then(r => r.data),

  getSugerido: (abonoCocheraId, mes = null) =>
    api.get(`/pagomensual/sugerido/${abonoCocheraId}`, {
      params: mes ? { mes } : {}
    }).then(r => r.data),

  getAll: (desde = null, hasta = null) =>
    api.get("/pagomensual", {
      params: {
        ...(desde && { desde }),
        ...(hasta && { hasta }),
      }
    }).then(r => r.data),

  registrar: (data) => 
    api.post("/pagomensual/pagar", data).then(r => r.data), // 👈 AGREGAR /pagar

  reporteExcel: (año = 2026) =>
    api.get(`/pagomensual/reporte-excel`, {
      params: { year: año }, // 👈 IMPORTANTE: coincide con el backend
      responseType: "blob"   // 👈 CLAVE
  })

};