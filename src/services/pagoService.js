import api from "./api";

export const pagoService = {
  getByAbono: (abonoId) =>
    api.get(`/pago/abono/${abonoId}`).then((r) => r.data),

  getCuotas: (abonoId) =>
    api.get(`/pago/abono/${abonoId}/cuotas`).then((r) => r.data),

  getCuotasPendientes: (abonoId) =>
    api.get(`/pago/abono/${abonoId}/cuotas-pendientes`).then((r) => r.data),

  getPendientes: () => api.get("/pago/pendientes").then((r) => r.data),

  getDetalles: (pagoId) =>
    api.get(`/pago/${pagoId}/detalles`).then((r) => r.data),

  getSugerido: (abonoId, mes = null) =>
    api.get(`/pago/sugerido/${abonoId}`, {
      params: mes ? { mes } : {},
    }).then((r) => r.data),

  getMontoPeriodo: (abonoId, periodoInicio = null) =>
    api.get(`/pago/abono/${abonoId}/monto-periodo`, {
      params: periodoInicio ? { periodoInicio } : {},
    }).then((r) => r.data),

  getDetallesCuota: (cuotaId) =>
    api.get(`/pago/cuota/${cuotaId}/detalles`).then((r) => r.data),

  getAll: (desde = null, hasta = null) =>
    api.get("/pago", {
      params: {
        ...(desde && { desde }),
        ...(hasta && { hasta }),
      },
    }).then((r) => r.data),

  getByCliente: (clienteId) =>
    api.get(`/pago/cliente/${clienteId}`).then((r) => r.data),

  getDeudaCliente: (clienteId) =>
    api.get(`/pago/deuda/cliente/${clienteId}`).then((r) => r.data),

  registrar: (data) => api.post("/pago/pagar", data).then((r) => r.data),
};
