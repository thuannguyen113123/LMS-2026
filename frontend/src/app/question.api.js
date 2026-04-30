import api from "./api";

// ===== PREVIEW EXPORT QUESTIONS =====
export const previewExportQuestionsApi = (payload) =>
  api.post("/questions/export/preview", payload);

// ===== EXPORT QUESTIONS =====
export const exportQuestionsApi = (payload) =>
  api.post("/questions/export", payload, {
    responseType: "arraybuffer",
  });
