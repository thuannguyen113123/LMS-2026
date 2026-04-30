import api from "./api";

export const exportRolesApi = (payload) =>
  api.post("/roles/export", payload, {
    responseType: "arraybuffer",
  });
export const previewExportRolesApi = (payload) =>
  api.post("/roles/export/preview", payload);
