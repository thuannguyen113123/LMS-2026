import ContactService from "../../services/contact/contact.service.js";
import AppError from "../../utils/AppError.js";

export const ContactController = {
  async create(req, res) {
    try {
      const contact = await ContactService.createMessage(req.body);

      return res.status(201).json({
        success: true,
        message: "Gửi liên hệ thành công",
        data: {
          id: contact._id,
          status: contact.status,
        },
      });
    } catch (err) {
      console.error("Create contact error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Không gửi được liên hệ",
      });
    }
  },
  async list(req, res) {
    try {
      const result = await ContactService.listAdminContactsUseCase({
        query: req.query,
      });

      return res.json({
        success: true,
        message: "Lấy danh sách liên hệ thành công",
        contacts: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      console.error("List contact error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const contact = await ContactService.updateStatusUseCase({
        id,
        status,
      });

      return res.json({
        success: true,
        message: "Cập nhật trạng thái thành công",
        data: contact,
      });
    } catch (err) {
      console.error("Update contact status error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },
  async removeMany(req, res) {
    try {
      const result = await ContactService.removeManyContactsUseCase(
        req.body.ids,
        req.user
      );

      return res.json({
        success: true,
        code: "CONTACT_DELETE_SUCCESS",
        message: "Xóa liên hệ thành công",
        data: result,
      });
    } catch (err) {
      console.error("Remove many contacts error:", err);

      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        code: "CONTACT_DELETE_FAILED",
        message: "Server error",
      });
    }
  },
};
