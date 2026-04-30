export const normalizePermissionFromExcel = (row) => {
  const name = (row.Name || row.name || "").trim();
  const code = (row.Code || row.code || "").trim();

  if (!name || !code) return null;

  return {
    name,
    code,
    description: (row.Description || row.description || "").trim(),

    moduleName: (
      row.ModuleName ||
      row.moduleName ||
      row.Module ||
      row.module ||
      ""
    ).trim(),

    category: (row.Category || row.category || "read").trim(),

    isSystemPermission:
      row.IsSystemPermission === true ||
      row.IsSystemPermission === "true" ||
      row.IsSystemPermission === "1",
  };
};
