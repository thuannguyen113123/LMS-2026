import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";
export const CHATROOM_EXPORT_COLUMNS = [
  { header: "Tên phòng", key: "name" },
  { header: "Loại", key: "type" },
  { header: "Số thành viên", key: "members" },
  { header: "Ngày tạo", key: "createdAt" },
];
export function mapChatRoomExportData(chatRooms = []) {
  console.log("ChatRoom", chatRooms);
  return chatRooms.map((room) => ({
    name: room.name || "",
    type: room.type,
    members: room.user_ids?.length || 0,
    created_at: new Date(room.created_at).toLocaleString(),
  }));
}

export async function exportChatRoomsFile({ chatRooms, format }) {
  const data = mapChatRoomExportData(chatRooms);

  if (format === "excel") {
    return exportExcel({
      sheetName: "ChatRooms",
      columns: CHATROOM_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách Chat Room",
    columns: CHATROOM_EXPORT_COLUMNS,
    data,
  });
}
