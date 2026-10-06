import { z } from "zod";
import { isValidObjectId } from "mongoose";

// Mirrors FoodCategory in packages/shared.
export const FOOD_CATEGORIES = ["produce", "bakery", "cooked", "dairy", "pantry", "drinks", "other"] as const;

export const categorySchema = z.enum(FOOD_CATEGORIES, { error: "Pick a category." });

// Forms send "" for an empty optional box; treat that as "not given".
const blankToNull = (value: unknown) => (typeof value === "string" && value.trim() === "" ? null : value);

export const optionalText = (max: number, label: string) =>
  z.preprocess(blankToNull, z.string().trim().max(max, `${label} can be at most ${max} characters.`).nullable().optional());

export const optionalWeight = z.preprocess(
  blankToNull,
  z.coerce
    .number({ error: "Enter the weight in kg." })
    .positive("The weight must be more than 0.")
    .max(1000, "That weight looks too large.")
    .nullable()
    .optional(),
);

export const quantitySchema = z.coerce
  .number({ error: "Enter a quantity." })
  .positive("The quantity must be more than 0.")
  .max(10_000, "That quantity looks too large.");

export const unitSchema = z.string().trim().min(1, "Enter a unit, like items or kg.").max(20, "Keep the unit short.");

// A calendar day from an <input type="date">: YYYY-MM-DD.
export const daySchema = z
  .string({ error: "Pick a date." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
  .refine((day) => !Number.isNaN(new Date(`${day}T00:00:00Z`).getTime()), "Pick a valid date.");

export const objectIdSchema = z.string().refine((value) => isValidObjectId(value), "Not found.");

export const emailSchema = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string({ error: "Enter a password." })
  .min(8, "Use at least 8 characters.")
  .max(128, "Use at most 128 characters.");
