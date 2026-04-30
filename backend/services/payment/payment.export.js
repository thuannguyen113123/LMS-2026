import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const PAYMENT_EXPORT_COLUMNS = [
  { header: "Mã thanh toán", key: "paymentNumber" },
  { header: "Người dùng", key: "user" },

  { header: "Đơn hàng", key: "orderNumber" },
  { header: "Cổng thanh toán", key: "gateway" },
  { header: "Trạng thái", key: "status" },
  { header: "Số tiền", key: "amount" },
  { header: "Tiền tệ", key: "currency" },
  { header: "Ngày tạo", key: "createdAt" },
];

export function mapPaymentExportData(payments = []) {
  return payments.map((p) => {
    const tx = p.transactions?.[0]; // ✅ lấy transaction đầu tiên

    return {
      paymentNumber: p.paymentNumber,
      user: p.userId?.fullname || "",
      orderNumber: p.orderId?._id || "",

      gateway: tx?.gateway || "",
      status: p.status,
      amount: tx?.amount || 0,
      currency: tx?.currency || "",

      createdAt: new Date(p.createdAt).toLocaleString(),
    };
  });
}
export async function exportPaymentsFile({ payments, format }) {
  const data = mapPaymentExportData(payments);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Payments",
      columns: PAYMENT_EXPORT_COLUMNS,
      data,
    });
  }

  return exportPDF({
    title: "Danh sách thanh toán",
    columns: PAYMENT_EXPORT_COLUMNS,
    data,
  });
}
