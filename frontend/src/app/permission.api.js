import api from "./api";

export const previewExportPermissionsApi = (payload) =>
  api.post("/permissions/export/preview", payload);

export const exportPermissionsApi = (payload) =>
  api.post("/permissions/export", payload, {
    responseType: "arraybuffer",
  });
