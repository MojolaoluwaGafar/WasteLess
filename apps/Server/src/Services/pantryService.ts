import type { PantryItem as PantryDto, PantryOutcome } from "../types/shared";
import { PantryItem, type PantryDoc } from "../Models/PantryItem";
import { Donation } from "../Models/Donation";
import { dayToDate } from "../Utils/dates";
import type { CreatePantryInput, UpdatePantryInput } from "../Validation/pantrySchema";
import { toPantryDto } from "./mappers";
import { ServiceError } from "./errors";

// The pantry is where people log food they have at home, so WasteLess can
// warn them before it expires. Each item ends up used, donated or wasted, and
// those outcomes are what the impact numbers are built from.

const HISTORY_LIMIT = 100;

async function findOwned(userId: string, id: string): Promise<PantryDoc> {
  const item = await PantryItem.findOne({ _id: id, user: userId });
  if (!item) throw new ServiceError(404, "Pantry item not found.");
  return item;
}

// "active": what's in the kitchen now, soonest expiry first (expired items
// included, so they can still be resolved). "history": what happened to the rest.
export async function list(userId: string, view: "active" | "history"): Promise<PantryDto[]> {
  const docs =
    view === "active"
      ? await PantryItem.find({ user: userId, status: "active" }).sort({ expiryDate: 1, createdAt: 1 })
      : await PantryItem.find({ user: userId, status: { $ne: "active" } })
          .sort({ resolvedAt: -1 })
          .limit(HISTORY_LIMIT);
  return docs.map(toPantryDto);
}

// Unlike a listing, a pantry item may already be past its date: people log
// what they find in the fridge.
export async function create(userId: string, input: CreatePantryInput): Promise<PantryDto> {
  const item = await PantryItem.create({
    ...input,
    weightKg: input.weightKg ?? null,
    expiryDate: dayToDate(input.expiryDate),
    user: userId,
  });
  return toPantryDto(item);
}

export async function update(userId: string, id: string, input: UpdatePantryInput): Promise<PantryDto> {
  const item = await findOwned(userId, id);
  if (item.status !== "active") throw new ServiceError(409, "Only items still in your pantry can be edited.");
  const { expiryDate, ...rest } = input;
  item.set(rest);
  if (expiryDate) item.expiryDate = dayToDate(expiryDate);
  await item.save();
  return toPantryDto(item);
}

// "donated" here means given away in person, without a listing. Listing an
// item from the pantry resolves it through donationService instead.
export async function resolve(userId: string, id: string, outcome: PantryOutcome): Promise<PantryDto> {
  const item = await findOwned(userId, id);
  if (item.status !== "active") throw new ServiceError(409, "This item was already marked.");
  item.status = outcome;
  item.resolvedAt = new Date();
  await item.save();
  return toPantryDto(item);
}

// Back to the pantry, for a mis-tap on Used / Wasted.
export async function undo(userId: string, id: string): Promise<PantryDto> {
  const item = await findOwned(userId, id);
  if (item.status === "active") return toPantryDto(item);
  if (await Donation.exists({ pantryItem: item._id })) {
    throw new ServiceError(409, "This item is listed for donation. Delete the listing to put it back in your pantry.");
  }
  item.status = "active";
  item.resolvedAt = null;
  await item.save();
  return toPantryDto(item);
}

export async function remove(userId: string, id: string): Promise<void> {
  const item = await findOwned(userId, id);
  // A listing made from this item now counts its own weight.
  await Donation.updateMany({ pantryItem: item._id }, { pantryItem: null });
  await item.deleteOne();
}
