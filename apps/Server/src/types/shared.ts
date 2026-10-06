// GENERATED from packages/shared/src/index.ts by scripts/sync-shared.mjs.
// Don't edit this copy: change the original and run `npm run sync:shared`.

// Types shared by apps/Client and apps/Server. The Server runs as CommonJS
// through ts-node and does not build this package, so it imports from here
// with `import type` only. The constants at the bottom are for the Client;
// the Server keeps its own copy in Utils/impact.ts. Lists of allowed values
// the Server validates against live in apps/Server/src/Validation.

export type FoodCategory = "produce" | "bakery" | "cooked" | "dairy" | "pantry" | "drinks" | "other";

/**
 * A listing's life:
 * available -> reserved (donor accepted a request) -> collected (handed over).
 * A reservation can fall through (declined or cancelled), which makes the
 * listing available again. Listings past their expiry date are hidden from
 * Browse but keep their status.
 */
export type DonationStatus = "available" | "reserved" | "collected";

export type RequestStatus = "pending" | "accepted" | "declined" | "cancelled" | "collected";

/** What happened to a pantry item. "active" means it is still in the kitchen. */
export type PantryStatus = "active" | "used" | "donated" | "wasted";

export type PantryOutcome = Exclude<PantryStatus, "active">;

/**
 * Who is sharing. Businesses (restaurants, shops, caterers) post surplus in
 * bulk; organisations (food banks, shelters, places of worship, schools)
 * mostly collect and redistribute. Both show a badge next to their name.
 */
export type AccountType = "individual" | "business" | "organisation";

export interface User {
  id: string;
  name: string;
  email: string;
  /** Shared with a requester only after the donor accepts them. */
  phone: string | null;
  /** The area the user usually shares from, pre-filled on new listings. */
  location: string | null;
  /** True when the account can sign in with a password (not Google only). */
  hasPassword: boolean;
  accountType: AccountType;
  /** The business or organisation name, for those account types. */
  orgName: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

/** The donor as other people see them: never their contact details. */
export interface PublicDonor {
  id: string;
  /** First name for individuals; the business or organisation name otherwise. */
  displayName: string;
  accountType: AccountType;
}

/** Contact details, revealed between a donor and their accepted requester. */
export interface Contact {
  name: string;
  email: string;
  phone: string | null;
}

/** What a listing card needs. */
export interface DonationSummary {
  id: string;
  title: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  location: string;
  image: string;
  expiryDate: string;
  status: DonationStatus;
  donor: PublicDonor;
  createdAt: string;
}

export interface DonationDetail extends DonationSummary {
  description: string;
  pickupNotes: string | null;
  /** The food's estimated weight; counts toward impact once collected. */
  weightKg: number | null;
  collectedAt: string | null;
  /** True when the signed-in viewer listed it. */
  isOwner: boolean;
  /** The viewer's own request for it, if they made one. */
  myRequest: DonationRequest | null;
  /** The donor's contact, only for the viewer whose request was accepted. */
  donorContact: Contact | null;
  /** Every request for it, only for the donor. */
  requests: DonationRequest[] | null;
}

/** A listing in "My listings", with how many requests need an answer. */
export interface MyDonation extends DonationSummary {
  pendingRequests: number;
}

export interface DonationRequest {
  id: string;
  donationId: string;
  status: RequestStatus;
  message: string;
  /** The requester as the donor sees them before accepting. */
  requesterName: string;
  requesterType: AccountType;
  /** For the donor: the requester's contact once accepted. */
  contact: Contact | null;
  /**
   * The 4-digit handover code, shown only to the requester once accepted.
   * They read it out at pickup and the donor enters it to confirm collection,
   * so food is only marked collected when it really changed hands.
   */
  pickupCode: string | null;
  /** The requester's thank-you note after collection. */
  thankYouNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A request in "My requests", with the listing it is for. */
export interface MyRequest extends DonationRequest {
  donation: DonationSummary;
  /** The donor's contact, once they accept. */
  donorContact: Contact | null;
}

export interface ThankYou {
  from: string;
  note: string;
  listingTitle: string;
  createdAt: string;
}

/** A public profile: what someone has shared, and the thanks they got. */
export interface PublicProfile {
  id: string;
  displayName: string;
  accountType: AccountType;
  location: string | null;
  memberSince: string;
  donationsShared: number;
  kgShared: number;
  activeListings: DonationSummary[];
  thanks: ThankYou[];
}

export interface PantryItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  /** Optional; used for the "kg saved" and "kg wasted" totals. */
  weightKg: number | null;
  expiryDate: string;
  status: PantryStatus;
  resolvedAt: string | null;
  createdAt: string;
}

/** A "use it up" idea for food that's about to expire. */
export interface RecipeIdea {
  title: string;
  /** Pantry items it uses up. */
  uses: string[];
  /** Two to four short steps. */
  steps: string[];
  minutes: number;
  /** "ai" when written by the AI model, "guide" when from the built-in list. */
  source: "ai" | "guide";
}

/** A signed-in user's impact, worked out from their pantry and donations. */
export interface Impact {
  itemsTracked: number;
  /** Pantry items used up or given away instead of thrown out. */
  itemsSaved: number;
  itemsWasted: number;
  /** Weight used, given away, or handed over as a donation. */
  kgSaved: number;
  kgWasted: number;
  /** Listings that were collected by someone. */
  donationsShared: number;
  /** Listings this user picked up from someone else. */
  donationsReceived: number;
  /** Thank-you notes received. */
  thanksReceived: number;
  /** Rough meals equivalent (kgSaved / KG_PER_MEAL). */
  meals: number;
  /** Estimated greenhouse gas avoided (kgSaved x CO2E_PER_KG). */
  co2eKg: number;
  /** Active pantry items that expire within EXPIRING_SOON_DAYS. */
  expiringSoon: number;
}

/** Totals across everyone, for the home and impact pages. */
export interface CommunityStats {
  members: number;
  /** Businesses and organisations signed up. */
  partners: number;
  activeListings: number;
  /** Available listings that expire today. */
  rescueToday: number;
  donationsShared: number;
  kgSaved: number;
  meals: number;
  co2eKg: number;
  /** Food saved per week, oldest first, for the last 8 weeks. */
  weekly: { weekStart: string; kg: number; shared: number }[];
  /** The areas sharing the most food. */
  topAreas: { area: string; shared: number; kg: number }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UploadResponse {
  url: string;
  publicId: string;
}

/**
 * Roughly 2.5 kg of CO2-equivalent is emitted for every kilogram of food that
 * is produced and then wasted (WRAP / FAO estimates vary between 2 and 4).
 * Shown as an estimate in the UI.
 */
export const CO2E_PER_KG = 2.5;

/** A meal is roughly 0.5 kg of food (WRAP uses 420 g). */
export const KG_PER_MEAL = 0.5;

/** Pantry items expiring within this many days are flagged. */
export const EXPIRING_SOON_DAYS = 3;
