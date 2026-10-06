import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { FOOD_CATEGORIES } from "../Validation/common";

// A food listing. The model is still called "FoodDonation" so listings made
// with the first version of the app (collection `fooddonations`) carry over.
const donationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: FOOD_CATEGORIES, default: "other" },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: "items", trim: true },
    location: { type: String, required: true, trim: true },
    pickupNotes: { type: String, default: null, trim: true },
    image: { type: String, required: true },
    // Cloudinary id, so the photo can be deleted with the listing.
    imagePublicId: { type: String, default: null },
    expiryDate: { type: Date, required: true },
    weightKg: { type: Number, default: null },
    status: { type: String, enum: ["available", "reserved", "collected"], default: "available" },
    // The donor. Named `user` for the same carry-over reason.
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collectedAt: { type: Date, default: null },
    collectedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // Set when the listing was made from a pantry item, so its weight isn't
    // counted twice in impact totals.
    pantryItem: { type: Schema.Types.ObjectId, ref: "PantryItem", default: null },
  },
  { timestamps: true },
);

donationSchema.index({ status: 1, expiryDate: 1, createdAt: -1 });
donationSchema.index({ user: 1, createdAt: -1 });

export type DonationFields = InferSchemaType<typeof donationSchema>;
export type DonationDoc = HydratedDocument<DonationFields>;

export const Donation = model("FoodDonation", donationSchema);
