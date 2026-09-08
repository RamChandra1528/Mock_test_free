export const formatTime = (seconds?: number | null) => {
  const value = Math.max(0, seconds ?? 0);
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  return h
    ? [h, m, s].map((x) => String(x).padStart(2, "0")).join(":")
    : [m, s].map((x) => String(x).padStart(2, "0")).join(":");
};
export const dateLabel = (value?: string | null, locale = "en-IN") =>
  value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
export const scoreTone = (value: number) =>
  value >= 75
    ? "text-emerald-700 bg-emerald-50"
    : value >= 50
      ? "text-amber-700 bg-amber-50"
      : "text-rose-700 bg-rose-50";
