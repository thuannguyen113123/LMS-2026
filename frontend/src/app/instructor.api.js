import api from "./api";

export const previewExportInstructorsApi = (payload) =>
  api.post("/instructors/export/preview", payload);

export const exportInstructorsApi = (payload) =>
  api.post("/instructors/export", payload, {
    responseType: "arraybuffer",
  });
