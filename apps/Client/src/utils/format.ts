import type { DonationStatus, FoodCategory, PantryStatus, RequestStatus } from "../types";

// Joins class names, skipping false/null/undefined.
export const cx = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(" ");

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  produce: "Fruit & veg",
  bakery: "Bread & bakery",
  cooked: "Cooked meals",
  dairy: "Dairy & eggs",
  pantry: "Dry & tinned",
  drinks: "Drinks",
  other: "Other",
};

export const CATEGORY_EMOJI: Record<FoodCategory, string> = {
  produce: "🥬",
  bakery: "🍞",
  cooked: "🍲",
  dairy: "🥛",
  pantry: "🥫",
  drinks: "🧃",
  other: "🍽️",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as FoodCategory[];

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  available: "Available",
  reserved: "Reserved",
  collected: "Collected",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Waiting for reply",
  accepted: "Accepted",
  declined: "Not this time",
  cancelled: "Cancelled",
  collected: "Collected",
};

export const PANTRY_STATUS_LABELS: Record<PantryStatus, string> = {
  active: "In pantry",
  used: "Used",
  donated: "Given away",
  wasted: "Wasted",
};

// "2.5 kg", "800 g".
export function formatKg(kg: number): string {
  if (kg > 0 && kg < 1) return `${Math.round(kg * 1000)} g`;
  return `${Number.isInteger(kg) ? kg : kg.toFixed(1)} kg`;
}

export const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

// "5 min ago", "2 hr ago", "3 days ago", then the date.
export function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return plural(days, "day") + " ago";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// Initials for the avatar circle: "Ada Obi" -> "AO".
export const initials = (name: string | null | undefined) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
