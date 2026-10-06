import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Expiry dates are calendar days ("best before 12 Oct"), not moments. They are
// stored as midnight UTC of that day, and "today" is worked out in the app's
// time zone, so a listing expiring today stays visible until the day is over
// for the people using it.
const TIMEZONE = process.env.APP_TIMEZONE?.trim() || "Africa/Lagos";

// "2026-10-05" for today in APP_TIMEZONE (en-CA formats dates as YYYY-MM-DD).
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

// Midnight UTC of a YYYY-MM-DD day.
export const dayToDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

// Midnight UTC of today (in APP_TIMEZONE), for "not expired yet" queries.
export const startOfToday = (): Date => dayToDate(todayIso());

// Midnight UTC `days` days from today.
export function daysFromToday(days: number): Date {
  const date = startOfToday();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

// "Sat 12 Oct", for emails.
export const formatDay = (date: Date): string =>
  date.toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
