import React from "react";

const UndoSnackbar = ({ count, onUndo }) => {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-4 right-4  border border-gray-300 p-4 rounded shadow flex items-center gap-4">
      <span className="text-gray-700">Đã xóa {count} mục.</span>
      <button
        className="text-blue-600 font-semibold hover:underline"
        onClick={onUndo}
      >
        Hoàn tác
      </button>
    </div>
  );
};

export default UndoSnackbar;
