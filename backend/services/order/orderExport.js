import { exportExcel } from "../export/excel.service.js";
import { exportPDF } from "../export/pdf.service.js";

export const ORDER_EXPORT_COLUMNS = [
  { header: "Order ID", key: "orderId" },

  { header: "User", key: "user" },

  { header: "Items", key: "items" },

  { header: "Subtotal", key: "subtotal" },

  { header: "Discount", key: "discountValue" },

  { header: "Final Amount", key: "finalAmount" },

  { header: "Coupon", key: "couponCode" },

  { header: "Status", key: "status" },

  { header: "Created At", key: "createdAt" },
];
export function mapOrderExportData(orders = []) {
  return orders.map((order) => ({
    orderId: order.id,

    user: order.user?.fullname || order.user?.email || "",

    items: order.items.map((i) => `${i.title} (${i.price})`).join(", "),

    subtotal: order.subtotal,

    discountValue: order.discountValue || 0,

    finalAmount: order.finalAmount,

    couponCode: order.couponCode || "",

    status: order.status,

    createdAt: new Date(order.createdAt).toLocaleString(),
  }));
}

export async function exportOrdersFile({ orders, format }) {
  const data = mapOrderExportData(orders);

  if (format === "excel") {
    return exportExcel({
      sheetName: "Orders",

      columns: ORDER_EXPORT_COLUMNS,

      data,
    });
  }

  return exportPDF({
    title: "Danh sách đơn hàng",

    columns: ORDER_EXPORT_COLUMNS,

    data,
  });
}
