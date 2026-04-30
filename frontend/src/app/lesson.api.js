import api from "./api";

export const previewExportLessonsApi = (payload) =>
  api.post("/lessons/export/preview", payload);

export const exportLessonsApi = (payload) =>
  api.post("/lessons/export", payload, {
    responseType: "arraybuffer",
  });
