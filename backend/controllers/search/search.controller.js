import { SEARCH_CODES } from "../../constants/search.codes.js";
import * as searchService from "../../services/search/search.services.js";
import AppError from "../../utils/AppError.js";

export const searchCourses = async (req, res) => {
  try {
    const { q, limit = 10, page = 1 } = req.query;

    const result = await searchService.searchCourses({
      q,
      limit: Number(limit),
      page: Number(page),
    });

    return res.status(200).json({
      success: true,
      code: SEARCH_CODES.SEARCH_SUCCESS,
      message: "Tìm kiếm khóa học thành công",
      data: result,
    });
  } catch (err) {
    console.error("SearchCourses controller error:", err);

    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        success: false,
        code: err.code,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      code: SEARCH_CODES.SEARCH_FAILED,
      message: "Lỗi server",
    });
  }
};
