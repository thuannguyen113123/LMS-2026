import api from "./api";

export const previewExportStudentsApi = (payload) =>
  api.post("/students/export/preview", payload);

export const exportStudentsApi = (payload) =>
  api.post("/students/export", payload, {
    responseType: "arraybuffer",
  });
