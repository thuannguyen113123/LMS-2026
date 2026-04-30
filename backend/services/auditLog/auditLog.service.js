import { AUDIT_CODES } from "../../constants/auditLog.codes.js";
import AuditLog from "../../models/auditLog/AuditLog.js";
import mongoose from "mongoose";

export const mapAuditLog = (doc) => {
  if (!doc) return null;
  if (doc.toObject) doc = doc.toObject();
  return {
    id: doc._id?.toString(),
    entityType: doc.entityType,
    entityId: doc.entityId?.toString(),
    field: doc.field,
    oldValue: doc.oldValue ?? null,
    newValue: doc.newValue ?? null,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy ?? "unknown",
  };
};

export const saveAuditLogs = async ({
  entityType,
  entityId,
  oldData = {},
  newData = {},
  updatedBy = "unknown",
}) => {
  const logsToInsert = [];

  for (const key in newData) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    if (oldValue !== newValue) {
      logsToInsert.push({
        entityType,
        entityId: new mongoose.Types.ObjectId(entityId),
        field: key,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
        updatedBy,
      });
    }
  }

  if (logsToInsert.length > 0) {
    await AuditLog.insertMany(logsToInsert);
  }
};

export const getAuditLogsByEntity = async (entityType, entityId) => {
  if (!entityType || !entityId) {
    throw new AppError(
      AUDIT_CODES.AUDIT_INVALID_PARAMS,
      "Thiếu entityType hoặc entityId",
      400
    );
  }

  const logs = await AuditLog.find({
    entityType,
    entityId: new mongoose.Types.ObjectId(entityId),
  })
    .sort({ updatedAt: -1 })
    .lean();

  return logs.map(mapAuditLog);
};

export const getAllAuditLogsByEntityType = async (entityType) => {
  return await AuditLog.find({ entityType }).sort({ updatedAt: -1 }).lean();
};
