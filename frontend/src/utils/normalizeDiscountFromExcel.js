// utils/normalizeDiscountFromExcel.js

export const normalizeDiscountFromExcel = (row) => {
  if (!row) return null;

  const r = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
  );

  const code = r.code?.toString().trim().toUpperCase();
  if (!code) return null;

  const type =
    r.type?.toString().toLowerCase() === "fixed" ? "fixed" : "percentage";

  const value = Number(r.value || 0);
  if (!value) return null;

  return {
    code,
    type,
    value,

    minOrderValue: Number(r.minordervalue || 0),
    maxDiscountAmount: Number(r.maxdiscountamount || 0),

    applicableTo: r.applicableto || "all",

    startDate: r.startdate ? new Date(r.startdate) : undefined,
    endDate: r.enddate ? new Date(r.enddate) : null,

    usageLimit: Number(r.usagelimit || 0),

    isActive:
      r.isactive === true || String(r.isactive).toLowerCase() === "true",
  };
};
