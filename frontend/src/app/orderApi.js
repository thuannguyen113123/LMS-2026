import api from "./api";

export const previewExportOrdersApi = (payload) =>
  api.post("/orders/export/preview", payload);

export const exportOrdersApi = (payload) =>
  api.post("/orders/export", payload, {
    responseType: "arraybuffer",
  });
