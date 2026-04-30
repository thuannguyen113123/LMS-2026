import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// Export PDF chung
export const exportPDF = (
  data,
  selectedIds = [],
  columns = [],
  fileName = "export.pdf"
) => {
  const dataToExport =
    selectedIds.length === 0
      ? data
      : data.filter((item) => selectedIds.includes(item.id));

  if (dataToExport.length === 0) {
    alert("Không có dữ liệu để xuất.");
    return;
  }

  const doc = new jsPDF();
  const tableColumn = columns.map((col) => col.header);
  const tableRows = [];

  dataToExport.forEach((item) => {
    const row = columns.map((col) => item[col.key] ?? "");
    tableRows.push(row);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });
  doc.text(fileName.replace(".pdf", ""), 14, 15);
  doc.save(fileName);
};

// Export Excel chung
export const exportExcel = (
  data,
  selectedIds = [],
  fileName = "export.xlsx"
) => {
  const dataToExport =
    selectedIds.length === 0
      ? data
      : data.filter((item) => selectedIds.includes(item.id));

  if (dataToExport.length === 0) {
    alert("Không có dữ liệu để xuất.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, fileName);
};

// Import Excel chung
export const handleImportExcel = (e, onImportCallback) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    if (jsonData.length === 0) {
      alert("File Excel không có dữ liệu.");
      return;
    }

    // Clean keys to trim spaces
    const cleanData = jsonData.map((row) => {
      const newRow = {};
      for (const key in row) {
        newRow[key.trim()] = row[key];
      }
      return newRow;
    });

    if (
      window.confirm(
        `Bạn có chắc muốn import ${cleanData.length} mục từ Excel không?`
      )
    ) {
      onImportCallback(cleanData);
    }
  };

  reader.readAsArrayBuffer(file);
};
