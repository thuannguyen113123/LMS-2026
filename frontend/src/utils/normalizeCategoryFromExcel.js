export const normalizeCategoryFromExcel = (row) => {
  if (!row) return null;

  const name = row.Name?.trim();
  if (!name) return null;

  return {
    name,
    description: row.Description?.trim() || "",
    status: row.Status?.toLowerCase() === "inactive" ? "inactive" : "active",
  };
};
