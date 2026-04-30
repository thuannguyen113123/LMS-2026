import AppError from "../../utils/AppError.js";
import { STUDENT_CODES } from "../../constants/student.codes.js";
import studentBookmarkService from "../../services/student/student.bookmark.service.js";
export const studentBookmarkController = {
  async getMyBookmarks(req, res) {
    try {
      const result = await studentBookmarkService.getBookmarksUseCase({
        userId: req.user.id,
        query: req.query,
      });

      return res.json({
        success: true,
        code: STUDENT_CODES.BOOKMARK_LIST_SUCCESS,
        bookmarks: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("Get bookmarks error:", err);

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.BOOKMARK_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async toggleBookmark(req, res) {
    try {
      const { courseId } = req.params;

      const result = await studentBookmarkService.toggleBookmark(
        req.user.id,
        courseId,
        req.user
      );

      return res.json({
        success: true,
        code: result.code,
        data: {
          bookmarks: result.bookmarks,
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

      console.error("Toggle bookmark error:", err);

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.BOOKMARK_TOGGLE_FAILED,
        message: "Lỗi server",
      });
    }
  },
};
