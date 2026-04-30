import api from "./api";

export const previewExportQuizzesApi = (payload) =>
  api.post("/quizzes/export/preview", payload);

export const exportQuizzesApi = (payload) =>
  api.post("/quizzes/export", payload, {
    responseType: "arraybuffer",
  });
