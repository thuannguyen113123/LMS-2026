import api from "./api";

export const previewExportCoursesApi = (payload) =>
  api.post("/courses/export/preview", payload);

export const exportCoursesApi = (payload) =>
  api.post("/courses/export", payload, {
    responseType: "arraybuffer",
  });
