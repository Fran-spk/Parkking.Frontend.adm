import api from "./api";

/** @typedef {import("../types").Documento} Documento */
/** @typedef {import("../types").DocumentoAbonoVista} DocumentoAbonoVista */

export const documentoService = {
  /** @returns {Promise<DocumentoAbonoVista>} */
  listarPorAbono: (abonoId) =>
    api.get(`/documentos/abono/${abonoId}`).then((r) => r.data),

  /** @returns {Promise<Documento>} */
  subir: (formData) =>
    api
      .post("/documentos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  descargar: async (id, nombreFallback = "documento") => {
    const response = await api.get(`/documentos/${id}/archivo`, {
      responseType: "blob",
    });
    const disposition = response.headers["content-disposition"] || "";
    const utf = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
    const plain = /filename="?([^";]+)"?/i.exec(disposition);
    const name = utf?.[1]
      ? decodeURIComponent(utf[1])
      : plain?.[1] || nombreFallback;
    const url = window.URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  eliminar: (id) => api.delete(`/documentos/${id}`).then((r) => r.data),
};
