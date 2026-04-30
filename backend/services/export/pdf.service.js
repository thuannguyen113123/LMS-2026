import PDFDocument from "pdfkit";

export async function exportPDF({ title, columns, data }) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text(title, { align: "center" });
    doc.moveDown();

    data.forEach((row, index) => {
      const line = columns
        .map((c) => `${c.header}: ${row[c.key] ?? "-"}`)
        .join(" | ");

      doc.fontSize(10).text(`${index + 1}. ${line}`);
    });

    doc.end();
  });
}
