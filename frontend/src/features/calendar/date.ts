export const dateKey = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

export const fromDateKey = (value: string) => new Date(`${value}T12:00:00Z`);

export const addDays = (date: Date, amount: number) =>
  new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + amount,
      12,
    ),
  );

export const addMonths = (date: Date, amount: number) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1, 12));

export const startOfMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));

export const monthGrid = (date: Date) => {
  const first = startOfMonth(date);
  const start = addDays(first, -first.getUTCDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
};

export const weekDays = (date: Date) => {
  const start = addDays(date, -date.getUTCDay());
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
};

export const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    ...options,
  }).format(typeof date === "string" ? new Date(date) : date);

export const eventOccursOn = (
  event: { startAt: string; endAt?: string | null },
  day: string,
) => {
  const start = dateKey(event.startAt);
  const end = event.endAt ? dateKey(event.endAt) : start;
  return day >= start && day <= end;
};
