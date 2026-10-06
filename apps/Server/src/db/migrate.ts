import mongoose from "mongoose";
import { Donation } from "../Models/Donation";
import { PantryItem } from "../Models/PantryItem";
import { logger } from "../Utils/logger";

// Runs on every start, after the database connects. Each step is safe to
// repeat: it only touches documents that still need it. (Indexes declared in
// the models are created by Mongoose itself when it connects.)
export async function runStartupMigrations(): Promise<void> {
  // Listings made with the first version of the app have no status, category
  // or unit; without a status they would never show up on Browse.
  const [status, category, unit] = await Promise.all([
    Donation.updateMany({ status: { $exists: false } }, { $set: { status: "available" } }),
    Donation.updateMany({ category: { $exists: false } }, { $set: { category: "other" } }),
    Donation.updateMany({ unit: { $exists: false } }, { $set: { unit: "items" } }),
  ]);
  const changed = status.modifiedCount + category.modifiedCount + unit.modifiedCount;
  if (changed) logger.info({ changed }, "Filled in fields on listings from the first version");

  // The first version's Google sign-up could save accounts without a name,
  // which then fail validation on every save. Use the start of the email.
  const unnamed = await mongoose.connection.collection("users").updateMany(
    { $or: [{ name: { $exists: false } }, { name: null }, { name: "" }] },
    [{ $set: { name: { $arrayElemAt: [{ $split: ["$email", "@"] }, 0] } } }],
  );
  if (unnamed.modifiedCount) logger.info({ count: unnamed.modifiedCount }, "Named accounts that had no name");

  const moved = await moveLegacyTrackedItems();
  if (moved.users) logger.info(moved, "Moved food tracked in the first version into pantry history");
}

interface LegacyItem {
  item?: string;
  weight?: number;
  type?: "saved" | "donated";
  createdAt?: Date;
}

// The first version kept tracked food inside each user (`trackedItems`, with
// running `stats` counters). This moves it into pantry history, where impact
// is calculated from: "saved" becomes "used", "donated" stays "donated".
// Moved users lose the old fields, so it never runs twice for anyone.
export async function moveLegacyTrackedItems(): Promise<{ users: number; items: number }> {
  const users = mongoose.connection.collection("users");
  let movedUsers = 0;
  let movedItems = 0;

  for await (const user of users.find({ $or: [{ trackedItems: { $exists: true } }, { stats: { $exists: true } }] })) {
    const entries = (user.trackedItems ?? []) as LegacyItem[];
    const docs = entries
      .filter((entry) => entry.item && entry.type)
      .map((entry) => {
        const at = entry.createdAt ? new Date(entry.createdAt) : user._id.getTimestamp();
        return {
          user: user._id,
          name: String(entry.item),
          category: "other",
          quantity: 1,
          unit: "items",
          weightKg: typeof entry.weight === "number" && entry.weight > 0 ? entry.weight : null,
          expiryDate: at,
          status: entry.type === "donated" ? "donated" : "used",
          resolvedAt: at,
          createdAt: at,
          updatedAt: at,
        };
      });

    // Raw insert keeps the original dates (Mongoose would stamp "now").
    if (docs.length) await PantryItem.collection.insertMany(docs);
    await users.updateOne({ _id: user._id }, { $unset: { trackedItems: "", stats: "" } });
    movedUsers += 1;
    movedItems += docs.length;
  }
  return { users: movedUsers, items: movedItems };
}
