import { z } from "zod";
import {
  categorySchema,
  daySchema,
  objectIdSchema,
  optionalText,
  optionalWeight,
  quantitySchema,
  unitSchema,
} from "./common";

// Only these fields can be set from a request, so a client can't change a
// listing's donor, status or collection record.
const fields = {
  title: z.string({ error: "Give it a title." }).trim().min(3, "Give it a title.").max(80, "Keep the title under 80 characters."),
  description: z
    .string({ error: "Describe the food." })
    .trim()
    .min(10, "Add a little more detail (at least 10 characters).")
    .max(600, "Keep the description under 600 characters."),
  category: categorySchema,
  quantity: quantitySchema,
  unit: unitSchema,
  location: z
    .string({ error: "Where can it be picked up?" })
    .trim()
    .min(2, "Where can it be picked up?")
    .max(100, "Keep the location under 100 characters."),
  pickupNotes: optionalText(300, "Pickup notes"),
  image: z.string({ error: "Add a photo." }).url("Add a photo."),
  imagePublicId: z.string().max(200).nullable().optional(),
  expiryDate: daySchema,
  weightKg: optionalWeight,
};

export const CreateDonationSchema = z.object({
  ...fields,
  // When listing something from the pantry.
  pantryItemId: objectIdSchema.nullable().optional(),
  // The donor confirms the food is safe to eat (see the pledge on the form).
  safetyPledge: z.literal(true, { error: "Please confirm the food is safe to share." }),
});

export const UpdateDonationSchema = z.object(fields).partial();

export const ThankYouSchema = z.object({
  note: z
    .string({ error: "Write a short note." })
    .trim()
    .min(2, "Write a short note.")
    .max(280, "Keep the note under 280 characters."),
});

export const CompleteSchema = z.object({
  code: z.string({ error: "Enter the 4-digit pickup code." }).trim().regex(/^\d{4}$/, "Enter the 4-digit pickup code."),
});

export const CreateRequestSchema = z.object({
  message: z
    .string({ error: "Add a short message for the donor." })
    .trim()
    .min(2, "Add a short message for the donor.")
    .max(500, "Keep the message under 500 characters."),
});

export type CreateDonationInput = z.infer<typeof CreateDonationSchema>;
export type UpdateDonationInput = z.infer<typeof UpdateDonationSchema>;
