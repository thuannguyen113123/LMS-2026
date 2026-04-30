import ExcelJS from "exceljs";

export async function exportExcel({ columns, data, sheetName = "Sheet1" }) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width || 25,
  }));

  data.forEach((row) => sheet.addRow(row));

  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  return workbook.xlsx.writeBuffer();
}
