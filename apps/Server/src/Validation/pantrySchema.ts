import { z } from "zod";
import { categorySchema, daySchema, optionalWeight, quantitySchema, unitSchema } from "./common";

const fields = {
  name: z.string({ error: "What's the item?" }).trim().min(1, "What's the item?").max(80, "Keep the name under 80 characters."),
  category: categorySchema,
  quantity: quantitySchema,
  unit: unitSchema,
  weightKg: optionalWeight,
  expiryDate: daySchema,
};

export const CreatePantrySchema = z.object(fields);

export const UpdatePantrySchema = z.object(fields).partial();

export const ResolvePantrySchema = z.object({
  outcome: z.enum(["used", "donated", "wasted"], { error: "Choose what happened to it." }),
});

export type CreatePantryInput = z.infer<typeof CreatePantrySchema>;
export type UpdatePantryInput = z.infer<typeof UpdatePantrySchema>;
