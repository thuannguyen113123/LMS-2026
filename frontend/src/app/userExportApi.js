import api from "./api";

export const previewExportUsersApi = (payload) =>
  api.post("/users/export/preview", payload);

export const exportUsersApi = (payload) =>
  api.post("/users/export", payload, {
    responseType: "arraybuffer",
  });
