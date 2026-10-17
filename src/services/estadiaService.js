import api from "./api";

function mensaje(error, fallback) {
  const data = error.response?.data;
  return typeof data === "string" ? data : fallback;
}

async function descargarPdf(url, nombre) {
  const response = await api.get(url, { responseType: "blob" });
  const contentType = response.headers["content-type"] || "";
  if (!contentType.includes("pdf")) {
    const texto = await response.data.text();
    throw new Error(texto || "No se pudo imprimir el ticket");
  }
  const objectUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = nombre;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
}

export const estadiaService = {
  abiertas: () => api.get("/estadia/abiertas").then((r) => r.data),

  pagos: (params) => api.get("/pago/estadia", { params }).then((r) => r.data),

  listar: (params) => api.get("/estadia", { params }).then((r) => r.data),

  ingresar: (data) => api.post("/estadia/ingresar", data).then((r) => r.data),

  salir: (id, data) => api.post(`/estadia/${id}/salir`, data).then((r) => r.data),

  anular: (id) => api.post(`/estadia/${id}/anular`).then((r) => r.data),

  ticket: (id) => descargarPdf(`/estadia/${id}/ticket.pdf`, `ticket-estadia-${id}.pdf`),

  mensaje,
};
