import React from "react";
import {
  FiClock,
  FiUser,
  FiEdit3,
  FiCheckCircle,
  FiXCircle,
  FiMinusCircle,
} from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import CommonModal from "./CommonModal";

const AuditLogModal = ({ isOpen, onClose, logs }) => {
  const formatDate = (date) =>
    !date ? "" : new Date(date).toLocaleString("vi-VN");

  const renderValue = (value) => {
    if (value === null || value === undefined)
      return (
        <span className="flex items-center gap-1 text-primary opacity-40 italic">
          <FiMinusCircle size={14} /> Không có
        </span>
      );

    if (typeof value === "boolean") {
      return value ? (
        <span className="flex items-center gap-1 text-green-500 font-medium">
          <FiCheckCircle size={14} /> True
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-500 font-medium">
          <FiXCircle size={14} /> False
        </span>
      );
    }

    if (typeof value === "object") {
      return (
        <div className="p-2 rounded border border-border bg-muted text-xs space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="font-medium text-primary opacity-60">
                {key}:
              </span>
              <span className="text-primary break-all">{String(val)}</span>
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-primary">{String(value)}</span>;
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <HiOutlineSparkles className="text-primary opacity-70" />
          Lịch sử thay đổi
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-y-auto px-2 py-4">
        {!logs?.length ? (
          <div className="text-center text-primary opacity-40 italic py-10">
            Không có thay đổi nào được ghi nhận.
          </div>
        ) : (
          <div className="relative border-l-2 border-border ml-3 space-y-6">
            {logs.map((log, index) => (
              <div key={log.id || index} className="relative pl-6">
                {/* dot */}
                <span className="absolute -left-[11px] top-2 w-4 h-4 bg-primary rounded-full border-4 border-gray-400" />

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                  {/* header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <FiEdit3 size={16} />
                      {log.field || "Unknown field"}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-primary opacity-40">
                      <FiClock size={12} />
                      {formatDate(log.updatedAt)}
                    </div>
                  </div>

                  {/* user */}
                  <div className="flex items-center gap-2 text-sm text-primary opacity-60 mb-3">
                    <FiUser size={14} />
                    <span>
                      <strong>{log.updatedBy || "Hệ thống"}</strong> đã chỉnh
                      sửa
                    </span>
                  </div>

                  {/* before / after */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted border border-border rounded-lg p-3">
                      <p className="text-xs font-semibold text-primary opacity-50 mb-2">
                        Trước
                      </p>
                      {renderValue(log.oldValue)}
                    </div>

                    <div className="bg-muted border border-border rounded-lg p-3">
                      <p className="text-xs font-semibold text-primary mb-2">
                        Sau
                      </p>
                      {renderValue(log.newValue)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CommonModal>
  );
};

export default AuditLogModal;
