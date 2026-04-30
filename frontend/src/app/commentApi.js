import api from "./api";

export const previewExportCommentsApi = (payload) =>
  api.post("/comments/export/preview", payload);

export const exportCommentsApi = (payload) =>
  api.post("/comments/export", payload, {
    responseType: "arraybuffer",
  });
