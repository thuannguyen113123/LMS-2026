import api from "./api";

export const previewExportModulesApi = (payload) =>
  api.post("/modules/export/preview", payload);

export const exportModulesApi = (payload) =>
  api.post("/modules/export", payload, {
    responseType: "arraybuffer",
  });
