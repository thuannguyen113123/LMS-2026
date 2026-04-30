import AppError from "../../utils/AppError.js";
import { STUDENT_CODES } from "../../constants/student.codes.js";
import studentCertificateService from "../../services/certificate/studentCertificate.service.js";

export const studentCertificateController = {
  async listAdmin(req, res) {
    try {
      const result =
        await studentCertificateService.listAdminCertificatesUseCase({
          query: req.query,
          userId: req.user.id,
          role: req.user.active_role,
        });

      return res.json({
        success: true,
        code: STUDENT_CODES.CERTIFICATE_LIST_SUCCESS,
        certificates: result.data,
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

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.CERTIFICATE_LIST_FAILED,
        message: "Server error",
      });
    }
  },

  async listPublic(req, res) {
    try {
      const result = await studentCertificateService.listMyCertificatesUseCase(
        req.user.id
      );

      return res.json({
        success: true,
        code: STUDENT_CODES.CERTIFICATE_LIST_SUCCESS,
        certificates: result.data,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.CERTIFICATE_LIST_FAILED,
        message: "Server error",
      });
    }
  },

  async issueCertificate(req, res) {
    try {
      const certificate = await studentCertificateService.issueCertificate({
        ...req.body,
      });

      return res.status(201).json({
        success: true,
        code: STUDENT_CODES.CERTIFICATE_ISSUE_SUCCESS,
        data: { certificate },
      });
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({
          success: false,
          code: err.code,
          message: err.message,
        });
      }

      console.error("Issue certificate error:", err);

      return res.status(500).json({
        success: false,
        code: STUDENT_CODES.CERTIFICATE_ISSUE_FAILED,
        message: "Lỗi server",
      });
    }
  },
  async revokeCertificate(req, res) {
    try {
      const certificate = await studentCertificateService.revokeCertificate(
        req.params.id,
        req.user
      );

      return res.json({
        success: true,
        code: STUDENT_CODES.CERTIFICATE_REVOKE_SUCCESS,
        data: { certificate },
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
        code: STUDENT_CODES.CERTIFICATE_REVOKE_FAILED,
      });
    }
  },
};
