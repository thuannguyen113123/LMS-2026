export const normalizeStudentFromExcel = (row) => {
  if (!row?.userEmail) return null;

  return {
    userEmail: row.userEmail.trim(),
    language: row.language || "vi",
    notifications: row.notifications === "true" || row.notifications === true,
    darkMode: row.darkMode === "true" || row.darkMode === true,
  };
};
