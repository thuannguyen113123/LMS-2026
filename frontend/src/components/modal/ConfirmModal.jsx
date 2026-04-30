import React from "react";
import CommonModal from "./CommonModal";
import LMSLogo from "../logo/LMSLogo";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận hành động"
      ariaLabel="Confirmation dialog"
    >
      <div className="flex flex-col items-center gap-4">
        <LMSLogo size={80} />
        <p className="text-center text-gray-700">{message}</p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            type="button"
          >
            {isLoading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </CommonModal>
  );
};

export default ConfirmModal;
