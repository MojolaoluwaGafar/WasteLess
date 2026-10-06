// The shapes the API sends and accepts come from packages/shared (copied into
// types/shared.ts by `npm run sync:shared`), so the Client and Server can't
// drift apart. Import them from here.
export type * from "./shared";

import type { FoodCategory, PantryOutcome } from "./shared";

// What a failed request's body looks like.
export interface ApiErrorResponse {
  success: false;
  message?: string;
  error?: string;
  errors?: { field: string; message: string }[];
}

/** The listing form, as typed (numbers stay strings until sent). */
export interface DonationFormValues {
  title: string;
  description: string;
  category: FoodCategory;
  quantity: string;
  unit: string;
  weightKg: string;
  location: string;
  pickupNotes: string;
  expiryDate: string;
  image: string;
  imagePublicId: string | null;
}

export interface PantryFormValues {
  name: string;
  category: FoodCategory;
  quantity: string;
  unit: string;
  weightKg: string;
  expiryDate: string;
}

export type { PantryOutcome };
