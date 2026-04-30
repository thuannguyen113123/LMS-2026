import ChatRequestService from "../../services/chatRequest/chatRequest.service.js";
import AppError from "../../utils/AppError.js";

export const chatRequestController = {
  async sendRequest(req, res) {
    try {
      const fromUserId = req.user?.id || req.user?._id;
      const { toUserId } = req.body;

      const result = await ChatRequestService.sendRequest({
        fromUserId,
        toUserId,
      });
      return res.status(201).json({
        success: true,
        code: result.code,
        message: "Gửi lời mời chat thành công",
        data: result,
      });
    } catch (err) {
      console.error("Send chat request error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "CHAT_REQUEST_SEND_FAILED",
        message: "Lỗi server",
      });
    }
  },

  async acceptRequest(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const { requestId } = req.params;

      const result = await ChatRequestService.acceptRequest(requestId, userId);

      return res.status(200).json({
        success: true,
        code: result.code,
        message: "Chấp nhận lời mời chat thành công",
        data: result,
      });
    } catch (err) {
      console.error("Accept chat request error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "CHAT_REQUEST_ACCEPT_FAILED",
        message: "Lỗi server",
      });
    }
  },

  async rejectRequest(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;
      const { requestId } = req.params;

      const result = await ChatRequestService.rejectRequest(requestId, userId);

      return res.status(200).json({
        success: true,
        code: result.code,
        message: "Từ chối lời mời chat",
        data: result,
      });
    } catch (err) {
      console.error("Reject chat request error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "CHAT_REQUEST_REJECT_FAILED",
        message: "Lỗi server",
      });
    }
  },
  async getRequests(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;

      const requests = await ChatRequestService.getUserRequests(userId);

      return res.status(200).json({
        success: true,
        code: "CHAT_REQUESTS_FETCHED",
        data: requests,
      });
    } catch (err) {
      console.error("Fetch chat requests error:", err);

      return res.status(500).json({
        success: false,
        code: "CHAT_REQUEST_FETCH_FAILED",
        message: "Lỗi server",
      });
    }
  },
};
