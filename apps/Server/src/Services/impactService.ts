import { Types } from "mongoose";
import type { CommunityStats, Impact } from "../types/shared";
import { PantryItem } from "../Models/PantryItem";
import { Donation } from "../Models/Donation";
import { DonationRequest } from "../Models/DonationRequest";
import { User } from "../Models/User";
import { daysFromToday, startOfToday } from "../Utils/dates";
import { CO2E_PER_KG, EXPIRING_SOON_DAYS, KG_PER_MEAL, round1 } from "../Utils/impact";

// Impact is worked out from what actually happened (pantry outcomes and
// collected listings) every time it's asked for. The first version kept
// running counters that drifted: editing or deleting an entry could push them
// out of step, or below zero.

const WEEKS_SHOWN = 8;
const TOP_AREAS = 5;

interface OutcomeRow {
  _id: string;
  count: number;
  kg: number;
}

async function pantryOutcomes(match: Record<string, unknown>) {
  const rows = await PantryItem.aggregate<OutcomeRow>([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 }, kg: { $sum: { $ifNull: ["$weightKg", 0] } } } },
  ]);
  const by = (status: string) => rows.find((row) => row._id === status) ?? { count: 0, kg: 0 };
  return { total: rows.reduce((sum, row) => sum + row.count, 0), used: by("used"), donated: by("donated"), wasted: by("wasted") };
}

// A listing made from a pantry item is already counted (by weight) through
// the pantry, so only listings without one add their weight here.
const listingKg = { $cond: [{ $eq: [{ $ifNull: ["$pantryItem", null] }, null] }, { $ifNull: ["$weightKg", 0] }, 0] };

async function collectedListings(match: Record<string, unknown>) {
  const [row] = await Donation.aggregate<{ count: number; kg: number }>([
    { $match: { ...match, status: "collected" } },
    { $group: { _id: null, count: { $sum: 1 }, kg: { $sum: listingKg } } },
  ]);
  return row ?? { count: 0, kg: 0 };
}

const meals = (kg: number) => Math.round(kg / KG_PER_MEAL);

export async function forUser(userId: string): Promise<Impact> {
  const user = new Types.ObjectId(userId);
  const [pantry, shared, received, thanks, expiringSoon] = await Promise.all([
    pantryOutcomes({ user }),
    collectedListings({ user }),
    DonationRequest.countDocuments({ requester: user, status: "collected" }),
    DonationRequest.countDocuments({ donor: user, thankYouNote: { $ne: null } }),
    PantryItem.countDocuments({ user, status: "active", expiryDate: { $lte: daysFromToday(EXPIRING_SOON_DAYS) } }),
  ]);

  const kgSaved = pantry.used.kg + pantry.donated.kg + shared.kg;
  return {
    itemsTracked: pantry.total,
    itemsSaved: pantry.used.count + pantry.donated.count,
    itemsWasted: pantry.wasted.count,
    kgSaved: round1(kgSaved),
    kgWasted: round1(pantry.wasted.kg),
    donationsShared: shared.count,
    donationsReceived: received,
    thanksReceived: thanks,
    meals: meals(kgSaved),
    co2eKg: round1(kgSaved * CO2E_PER_KG),
    expiringSoon,
  };
}

// Monday of the week containing `date` (UTC), as a Date.
function weekStart(date: Date): Date {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - day);
  return start;
}

// kg saved per week for the last WEEKS_SHOWN weeks: pantry items used or
// given away, plus listings collected, by the week it happened.
async function weekly(): Promise<CommunityStats["weekly"]> {
  const first = weekStart(new Date());
  first.setUTCDate(first.getUTCDate() - 7 * (WEEKS_SHOWN - 1));
  const weekExpr = (field: string) => ({ $dateTrunc: { date: field, unit: "week", startOfWeek: "monday" } });

  const [pantry, listings] = await Promise.all([
    PantryItem.aggregate<{ _id: Date; kg: number }>([
      { $match: { status: { $in: ["used", "donated"] }, resolvedAt: { $gte: first } } },
      { $group: { _id: weekExpr("$resolvedAt"), kg: { $sum: { $ifNull: ["$weightKg", 0] } } } },
    ]),
    Donation.aggregate<{ _id: Date; kg: number; shared: number }>([
      { $match: { status: "collected", collectedAt: { $gte: first } } },
      { $group: { _id: weekExpr("$collectedAt"), kg: { $sum: listingKg }, shared: { $sum: 1 } } },
    ]),
  ]);

  return Array.from({ length: WEEKS_SHOWN }, (_, index) => {
    const start = new Date(first);
    start.setUTCDate(start.getUTCDate() + 7 * index);
    const key = start.toISOString().slice(0, 10);
    const match = (row: { _id: Date }) => new Date(row._id).toISOString().slice(0, 10) === key;
    const fromPantry = pantry.find(match)?.kg ?? 0;
    const fromListings = listings.find(match);
    return { weekStart: key, kg: round1(fromPantry + (fromListings?.kg ?? 0)), shared: fromListings?.shared ?? 0 };
  });
}

// "Yaba, Lagos" and "yaba" count as the same area: the part before the first
// comma, case-insensitive.
async function topAreas(): Promise<CommunityStats["topAreas"]> {
  const rows = await Donation.aggregate<{ _id: string; shared: number; kg: number }>([
    { $match: { status: "collected" } },
    {
      $group: {
        _id: { $toLower: { $trim: { input: { $arrayElemAt: [{ $split: ["$location", ","] }, 0] } } } },
        shared: { $sum: 1 },
        kg: { $sum: { $ifNull: ["$weightKg", 0] } },
      },
    },
    { $sort: { shared: -1, kg: -1 } },
    { $limit: TOP_AREAS },
  ]);
  const titleCase = (text: string) => text.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
  return rows.filter((row) => row._id).map((row) => ({ area: titleCase(row._id), shared: row.shared, kg: round1(row.kg) }));
}

// The home and impact pages ask for this on every visit, and it scans whole
// collections, so it's kept for a minute.
const CACHE_MS = 60_000;
let cached: { at: number; stats: CommunityStats } | null = null;

export async function community(): Promise<CommunityStats> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.stats;

  const live = { status: "available" as const, expiryDate: { $gte: startOfToday() } };
  const [members, partners, activeListings, rescueToday, pantry, shared, weeks, areas] = await Promise.all([
    User.estimatedDocumentCount(),
    User.countDocuments({ accountType: { $in: ["business", "organisation"] } }),
    Donation.countDocuments(live),
    Donation.countDocuments({ status: "available", expiryDate: { $gte: startOfToday(), $lt: daysFromToday(1) } }),
    pantryOutcomes({}),
    collectedListings({}),
    weekly(),
    topAreas(),
  ]);
  const kgSaved = pantry.used.kg + pantry.donated.kg + shared.kg;
  const stats: CommunityStats = {
    members,
    partners,
    activeListings,
    rescueToday,
    donationsShared: shared.count,
    kgSaved: round1(kgSaved),
    meals: meals(kgSaved),
    co2eKg: round1(kgSaved * CO2E_PER_KG),
    weekly: weeks,
    topAreas: areas,
  };
  cached = { at: Date.now(), stats };
  return stats;
}
