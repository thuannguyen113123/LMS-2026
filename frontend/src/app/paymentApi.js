import api from "./api";

export const previewExportPaymentsApi = (payload) =>
  api.post("/payments/export/preview", payload);

export const exportPaymentsApi = (payload) =>
  api.post("/payments/export", payload, {
    responseType: "arraybuffer",
  });
