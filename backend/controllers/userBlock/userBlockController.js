import { USER_BLOCK_CODES } from "../../constants/userBlock.codes.js";
import UserBlockService from "../../services/userBlock/userBlockService.js";
import { getIO } from "../../sockets/socket.js";
import AppError from "../../utils/AppError.js";

export const userBlockController = {
  async blockUser(req, res) {
    try {
      const blockerId = req.user.id || req.user._id;
      const { blockedUserId } = req.body;

      const result = await UserBlockService.blockUser(blockerId, blockedUserId);

      const payload = {
        type: "BLOCK_UPDATE",
        userA: blockerId.toString(),
        userB: blockedUserId.toString(),
        blockedBy: blockerId.toString(),
        timestamp: Date.now(),
      };

      const io = getIO();

      io.to("user:" + blockerId.toString()).emit("user:block:update", payload);

      io.to("user:" + blockedUserId.toString()).emit(
        "user:block:update",
        payload
      );

      return res.status(201).json({
        success: true,
        code: USER_BLOCK_CODES.USER_BLOCKED,
        message: "Chặn người dùng thành công",
        data: payload,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("Block user error:", err);

      return res.status(500).json({
        success: false,
        code: USER_BLOCK_CODES.USER_BLOCK_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async unblockUser(req, res) {
    try {
      const blockerId = req.user.id || req.user._id;
      const blockedUserId = req.params.userId;

      await UserBlockService.unblockUser(blockerId, blockedUserId);

      const payload = {
        type: "BLOCK_UPDATE",
        userA: blockerId.toString(),
        userB: blockedUserId.toString(),
        blockedBy: null,
        timestamp: Date.now(),
      };

      const io = getIO();

      io.to("user:" + blockerId.toString()).emit("user:block:update", payload);

      io.to("user:" + blockedUserId.toString()).emit(
        "user:block:update",
        payload
      );

      return res.json({
        success: true,
        code: USER_BLOCK_CODES.USER_UNBLOCKED,
        message: "Bỏ chặn người dùng thành công",
        data: payload,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("Unblock user error:", err);

      return res.status(500).json({
        success: false,
        code: USER_BLOCK_CODES.USER_UNBLOCK_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async getMyBlocks(req, res) {
    try {
      const userId = req.user.id || req.user._id;

      const relations = await UserBlockService.getMyBlocks(userId);

      return res.json({
        success: true,
        data: relations,
      });
    } catch (err) {
      console.error("Get my blocks error:", err);

      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
};
