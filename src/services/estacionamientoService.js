import api from "./api";

export const estacionamientoService = {

  get: () =>
    api.get("/estacionamiento").then(r => r.data),

  modificar: (data) =>
    api.put("/estacionamiento", data).then(r => r.data),
};