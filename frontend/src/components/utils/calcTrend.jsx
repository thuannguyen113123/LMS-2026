export const calcTrend = (data = [], key) => {
  if (!Array.isArray(data) || data.length < 2) return 0;

  const last = data[data.length - 1]?.[key] ?? 0;
  const prev = data[data.length - 2]?.[key] ?? 0;

  if (prev === 0) return 0;

  return Math.round(((last - prev) / prev) * 100);
};
