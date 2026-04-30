import { AUDIT_CODES } from "../../constants/auditLog.codes.js";
import {
  getAuditLogsByEntity,
  getAllAuditLogsByEntityType,
} from "../../services/auditLog/auditLog.service.js";
import AppError from "../../utils/AppError.js";

const mapDoc = (doc) => {
  if (doc.toObject) doc = doc.toObject();
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

export const auditLogController = {
  async getLogs(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const logs = await getAuditLogsByEntity(entityType, entityId);
      return res.status(200).json({
        success: true,
        code: AUDIT_CODES.AUDIT_LOGS_FETCHED,
        message: "Lấy audit logs thành công",
        data: {
          logs,
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
        code: AUDIT_CODES.AUDIT_FETCH_FAILED,
        message: "Lỗi server",
      });
    }
  },
  //Lấy log theo loại
  async getAllLogsByEntityType(req, res) {
    try {
      const { entityType } = req.params;

      const logs = await getAllAuditLogsByEntityType(entityType);
      const cleanLogs = logs.map(mapDoc);
      res.json(cleanLogs);
    } catch (err) {
      console.error("Lỗi lấy toàn bộ audit logs:", err);
      res.status(500).json({ error: "Lỗi server khi lấy toàn bộ audit logs" });
    }
  },
};
