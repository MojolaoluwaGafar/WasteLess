import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // bcrypt hash. Named `password` because accounts from the first version
    // of the app store it there. Empty for Google-only accounts.
    password: { type: String, select: false },
    googleId: { type: String, default: null },
    phone: { type: String, default: null, trim: true },
    location: { type: String, default: null, trim: true },
    // Businesses and organisations show their name and a badge on listings.
    accountType: { type: String, enum: ["individual", "business", "organisation"], default: "individual" },
    orgName: { type: String, default: null, trim: true },
    // Bumped when the password changes or is reset: older logins stop working.
    tokenVersion: { type: Number, default: 0 },
    // SHA-256 of the emailed reset token, never the token itself.
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

export type UserFields = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserFields>;

export const User = model("User", userSchema);
