import api from "./api";

/** @typedef {import("../types").Abono} Abono */

const BASE = "/abonocochera";

function fileNameFromDisposition(disposition, fallback) {
  if (!disposition) return fallback;
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf?.[1]) return decodeURIComponent(utf[1]);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] || fallback;
}

async function messageFromBlob(data) {
  if (!data) return "No se pudo generar el contrato";
  if (typeof data === "string") return data;
  try {
    const text = await data.text();
    try {
      const parsed = JSON.parse(text);
      return typeof parsed === "string"
        ? parsed
        : parsed?.title || parsed?.detail || parsed?.message || text;
    } catch {
      return text || "No se pudo generar el contrato";
    }
  } catch {
    return "No se pudo generar el contrato";
  }
}

export const abonoService = {
  /** @returns {Promise<Abono[]>} */
  getOcupadas: () =>
    api.get(`${BASE}/ocupadas`).then(r => r.data),

  /** @returns {Promise<Abono[]>} */
  getAllAbonos: () =>
    api.get(`${BASE}/allAbonos`).then(r => r.data),

  /** @returns {Promise<Abono>} */
  getById: (id) =>
    api.get(`${BASE}/${id}`).then(r => r.data),

  /** @returns {Promise<Abono[]>} */
  getByCliente: (clienteId) =>
    api.get(`${BASE}/cliente/${clienteId}`).then(r => r.data),

  /** @returns {Promise<Abono[]>} */
  getByCochera: (cocheraId) =>
    api.get(`${BASE}/cochera/${cocheraId}`).then(r => r.data),

  /** @returns {Promise<Abono>} */
  getByPatente: (patente) =>
    api.get(`${BASE}/patente/${encodeURIComponent(patente)}`).then(r => r.data),

  /** @returns {Promise<Abono[]>} */
  buscarPorPatente: (patente) =>
    api.get(`${BASE}/buscar`, { params: { patente } }).then(r => r.data),

  crear: (data) =>
    api.post(BASE, data).then(r => r.data),

  modificar: (id, data) =>
    api.put(`${BASE}/${id}`, data).then(r => r.data),

  agregarPlaza: (id, cocheraId) =>
    api.post(`${BASE}/${id}/plazas`, { cocheraId }).then(r => r.data),

  removerPlaza: (id, abonoPlazaId) =>
    api.delete(`${BASE}/${id}/plazas/${abonoPlazaId}`).then(r => r.data),

  moverPlaza: (id, abonoPlazaId, nuevaCocheraId) =>
    api.put(`${BASE}/${id}/plazas/${abonoPlazaId}/mover`, { nuevaCocheraId }).then(r => r.data),

  /** Compat: mueve la primera plaza activa. */
  mover: (id, nuevaCocheraId) =>
    api.put(`${BASE}/mover/${id}`, nuevaCocheraId).then(r => r.data),

  agregarVehiculo: (id, data) =>
    api.post(`${BASE}/${id}/vehiculos`, data).then(r => r.data),

  modificarVehiculo: (id, abonoVehiculoId, data) =>
    api.put(`${BASE}/${id}/vehiculos/${abonoVehiculoId}`, data).then(r => r.data),

  removerVehiculo: (id, abonoVehiculoId) =>
    api.delete(`${BASE}/${id}/vehiculos/${abonoVehiculoId}`).then(r => r.data),

  darDeBaja: (id) =>
    api.delete(`${BASE}/${id}`).then(r => r.data),

  /** Descarga el PDF de contrato del abono. */
  descargarContrato: async (id) => {
    try {
      const response = await api.get(`${BASE}/${id}/contrato.pdf`, {
        responseType: "blob",
      });
      const contentType = response.headers["content-type"] || "";
      if (contentType.includes("application/json") || contentType.includes("text/plain")) {
        throw new Error(await messageFromBlob(response.data));
      }
      const name = fileNameFromDisposition(
        response.headers["content-disposition"],
        `contrato-abono-${id}.pdf`
      );
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err.response?.data) {
        throw new Error(await messageFromBlob(err.response.data));
      }
      throw err instanceof Error ? err : new Error("No se pudo generar el contrato");
    }
  },
};
