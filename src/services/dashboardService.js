import api from "./api";

/** @typedef {import("../types").Dashboard} Dashboard */

export const dashboardService = {
  /** @returns {Promise<Dashboard>} */
  getSummary: () =>
    api.get("/dashboard/summary").then(r => r.data),
};