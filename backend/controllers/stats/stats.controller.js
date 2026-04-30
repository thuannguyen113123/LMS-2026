import statsService from "../../services/stats/stats.service.js";

export const getHeroStats = async (req, res, next) => {
  try {
    const data = await statsService.getHeroStatsUseCase();

    return res.json({
      success: true,
      code: "HERO_STATS_FETCHED",
      message: "Lấy dữ liệu hero thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const getHighlightStats = async (req, res, next) => {
  try {
    const data = await statsService.getHighlightStatsUseCase();

    return res.json({
      success: true,
      code: "HIGHLIGHT_STATS_FETCHED",
      message: "Lấy highlight stats thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};
export const getAboutStats = async (req, res, next) => {
  try {
    const data = await statsService.getAboutStatsUseCase();

    return res.json({
      success: true,
      code: "ABOUT_STATS_FETCHED",
      message: "Lấy about stats thành công",
      data,
    });
  } catch (error) {
    next(error);
  }
};
