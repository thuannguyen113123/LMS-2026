import api from "./api";

export const previewExportChatRoomsApi = (payload) =>
  api.post("/chat/rooms/export/preview", payload);

export const exportChatRoomsApi = (payload) =>
  api.post("/chat/rooms/export", payload, {
    responseType: "arraybuffer",
  });
