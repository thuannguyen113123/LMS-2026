export const normalizeUserFromExcel = (row) => {
  const fullname = String(row["fullname"] || row["Full Name"] || "").trim();
  const email = row["email"]
    ? String(row["email"]).trim().toLowerCase()
    : undefined;
  const phone = row["phone"] ? String(row["phone"]).trim() : undefined;

  const role = String(
    row["role"] || row["roleName"] || row["Role"] || ""
  ).trim();

  if (!fullname || (!email && !phone) || !role) return null;

  return {
    fullname,
    email,
    phone,
    role, // 🔑 đồng bộ với backend schema
    isActive:
      String(row["isActive"] || "")
        .toLowerCase()
        .trim() === "true",
  };
};
