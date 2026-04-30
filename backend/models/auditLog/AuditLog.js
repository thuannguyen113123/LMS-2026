import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  field: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: "unknown" },
});

export default mongoose.model("AuditLog", auditLogSchema);
