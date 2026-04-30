import React from "react";
import { HiOutlineDocumentDownload } from "react-icons/hi";

const ImportExportButtons = ({ onImport, onExportPDF, onExportExcel }) => (
  <div className="flex gap-2">
    <input
      type="file"
      accept=".xlsx, .xls"
      onChange={onImport}
      className="hidden"
      id="import-excel"
    />
    <label
      htmlFor="import-excel"
      className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm text-primary cursor-pointer"
    >
      <HiOutlineDocumentDownload />
      Import Excel
    </label>
    <button
      className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm text-primary"
      onClick={onExportPDF}
    >
      <HiOutlineDocumentDownload /> Export PDF
    </button>
    <button
      className="flex items-center gap-1 border px-3 py-2 rounded-lg text-sm text-primary"
      onClick={onExportExcel}
    >
      <HiOutlineDocumentDownload /> Export Excel
    </button>
  </div>
);

export default ImportExportButtons;
