import ChatRoomService from "../../services/chat/chatRoom.service.js";
import { CHAT_ROOM_CODES } from "../../constants/chatRoom.codes.js";
import AppError from "../../utils/AppError.js";

export const chatRoomController = {
  async list(req, res) {
    try {
      const result = await ChatRoomService.listAdminRoomsUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id || req.user._id,
      });

      return res.json({
        success: true,
        code: CHAT_ROOM_CODES.CHAT_ROOM_LIST_SUCCESS,
        message: "Lấy danh sách phòng thành công",
        rooms: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List chat rooms error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async listUserRooms(req, res) {
    try {
      const result = await ChatRoomService.listUserRoomsUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user.id || req.user._id,
      });

      return res.json({
        success: true,
        code: CHAT_ROOM_CODES.CHAT_ROOM_LIST_SUCCESS,
        message: "Lấy danh sách phòng thành công",
        rooms: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List chat rooms error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async getRoomStats(req, res) {
    try {
      const stats = await ChatRoomService.getRoomStats(
        req.params.roomId,
        req.user.id
      );

      return res.json({
        success: true,
        code: CHAT_ROOM_CODES.STATS_LIST_SUCCESS,
        message: "Lấy thống kê phòng chat thành công",
        data: stats,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.STATS_LIST_FAILED,
        message: "Server error",
      });
    }
  },
  async listRoomMembers(req, res) {
    try {
      const result = await ChatRoomService.listRoomMembersUseCase({
        roomId: req.params.roomId,
        userId: req.user.id || req.user._id,
      });

      return res.json({
        success: true,
        code: CHAT_ROOM_CODES.ROOM_MEMBERS_LIST_SUCCESS,
        message: "Lấy thành viên phòng thành công",
        members: result.data,
      });
    } catch (err) {
      console.error("List room members error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.ROOM_MEMBERS_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async create(req, res) {
    try {
      const room = await ChatRoomService.createRoom(
        {
          ...req.validatedBody,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        code: CHAT_ROOM_CODES.CHAT_ROOM_CREATED,
        message: "Tạo phòng thành công",
        data: {
          room,
        },
      });
    } catch (err) {
      console.error("Create room error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async createPrivateRoom(req, res) {
    try {
      const userA = req.user.id;
      const { userB } = req.body;

      const result = await ChatRoomService.createPrivateRoom(userA, userB);

      return res.status(201).json({
        success: true,
        code: result.code,
        message: "Tạo phòng chat thành công",
        data: {
          room: result.room,
        },
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async addMember(req, res) {
    try {
      const room = await ChatRoomService.addMember(req.validatedBody, req.user);

      return res.status(200).json({
        success: true,
        code: CHAT_ROOM_CODES.CHAT_ROOM_MEMBER_ADDED,
        message: "Thêm thành viên thành công",
        data: { room },
      });
    } catch (err) {
      console.log(err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_ADD_MEMBER_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async removeMember(req, res) {
    try {
      const room = await ChatRoomService.removeMember(
        req.validatedBody,
        req.user
      );

      return res.status(200).json({
        success: true,
        code: CHAT_ROOM_CODES.CHAT_ROOM_MEMBER_REMOVED,
        message: "Gỡ thành viên thành công",
        data: { room },
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_REMOVE_MEMBER_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async setAdmins(req, res) {
    try {
      const room = await ChatRoomService.setAdmins(req.validatedBody, req.user);

      return res.status(200).json({
        success: true,
        code: CHAT_ROOM_CODES.CHAT_ROOM_ADMINS_UPDATED,
        message: "Cập nhật trưởng nhóm thành công",
        data: { room },
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_SET_ADMIN_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async muteUser(req, res) {
    try {
      const result = await ChatRoomService.muteUser(
        {
          roomId: req.params.roomId,
          userId: req.body.userId,
        },
        req.user
      );

      return res.status(200).json({
        success: true,
        code: result.code,
        message: "Toggle mute thành công",
        data: { room: result.room },
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_MUTE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async banUser(req, res) {
    try {
      const result = await ChatRoomService.banUser(
        {
          roomId: req.params.roomId,
          userId: req.body.userId,
        },
        req.user
      );

      return res.status(200).json({
        success: true,
        code: result.code,
        message: "Toggle ban thành công",
        data: { room: result.room },
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_BAN_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async previewExportChatRooms(req, res) {
    try {
      const result = await ChatRoomService.previewExportChatRooms({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: CHAT_ROOM_CODES.CHATROOM_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || CHAT_ROOM_CODES.CHATROOM_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportChatRooms(req, res) {
    try {
      const result = await ChatRoomService.exportChatRooms({
        payload: req.body,
        user: req.user,
      });

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );

      res.setHeader("Content-Type", result.contentType);

      return res.send(result.buffer);
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || CHAT_ROOM_CODES.CHATROOM_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
  async removeMany(req, res) {
    try {
      const result = await ChatRoomService.removeManyChatRooms(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: CHAT_ROOM_CODES.CHATROOM_DELETE_SUCCESS,
        message: "Xóa phòng chat thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many chat rooms error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHATROOM_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async updateSettings(req, res) {
    try {
      const room = await ChatRoomService.updateRoomSettings(
        req.params.roomId,
        req.validatedBody,
        req.user
      );

      return res.status(200).json({
        success: true,
        code: CHAT_ROOM_CODES.CHAT_ROOM_UPDATED,
        message: "Cập nhật phòng thành công",
        data: {
          room,
        },
      });
    } catch (err) {
      console.error("Update room error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: CHAT_ROOM_CODES.CHAT_ROOM_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },
};
