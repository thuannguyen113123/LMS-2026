import Discount from "../../models/payment/discount.model.js";

import { saveAuditLogs } from "../../services/auditLog/auditLog.service.js";
import DiscountService from "../../services/discount/discount.services.js";
import { DISCOUNT_CODES } from "../../constants/discount.codes.js";
import AppError from "../../utils/AppError.js";

const getUserIdentifier = (user) => user?.email || user?.phone || "unknown";

const mapDoc = (doc) => {
  if (doc.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const discountController = {
  async create(req, res) {
    try {
      const discount = await DiscountService.createDiscount(
        {
          ...req.validatedBody,
          createdBy: req.user?.id || req.user?._id,
          updatedBy: req.user?.id || req.user?._id,
        },
        req.user
      );

      return res.status(201).json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_CREATED,
        message: "Tạo mã giảm giá thành công",
        data: {
          discount,
        },
      });
    } catch (err) {
      console.error("Create discount error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: DISCOUNT_CODES.DISCOUNT_CREATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async createMany(req, res) {
    try {
      const result = await DiscountService.bulkCreateDiscounts(
        req.body,
        getUserIdentifier(req.user)
      );

      return res.status(201).json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_BULK_CREATED,
        data: {
          created: result.created,
          skipped: result.skipped,
          errors: result.errors,
        },
        summary: result.summary,
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode || 400).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("DISCOUNT BULK UNEXPECTED:", err);

      return res.status(500).json({
        success: false,
        code: DISCOUNT_CODES.DISCOUNT_BULK_CREATE_FAILED,
        message: "Import discount thất bại",
      });
    }
  },

  async list(req, res) {
    try {
      const result = await DiscountService.listDiscountsUseCase({
        query: req.query,
        role: req.user.active_role,
        userId: req.user?.id,
      });

      return res.json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_LIST_SUCCESS,
        message: "Lấy danh sách mã giảm giá thành công",
        discounts: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("Discount list error:", err);

      return res.status(500).json({
        success: false,
        code: DISCOUNT_CODES.DISCOUNT_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async detail(req, res) {
    try {
      const { id } = req.params;

      const discount = await Discount.findById(id).lean();
      if (!discount)
        return res
          .status(404)
          .json({ success: false, error: "Không tìm thấy mã giảm giá" });

      return res.json({ success: true, discount: mapDoc(discount) });
    } catch (err) {
      console.error("[DiscountController.detail] Error:", err);
      return res.status(500).json({ error: "Lỗi server khi lấy chi tiết mã" });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      const discount = await DiscountService.updateDiscount(
        id,
        req.validatedBody,
        req.user
      );

      return res.json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_UPDATED,
        message: "Cập nhật mã giảm giá thành công",
        data: {
          discount,
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
        code: DISCOUNT_CODES.DISCOUNT_UPDATE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async apply(req, res) {
    try {
      const result = await DiscountService.applyDiscount(req.body, req.user);

      return res.json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_APPLIED,
        message: "Áp dụng mã giảm giá thành công",
        data: result,
      });
    } catch (err) {
      console.error("Apply discount error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: DISCOUNT_CODES.DISCOUNT_APPLY_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async removeMany(req, res) {
    try {
      const result = await DiscountService.removeManyDiscounts(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_DELETE_SUCCESS,
        message: "Xóa mã giảm giá thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many discounts error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: DISCOUNT_CODES.DISCOUNT_DELETE_FAILED,
        message: "Lỗi server",
      });
    }
  },

  async previewExportDiscounts(req, res) {
    try {
      const result = await DiscountService.previewExportDiscounts({
        payload: req.body,
      });

      return res.json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_EXPORT_PREVIEW_SUCCESS,
        data: result,
      });
    } catch (err) {
      return res.status(err.statusCode || 500).json({
        success: false,
        code: err.code || DISCOUNT_CODES.DISCOUNT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },

  async exportDiscounts(req, res) {
    try {
      const result = await DiscountService.exportDiscounts({
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
        code: err.code || DISCOUNT_CODES.DISCOUNT_EXPORT_FAILED,
        message: err.message,
      });
    }
  },
  async featured(req, res) {
    try {
      const discount = await DiscountService.getFeaturedDiscount();

      return res.json({
        success: true,
        code: DISCOUNT_CODES.DISCOUNT_LIST_SUCCESS,
        message: "Lấy mã giảm giá nổi bật thành công",
        data: discount,
      });
    } catch (err) {
      console.error("Featured discount error:", err);

      return res.status(500).json({
        success: false,
        code: DISCOUNT_CODES.DISCOUNT_LIST_FAILED,
        message: "Lỗi server",
      });
    }
  },
};
