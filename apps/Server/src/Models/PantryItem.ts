import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { FOOD_CATEGORIES } from "../Validation/common";

// Food someone has at home, tracked until it is used, given away or thrown out.
const pantrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: FOOD_CATEGORIES, default: "other" },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: "items", trim: true },
    weightKg: { type: Number, default: null },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "used", "donated", "wasted"], default: "active" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

pantrySchema.index({ user: 1, status: 1, expiryDate: 1 });

export type PantryFields = InferSchemaType<typeof pantrySchema>;
export type PantryDoc = HydratedDocument<PantryFields>;

export const PantryItem = model("PantryItem", pantrySchema);
