import React from "react";
import CommonModal from "./CommonModal";

const ExportPreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  columns = [],
  data = [],
  total = 0,
  loading = false,
}) => {
  const getValue = (row, col) => {
    const field = col.key || col.path;
    if (!field) return "-";

    const value = field.split(".").reduce((acc, k) => acc?.[k], row);

    if (col.type === "boolean") return value ? "Yes" : "No";

    if (Array.isArray(value)) return value.join(", ");

    if (typeof value === "object" && value !== null) {
      if (value.name) return value.name;
      if (value.title) return value.title;
      return JSON.stringify(value);
    }

    return value ?? "-";
  };

  return (
    <CommonModal
      isOpen={isOpen}
      onClose={onClose}
      title="Xem trước dữ liệu sẽ xuất"
      maxWidth="max-w-[90vw]"
      maxHeight="max-h-[90vh]"
    >
      {/* SUMMARY */}
      {!loading && (
        <p className="text-sm text-primary opacity-60 mb-3">
          Hiển thị {data.length} / {total} dòng sẽ được xuất
        </p>
      )}

      {/* LOADING */}
      {loading && (
        <div className="py-12 text-center text-primary opacity-50">
          Đang tải dữ liệu xem trước...
        </div>
      )}

      {/* EMPTY */}
      {!loading && data.length === 0 && (
        <div className="py-12 text-center text-primary opacity-50">
          Không có dữ liệu để xuất
        </div>
      )}

      {/* TABLE */}
      {!loading && data.length > 0 && (
        <div className="overflow-auto mb-6 border border-border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-muted z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.path}
                    className="px-4 py-2 border-b border-border text-left font-semibold text-primary"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="table-tr">
                  {columns.map((col) => (
                    <td
                      key={col.path}
                      className="px-4 py-2 border-b border-border text-primary"
                    >
                      {getValue(row, col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-md border border-border bg-muted text-primary hover:opacity-80 transition disabled:opacity-40"
        >
          Hủy
        </button>

        <button
          onClick={onConfirm}
          disabled={loading || data.length === 0}
          className="px-4 py-2 rounded-md bg-primary  hover:opacity-90 transition disabled:opacity-40"
        >
          Xuất
        </button>
      </div>
    </CommonModal>
  );
};

export default ExportPreviewModal;
