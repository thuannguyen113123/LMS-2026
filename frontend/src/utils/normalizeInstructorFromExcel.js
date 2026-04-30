export const normalizeInstructorFromExcel = (row) => {
  if (!row) return null;

  return {
    userEmail: row.userEmail || row.email || "",

    bio: row.bio || "",
    specialization: row.specialization || "",
    phone:
      row.phone !== undefined && row.phone !== null ? String(row.phone) : "",
    avatar: row.avatar || "",

    expertise: row.expertise
      ? String(row.expertise)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],

    github: row.github || "",
    linkedin: row.linkedin || "",
    youtube: row.youtube || "",
    website: row.website || "",
  };
};
