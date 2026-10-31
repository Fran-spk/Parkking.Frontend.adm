import api from "./api";

function apiErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (typeof data === "string") return data;
  if (data?.mensaje) return data.mensaje;
  if (data?.title) return data.title;
  return fallback;
}

export const landingService = {
  async consultar({ nombre, estacionamiento, mail, mensaje }) {
    try {
      const response = await api.post("/Landing/consultas", {
        nombre,
        estacionamiento,
        mail,
        mensaje,
      });
      const data = response?.data ?? response;
      if (typeof data === "string" && data.trim()) return data;
      return "Te vamos a escribir a la brevedad.";
    } catch (error) {
      throw new Error(apiErrorMessage(error, "No se pudo enviar la consulta"));
    }
  },
};
