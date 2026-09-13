import api from "./api";

function fileNameFromDisposition(disposition, fallback) {
  if (!disposition) return fallback;
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf?.[1]) return decodeURIComponent(utf[1]);
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] || fallback;
}

async function messageFromBlob(data) {
  if (!data) return "No se pudo generar el reporte";
  if (typeof data === "string") return data;
  try {
    const text = await data.text();
    try {
      const parsed = JSON.parse(text);
      return typeof parsed === "string"
        ? parsed
        : parsed?.title || parsed?.detail || parsed?.message || text;
    } catch {
      return text || "No se pudo generar el reporte";
    }
  } catch {
    return "No se pudo generar el reporte";
  }
}

async function downloadBlob(path, params, fallbackName) {
  try {
    const response = await api.get(path, {
      params,
      responseType: "blob",
    });

    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("application/json") || contentType.includes("text/plain")) {
      throw new Error(await messageFromBlob(response.data));
    }

    const name = fileNameFromDisposition(
      response.headers["content-disposition"],
      fallbackName
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
    throw err instanceof Error ? err : new Error("No se pudo generar el reporte");
  }
}

export const reportesService = {
  downloadDashboardPdf: () =>
    downloadBlob("/reportes/dashboard.pdf", undefined, "dashboard.pdf"),

  downloadPagosExcel: (desde, hasta) =>
    downloadBlob(
      "/reportes/pagos.xlsx",
      { desde, hasta },
      `pagos-${desde || "desde"}-${hasta || "hasta"}.xlsx`
    ),
};
