import { createAsyncThunk } from "@reduxjs/toolkit";
import { addToast } from "../ui/uiSlice";
import api from "../../app/api";
import { buildQueryString } from "../courses/coursesThunks";
import {
  exportChatRoomsApi,
  previewExportChatRoomsApi,
} from "../../app/chatRoomsApi";

export const toastMap = {
  CHAT_ROOM_CREATED: {
    type: "success",
    title: "Chat",
    message: "Tạo phòng chat thành công",
  },

  CHAT_ROOM_ALREADY_EXISTS: {
    type: "info",
    title: "Chat",
    message: "Phòng chat đã tồn tại",
  },

  CHAT_ROOM_SELF_NOT_ALLOWED: {
    type: "warning",
    title: "Chat",
    message: "Không thể chat với chính mình",
  },

  CHAT_ROOM_BLOCKED: {
    type: "error",
    title: "Chat",
    message: "Bạn không thể chat với người này",
  },

  CHAT_ROOM_EXISTS: {
    type: "warning",
    title: "Phòng chat",
    message: "Phòng đã tồn tại",
  },

  CHAT_ROOM_CREATE_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Tạo phòng thất bại",
  },

  CHAT_ROOM_NAME_REQUIRED: {
    type: "warning",
    title: "Phòng chat",
    message: "Tên phòng không hợp lệ",
  },
  CHAT_ROOM_MEMBER_ADDED: {
    type: "success",
    title: "Phòng chat",
    message: "Thêm thành viên thành công",
  },

  CHAT_ROOM_MEMBER_EXISTS: {
    type: "warning",
    title: "Phòng chat",
    message: "Thành viên đã tồn tại trong phòng",
  },

  CHAT_ROOM_NOT_FOUND: {
    type: "error",
    title: "Phòng chat",
    message: "Không tìm thấy phòng",
  },

  CHAT_ROOM_ADD_MEMBER_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Thêm thành viên thất bại",
  },
  CHAT_ROOM_MEMBER_REMOVED: {
    type: "success",
    title: "Phòng chat",
    message: "Gỡ thành viên thành công",
  },

  CHAT_ROOM_MEMBER_NOT_FOUND: {
    type: "warning",
    title: "Phòng chat",
    message: "Thành viên không tồn tại trong phòng",
  },

  CHAT_ROOM_REMOVE_MEMBER_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Gỡ thành viên thất bại",
  },
  CHAT_ROOM_ADMINS_UPDATED: {
    type: "success",
    title: "Phòng chat",
    message: "Cập nhật trưởng nhóm thành công",
  },

  CHAT_ROOM_ADMIN_INVALID: {
    type: "warning",
    title: "Phòng chat",
    message: "Admin không hợp lệ hoặc không thuộc phòng",
  },

  CHAT_ROOM_SET_ADMIN_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Cập nhật trưởng nhóm thất bại",
  },
  CHAT_ROOM_USER_MUTED: {
    type: "success",
    title: "Phòng chat",
    message: "Người dùng đã bị mute",
  },

  CHAT_ROOM_USER_NOT_FOUND: {
    type: "warning",
    title: "Phòng chat",
    message: "Người dùng không thuộc phòng",
  },

  CHAT_ROOM_MUTE_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Mute user thất bại",
  },
  CHAT_ROOM_USER_BANNED: {
    type: "success",
    title: "Phòng chat",
    message: "Người dùng đã bị ban khỏi phòng",
  },

  CHAT_ROOM_BAN_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Ban user thất bại",
  },

  CHAT_ROOM_FORBIDDEN: {
    type: "error",
    title: "Phòng chat",
    message: "Bạn không có quyền thực hiện hành động này",
  },

  CHAT_ROOM_INVALID_ACTION: {
    type: "warning",
    title: "Phòng chat",
    message: "Hành động không hợp lệ",
  },

  CHAT_ROOM_USER_UNMUTED: {
    type: "success",
    title: "Phòng chat",
    message: "Đã bỏ mute người dùng",
  },

  CHAT_ROOM_USER_UNBANNED: {
    type: "success",
    title: "Phòng chat",
    message: "Đã bỏ ban người dùng",
  },
  // ===== CHATROOM EXPORT =====

  CHATROOM_EXPORT_PREVIEW_SUCCESS: {
    type: "info",
    title: "Phòng chat",
    message: "Đã tạo dữ liệu xem trước export",
  },

  CHATROOM_EXPORT_SUCCESS: {
    type: "success",
    title: "Phòng chat",
    message: "Xuất phòng chat thành công",
  },

  CHATROOM_EXPORT_EMPTY: {
    type: "warning",
    title: "Phòng chat",
    message: "Không có dữ liệu để export",
  },

  CHATROOM_EXPORT_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Xuất phòng chat thất bại",
  },

  CHATROOM_EXPORT_SCOPE_INVALID: {
    type: "error",
    title: "Phòng chat",
    message: "Phạm vi export không hợp lệ",
  },

  CHATROOM_EXPORT_SELECTED_EMPTY: {
    type: "warning",
    title: "Phòng chat",
    message: "Chưa chọn phòng chat để export",
  },

  CHATROOM_EXPORT_FORMAT_INVALID: {
    type: "error",
    title: "Phòng chat",
    message: "Định dạng export không hợp lệ",
  },
  CHAT_ROOM_UPDATED: {
    type: "success",
    title: "Phòng chat",
    message: "Cập nhật phòng thành công",
  },

  CHAT_ROOM_UPDATE_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Cập nhật phòng thất bại",
  },
  CHATROOM_DELETE_SUCCESS: {
    type: "success",
    title: "Phòng chat",
    message: "Xóa phòng chat thành công",
  },

  CHATROOM_DELETE_FAILED: {
    type: "error",
    title: "Phòng chat",
    message: "Xóa phòng chat thất bại",
  },
};

