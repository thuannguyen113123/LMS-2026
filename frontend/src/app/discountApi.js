import api from "./api";

export const previewExportDiscountsApi = (payload) =>
  api.post("/discounts/export/preview", payload);
export const exportDiscountsApi = (payload) =>
  api.post("/discounts/export", payload, {
    responseType: "arraybuffer",
  });
