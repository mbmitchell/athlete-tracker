const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toUtcDate(dateLike: string | Date): Date {
  if (dateLike instanceof Date) {
    return new Date(Date.UTC(dateLike.getUTCFullYear(), dateLike.getUTCMonth(), dateLike.getUTCDate()));
  }

  return new Date(`${dateLike}T00:00:00Z`);
}

export function addDays(dateLike: string | Date, days: number): Date {
  const date = toUtcDate(dateLike);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export function formatIsoDate(dateLike: string | Date): string {
  return toUtcDate(dateLike).toISOString().slice(0, 10);
}

export function getWeekStartIso(dateLike: string | Date): string {
  const date = toUtcDate(dateLike);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return formatIsoDate(addDays(date, diff));
}

export function buildWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => formatIsoDate(addDays(weekStart, index)));
}

export function getShortWeekday(dateLike: string): string {
  return WEEKDAY_SHORT[toUtcDate(dateLike).getUTCDay()];
}

export function getLongWeekday(dateLike: string): string {
  return WEEKDAY_LONG[toUtcDate(dateLike).getUTCDay()];
}

export function formatLongDate(dateLike: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(toUtcDate(dateLike));
}

export function formatShortDate(dateLike: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(toUtcDate(dateLike));
}