// ✅ 1. Lấy danh sách phòng chat
export const fetchAdminChatRooms = createAsyncThunk(
  "chatRooms/adminList",

  async (args = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, filters = {}, search = "" } = args;

      const params = buildQueryString({
        page,
        limit,
        search,
        ...filters,
      });

      const res = await api.get(`/chat/rooms?${params}`);

      return res.data;
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchUserChatRooms = createAsyncThunk(
  "chatRooms/userList",

  async (args = {}, { rejectWithValue }) => {
    try {
      const {
        cursor = null,
        limit = 10,
        filters = {},
        isLoadMore = false,
      } = args;

      const params = buildQueryString({
        cursor,
        limit,
        ...filters,
      });

      const res = await api.get(`/chat/rooms/public?${params}`);

      return {
        rooms: res.data.rooms,
        pagination: res.data.pagination,
        code: res.data.code,
        isLoadMore,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code,
      });
    }
  }
);

export const fetchRoomMembers = createAsyncThunk(
  "chatRooms/fetchRoomMembers",
  async ({ roomId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/members`);

      return {
        roomId,
        data: res.data.members || [],
        code: res.data.code,
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "ROOM_MEMBERS_LIST_FAILED",
      });
    }
  }
);
export const fetchRoomStats = createAsyncThunk(
  "chatRooms/fetchRoomStats",
  async ({ roomId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/stats`);

      return {
        roomId,
        stats: res.data.data, // ⚠️ vì controller trả data
      };
    } catch (err) {
      return rejectWithValue({
        code: err.response?.data?.code || "ROOM_STATS_FAILED",
      });
    }
  }
);

