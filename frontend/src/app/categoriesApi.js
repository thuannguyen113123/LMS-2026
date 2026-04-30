import api from "./api";

export const previewExportCategoriesApi = (payload) =>
  api.post("/categories/export/preview", payload);

export const exportCategoriesApi = (payload) =>
  api.post("/categories/export", payload, {
    responseType: "arraybuffer",
  });
