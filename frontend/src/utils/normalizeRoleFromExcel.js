export const normalizeRoleFromExcel = (row) => ({
  name: String(row["name"] || row["Role Name"] || "").trim(),
  description: String(row["description"] || row["Description"] || "").trim(),
  isSystemRole:
    String(row["isSystemRole"] || row["IsSystemRole"] || "")
      .toLowerCase()
      .trim() === "true",
});
