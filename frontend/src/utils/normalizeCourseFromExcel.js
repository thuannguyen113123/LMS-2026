export const normalizeCourseFromExcel = (row) => {
  if (!row) return null;

  // chuẩn hóa key lowercase
  const r = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v])
  );

  const title = r.title?.toString().trim();
  if (!title) return null;

  return {
    title,

    description: r.description?.toString().trim() || "",

    price: Number(r.price || 0),
    discountPrice: Number(r.discountprice || 0),

    duration: Number(r.duration || 0),
    rating: Number(r.rating || 0),

    isFree: r.isfree === true || String(r.isfree).toLowerCase() === "true",

    status: r.status?.toLowerCase() === "published" ? "published" : "draft",

    coverImage: r.coverimage?.toString().trim() || "",
    videoURL: r.videourl?.toString().trim() || "",

    categoryName: r.categoryname?.toString().trim(),
    instructorName: r.instructorname?.toString().trim() || null,
    whatYouWillLearn: r.whatyouwilllearn
      ? r.whatyouwilllearn.split("|").map((s) => s.trim())
      : [],
    audience: r.audience ? r.audience.split("|").map((s) => s.trim()) : [],
    requirements: r.requirements
      ? r.requirements.split("|").map((s) => s.trim())
      : [],
  };
};
