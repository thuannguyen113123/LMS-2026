import ChatSuggestionService from "../../services/chatSuggestion/chatSuggestion.service.js";
import AppError from "../../utils/AppError.js";

export const chatSuggestionController = {
  async getSuggestions(req, res) {
    try {
      const userId = req.user?.id || req.user?._id;

      const suggestions = await ChatSuggestionService.getSuggestions(userId);

      return res.status(200).json({
        success: true,
        code: "CHAT_SUGGESTIONS_FETCHED",
        message: "Lấy danh sách gợi ý chat thành công",
        data: {
          suggestions,
        },
      });
    } catch (err) {
      console.error("Chat suggestions error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "CHAT_SUGGESTIONS_FAILED",
        message: "Lỗi server",
      });
    }
  },
};