// ✅ 2. Tạo phòng mới
export const createChatRoom = createAsyncThunk(
  "chatRooms/create",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/chat/rooms", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

export const createPrivateRoom = createAsyncThunk(
  "chatRooms/createPrivate",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/chat-rooms/private", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ✅ 3. Cập nhật phòng
export const updateChatRoom = createAsyncThunk(
  "chatRooms/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { _id, ...data } = payload;
      const res = await api.put(`/chat-rooms/${_id}`, data);

      dispatch(
        addToast({
          type: "success",
          title: "Cập nhật phòng",
          message: "Thông tin phòng đã được cập nhật!",
        })
      );

      return res.data.room;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Cập nhật thất bại",
          message: err.response?.data?.error || "Lỗi khi cập nhật phòng.",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// ✅ 5. Thêm thành viên
export const addMemberToRoom = createAsyncThunk(
  "chatRooms/addMember",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/chat/rooms/add-member", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ✅ 6. Gỡ thành viên
export const removeMemberFromRoom = createAsyncThunk(
  "chatRooms/removeMember",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/chat/rooms/remove-member", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ✅ 7. Tạo nhiều phòng
export const createManyChatRooms = createAsyncThunk(
  "chatRooms/createMany",
  async (payloadList, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/chat-rooms/bulk", payloadList);

      dispatch(
        addToast({
          type: "success",
          title: "Tạo nhiều phòng",
          message: `${res.data.chatRooms.length} phòng đã được tạo.`,
        })
      );

      return res.data.chatRooms;
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Lỗi tạo nhiều",
          message: err.response?.data?.error || "Lỗi tạo nhiều phòng.",
        })
      );

      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// ✅ 8. Xóa nhiều phòng
export const deleteManyChatRooms = createAsyncThunk(
  "chatRooms/deleteMany",
  async (ids, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/chat/rooms/delete-many`, { ids });

      const { code, data } = res.data;

      // ✅ toast theo backend
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        deletedIds: data.deletedIds,
        deletedCount: data.deletedCount,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "CHATROOM_DELETE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ✅ 9. Gán admin
export const setAdminsInRoom = createAsyncThunk(
  "chatRooms/setAdmins",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post("/chat/rooms/set-admins", payload);

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// ✅ 10. Lấy phòng admin
export const fetchAdminChatRoomsAll = createAsyncThunk(
  "chatRooms/adminListAll",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.get("/chat-rooms/admin/all");
      return response.data.chatRooms || []; // ✅ đảm bảo adapter dùng được
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          title: "Lấy phòng thất bại",
          message: err.response?.data?.error || "Lỗi khi lấy phòng admin.",
        })
      );
      return rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// 3. Ban user khỏi phòng
export const banUserFromRoom = createAsyncThunk(
  "chatRooms/banUser",
  async ({ roomId, userId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/chat/rooms/${roomId}/ban`, { userId });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 4. Mute user trong phòng
export const muteUserInRoom = createAsyncThunk(
  "chatRooms/muteUser",
  async ({ roomId, userId }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(`/chat/rooms/${roomId}/mute`, {
        userId,
      });

      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "SERVER_ERROR";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);

// 5. Cập nhật settings phòng (khóa phòng,...)
export const updateRoomSettings = createAsyncThunk(
  "chatRooms/adminUpdateSettings",
  async ({ roomId, settings }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.put(
        `/chat/rooms/admin/${roomId}/settings`,
        settings
      );

      const { code, data } = res.data;

      // ✅ toast theo code backend
      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        room: data.room,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "CHAT_ROOM_UPDATE_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const previewExportChatRooms = createAsyncThunk(
  "chatRooms/exportPreview",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await previewExportChatRoomsApi(payload);
      const { code, data } = res.data;

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return {
        code,
        preview: data,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "CHATROOM_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
export const exportChatRooms = createAsyncThunk(
  "chatRooms/export",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await exportChatRoomsApi(payload);

      const contentType = res.headers["content-type"];
      const disposition = res.headers["content-disposition"];

      let fileName = "chatrooms_export";

      if (disposition) {
        const match = disposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const toast = toastMap.CHATROOM_EXPORT_SUCCESS || {
        type: "success",
        message: "Xuất phòng chat thành công",
      };

      dispatch(addToast(toast));

      return {
        buffer: res.data,
        fileName,
        contentType,
      };
    } catch (err) {
      const res = err.response?.data;
      const code = res?.code || "CHATROOM_EXPORT_FAILED";

      const toast = toastMap[code];
      if (toast) dispatch(addToast(toast));

      return rejectWithValue({ code });
    }
  }
);
