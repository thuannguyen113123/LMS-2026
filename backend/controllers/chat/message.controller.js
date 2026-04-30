import { MESSAGE_CODES } from "../../constants/message.codes.js";

import MessageService, {
  mapMessage,
} from "../../services/message/message.service.js";
import { getIO } from "../../sockets/socket.js";
import AppError from "../../utils/AppError.js";

export const messageController = {
  async listRoomMessages(req, res) {
    try {
      const result = await MessageService.listRoomMessagesUseCase({
        roomId: req.params.roomId,
        userId: req.user.id,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        cursor: req.query.cursor,
      });

      return res.json({
        success: true,
        code: MESSAGE_CODES.MESSAGE_LIST_SUCCESS,
        message: "Lấy danh sách tin nhắn thành công",
        messages: result.data,
        pagination: result.pagination,
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
        code: MESSAGE_CODES.COURSE_LIST_FAILED,
        message: "Server error",
      });
    }
  },
  async listAdminMessages(req, res) {
    try {
      const result = await MessageService.listAdminMessagesUseCase({
        userId: req.user.id,
        query: req.query,
      });

      return res.json({
        success: true,
        code: MESSAGE_CODES.MESSAGE_LIST_SUCCESS,
        message: "Lấy danh sách tin nhắn thành công",
        messages: result.data,
        pagination: result.pagination,
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
        code: MESSAGE_CODES.COURSE_LIST_FAILED,
        message: "Server error",
      });
    }
  },

  async sendMessage(req, res) {
    try {
      const senderId = req.user.id;
      const { roomId, content, attachments, replyTo, clientTempId } = req.body;

      const { message, receivers } = await MessageService.sendMessage({
        roomId,
        senderId,
        content,
        attachments,
        replyTo,
      });

      const payload = {
        ...mapMessage(message),
        clientTempId,
      };

      const io = getIO();

      io.to(roomId.toString()).emit("message:new", payload);

      receivers.forEach((userId) => {
        io.to("user:" + userId.toString()).emit("notification:update");
      });

      return res.status(201).json({
        success: true,
        code: MESSAGE_CODES.MESSAGE_SENT,
        data: {
          message: {
            id: payload.id,
          },
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

      console.error("Send message error:", err);

      return res.status(500).json({
        success: false,
        code: MESSAGE_CODES.MESSAGE_SEND_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async deleteMessage(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;

      const mapped = await MessageService.softDeleteMessage(messageId, userId);

      const io = getIO();

      io.to(mapped.roomId.toString()).emit("message:recalled", mapped);

      return res.json({
        success: true,
        code: MESSAGE_CODES.MESSAGE_RECALLED,
        data: mapped,
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
        code: MESSAGE_CODES.MESSAGE_RECALL_FAILED,
        message: "Server error",
      });
    }
  },

  async addReaction(req, res) {
    try {
      const userId = req.user.id;
      const messageId = req.params.id;
      const { reaction } = req.body;

      if (!reaction) {
        return res.status(400).json({
          success: false,
          error: "REACTION_REQUIRED",
        });
      }

      const reactions = await MessageService.addReaction(
        messageId,
        userId,
        reaction
      );

      return res.json({
        success: true,
        data: reactions,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
  },
};
