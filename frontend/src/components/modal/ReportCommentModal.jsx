import React, { useState } from "react";
import CommonModal from "./CommonModal";

const REASONS = [
  "Ngôn từ không phù hợp / xúc phạm",
  "Spam hoặc quảng cáo",
  "Tin giả / sai sự thật",
  "Nội dung gây hiểu lầm",
  "Khác (ghi rõ bên dưới)",
];

const ReportCommentModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const reason =
      selectedReason === "Khác (ghi rõ bên dưới)"
        ? customReason.trim()
        : selectedReason;

    if (!reason) {
      alert("Vui lòng chọn hoặc nhập lý do!");
      return;
    }

    onConfirm(reason);
    setSelectedReason("");
    setCustomReason("");
    onClose();
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="🚩 Báo cáo bình luận"
      maxWidth="max-w-md"
    >
      <div className="space-y-3 mb-5">
        {REASONS.map((r) => (
          <label
            key={r}
            className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition ${
              selectedReason === r
                ? "border-red-500 bg-red-50"
                : "border-gray-200 hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="reason"
              checked={selectedReason === r}
              onChange={() => setSelectedReason(r)}
              className="text-red-500 focus:ring-red-400"
            />
            <span className="text-sm text-gray-700">{r}</span>
          </label>
        ))}
      </div>

      {selectedReason === "Khác (ghi rõ bên dưới)" && (
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-400 focus:outline-none mb-4"
          placeholder="Nhập lý do chi tiết..."
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          rows={3}
        />
      )}

      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition"
        >
          Hủy
        </button>
        <button
          onClick={handleConfirm}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
        >
          Gửi báo cáo
        </button>
      </div>
    </CommonModal>
  );
};

export default ReportCommentModal;
