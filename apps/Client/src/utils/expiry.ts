import { EXPIRING_SOON_DAYS } from "../types/shared";

// Expiry dates are calendar days. The API sends them as midnight UTC
// ("2026-10-12T00:00:00.000Z"), so only the date part is read, and compared
// with today's date where the user is.

export const dayPart = (iso: string) => iso.slice(0, 10);

// Today as YYYY-MM-DD in the browser's time zone (for <input type="date" min>).
export function todayInput(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// YYYY-MM-DD `days` from today.
export function inputDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Whole days from today to the expiry day: 0 = today, -1 = yesterday.
export function daysUntil(iso: string): number {
  const [year, month, day] = dayPart(iso).split("-").map(Number);
  const expiry = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expiry.getTime() - today.getTime()) / 86_400_000);
}

export type ExpiryTone = "expired" | "today" | "soon" | "fine";

export function expiryTone(iso: string): ExpiryTone {
  const days = daysUntil(iso);
  if (days < 0) return "expired";
  if (days === 0) return "today";
  if (days <= EXPIRING_SOON_DAYS) return "soon";
  return "fine";
}

// "Expired 2 days ago", "Use today", "Use by tomorrow", "Use within 5 days".
export function expiryLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < -1) return `Expired ${-days} days ago`;
  if (days === -1) return "Expired yesterday";
  if (days === 0) return "Use today";
  if (days === 1) return "Use by tomorrow";
  if (days <= 14) return `Use within ${days} days`;
  return `Best before ${formatDay(iso)}`;
}

// "Sat 12 Oct".
export function formatDay(iso: string): string {
  const [year, month, day] = dayPart(iso).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
