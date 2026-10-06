import type { Types } from "mongoose";
import type {
  AccountType,
  Contact,
  DonationRequest as RequestDto,
  DonationStatus,
  DonationSummary,
  FoodCategory,
  PantryItem as PantryDto,
  PantryStatus,
  PublicDonor,
  RequestStatus,
} from "../types/shared";
import type { DonationDoc } from "../Models/Donation";
import type { RequestDoc } from "../Models/DonationRequest";
import type { PantryDoc } from "../Models/PantryItem";

// How documents become the JSON the Client gets (types in packages/shared).
// Contact details and pickup codes are only ever added for the two people in
// an accepted request.

/** The user fields selected when populating a person. */
export const PERSON_FIELDS = "name email phone accountType orgName";
export const PUBLIC_FIELDS = "name accountType orgName";

/** A user reference that may or may not have been populated. */
export interface PersonFields {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string | null;
  accountType?: string | null;
  orgName?: string | null;
}

export const firstName = (name: string | undefined) => (name ?? "").trim().split(/\s+/)[0] || "Someone";

export const isPopulated = (value: unknown): value is PersonFields =>
  Boolean(value && typeof value === "object" && "name" in value);

export const idOf = (value: unknown): string =>
  isPopulated(value) ? String(value._id) : String(value as Types.ObjectId);

export const accountTypeOf = (person: { accountType?: string | null }): AccountType =>
  (person.accountType as AccountType | undefined) ?? "individual";

// People show as their first name; businesses and organisations by name.
export const displayName = (person: { name?: string; accountType?: string | null; orgName?: string | null }) =>
  accountTypeOf(person) !== "individual" && person.orgName ? person.orgName : firstName(person.name);

export const toPublicDonor = (value: unknown): PublicDonor =>
  isPopulated(value)
    ? { id: String(value._id), displayName: displayName(value), accountType: accountTypeOf(value) }
    : { id: idOf(value), displayName: "Someone", accountType: "individual" };

export const toContact = (person: PersonFields): Contact => ({
  name: person.orgName && accountTypeOf(person) !== "individual" ? `${person.name} (${person.orgName})` : person.name,
  email: person.email,
  phone: person.phone ?? null,
});

export function toDonationSummary(doc: DonationDoc): DonationSummary {
  return {
    id: String(doc._id),
    title: doc.title,
    // Listings from the first version have no category, unit or status.
    category: (doc.category ?? "other") as FoodCategory,
    quantity: doc.quantity ?? 1,
    unit: doc.unit ?? "items",
    location: doc.location,
    image: doc.image,
    expiryDate: doc.expiryDate.toISOString(),
    status: (doc.status ?? "available") as DonationStatus,
    donor: toPublicDonor(doc.user as unknown),
    createdAt: (doc.createdAt ?? doc._id.getTimestamp()).toISOString(),
  };
}

/**
 * `viewer` decides what's included:
 * - "donor": the requester's contact once accepted.
 * - "requester": the pickup code once accepted.
 * - "public": neither.
 */
export function toRequestDto(doc: RequestDoc, viewer: "donor" | "requester" | "public" = "public"): RequestDto {
  const requester = doc.requester as unknown;
  const status = doc.status as RequestStatus;
  const accepted = status === "accepted" || status === "collected";
  return {
    id: String(doc._id),
    donationId: idOf(doc.donation),
    status,
    message: doc.message,
    requesterName: isPopulated(requester) ? displayName(requester) : "Someone",
    requesterType: isPopulated(requester) ? accountTypeOf(requester) : "individual",
    contact: viewer === "donor" && accepted && isPopulated(requester) ? toContact(requester) : null,
    pickupCode: viewer === "requester" && status === "accepted" ? (doc.pickupCode ?? null) : null,
    thankYouNote: doc.thankYouNote ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function toPantryDto(doc: PantryDoc): PantryDto {
  return {
    id: String(doc._id),
    name: doc.name,
    category: (doc.category ?? "other") as FoodCategory,
    quantity: doc.quantity,
    unit: doc.unit ?? "items",
    weightKg: doc.weightKg ?? null,
    expiryDate: doc.expiryDate.toISOString(),
    status: doc.status as PantryStatus,
    resolvedAt: doc.resolvedAt ? doc.resolvedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}
