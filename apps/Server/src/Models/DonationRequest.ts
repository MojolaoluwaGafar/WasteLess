import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

// Someone asking a donor for a listing. The donor accepts one request at a
// time (which reserves the listing), then marks it collected after handover.
const requestSchema = new Schema(
  {
    donation: { type: Schema.Types.ObjectId, ref: "FoodDonation", required: true },
    // Copied from the listing so "requests for my listings" needs no join.
    donor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requester: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled", "collected"],
      default: "pending",
    },
    // Set when accepted: the requester reads it out at pickup and the donor
    // enters it to confirm the handover.
    pickupCode: { type: String, default: null },
    // Written by the requester after collection; shown on the donor's profile.
    thankYouNote: { type: String, default: null, trim: true },
    thankedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

requestSchema.index({ donation: 1, status: 1 });
requestSchema.index({ requester: 1, createdAt: -1 });
requestSchema.index({ donor: 1, status: 1 });

export type RequestFields = InferSchemaType<typeof requestSchema>;
export type RequestDoc = HydratedDocument<RequestFields>;

export const DonationRequest = model("DonationRequest", requestSchema);
