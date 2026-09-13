export type LeaderboardPeriod = "daily" | "weekly" | "monthly";

const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A DATE-safe UTC value representing the current calendar day in India. */
export function indiaCalendarDate(now = new Date()) {
  const india = new Date(now.getTime() + INDIA_OFFSET_MS);
  return new Date(
    Date.UTC(
      india.getUTCFullYear(),
      india.getUTCMonth(),
      india.getUTCDate(),
    ),
  );
}

export function previousCalendarDate(date: Date) {
  return new Date(date.getTime() - DAY_MS);
}

export function leaderboardDateRange(
  period: LeaderboardPeriod,
  now = new Date(),
) {
  const today = indiaCalendarDate(now);
  let start = new Date(today);

  if (period === "weekly") {
    const daysSinceMonday = (today.getUTCDay() + 6) % 7;
    start = new Date(today.getTime() - daysSinceMonday * DAY_MS);
  } else if (period === "monthly") {
    start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  }

  return {
    start,
    end: new Date(today.getTime() + DAY_MS),
  };
}
