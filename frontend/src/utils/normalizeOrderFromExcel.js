export const normalizeOrderFromExcel = (row) => {
  if (!row) return null;

  // chuẩn hóa key lowercase
  const r = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
  );

  const userName = r.username?.toString().trim();

  if (!userName) return null;

  let items = [];

  try {
    items = r.items ? JSON.parse(r.items) : [];
  } catch {
    items = [];
  }

  if (!Array.isArray(items) || items.length === 0) return null;

  const formattedItems = items.map((i) => ({
    itemType: i.itemType || "course",
    productTitle: i.productTitle?.toString().trim(),
    price: Number(i.price || 0),
  }));

  return {
    userName,

    items: formattedItems,

    subtotal: Number(r.subtotal || 0),

    discountApplied:
      r.discountapplied === true ||
      String(r.discountapplied).toLowerCase() === "true",

    couponCode: r.couponcode?.toString().trim() || null,

    discountValue: Number(r.discountvalue || 0),

    totalAmount: Number(r.totalamount || 0),

    finalAmount: Number(r.finalamount || 0),
  };
};
