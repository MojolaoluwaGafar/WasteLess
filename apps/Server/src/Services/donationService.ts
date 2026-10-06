import type { DonationDetail, DonationSummary, FoodCategory, MyDonation, Paginated } from "../types/shared";
import { Types } from "mongoose";
import { Donation, type DonationDoc } from "../Models/Donation";
import { DonationRequest } from "../Models/DonationRequest";
import { PantryItem } from "../Models/PantryItem";
import { isOwnImageUrl } from "../config/Cloudinary";
import { dayToDate, daysFromToday, startOfToday } from "../Utils/dates";
import { User } from "../Models/User";
import { escapeRegex } from "../Utils/params";
import { requestDeclinedEmail } from "../emails/templates";
import type { CreateDonationInput, UpdateDonationInput } from "../Validation/donationSchema";
import {
  idOf,
  isPopulated,
  PERSON_FIELDS,
  PUBLIC_FIELDS,
  toContact,
  toDonationSummary,
  toRequestDto,
} from "./mappers";
import { notify } from "./notifyService";
import { deleteImage } from "./uploadService";
import { ServiceError } from "./errors";


export interface BrowseOptions {
  q?: string;
  category?: FoodCategory;
  sort?: "newest" | "expiring";
  /** Only food that expires today: the "Rescue today" lane. */
  today?: boolean;
  /** Only listings from businesses and organisations. */
  partnersOnly?: boolean;
  page: number;
  limit: number;
}

// What Browse shows: food nobody has reserved yet, that hasn't expired.
const browsableFilter = () => ({ status: "available", expiryDate: { $gte: startOfToday() } });

export async function browse(options: BrowseOptions): Promise<Paginated<DonationSummary>> {
  const filter: Record<string, unknown> = browsableFilter();
  if (options.category) filter.category = options.category;
  if (options.today) filter.expiryDate = { $gte: startOfToday(), $lt: daysFromToday(1) };
  if (options.partnersOnly) {
    filter.user = { $in: await User.find({ accountType: { $ne: "individual" } }).distinct("_id") };
  }
  const q = options.q?.trim().slice(0, 60);
  if (q) {
    const pattern = { $regex: escapeRegex(q), $options: "i" };
    filter.$or = [{ title: pattern }, { description: pattern }, { location: pattern }];
  }

  const sort: Record<string, 1 | -1> = options.sort === "expiring" ? { expiryDate: 1, createdAt: -1 } : { createdAt: -1 };
  const [docs, total] = await Promise.all([
    Donation.find(filter)
      .sort(sort)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .populate("user", PUBLIC_FIELDS),
    Donation.countDocuments(filter),
  ]);

  return { items: docs.map(toDonationSummary), total, page: options.page, limit: options.limit };
}

async function findOwned(userId: string, id: string): Promise<DonationDoc> {
  const donation = await Donation.findById(id);
  if (!donation || String(donation.user) !== userId) throw new ServiceError(404, "Listing not found.");
  return donation;
}

function assertNotPast(day: string) {
  if (dayToDate(day) < startOfToday()) {
    throw new ServiceError(400, "That date has already passed. Food past its best-before can't be listed.", "expiryDate");
  }
}

function assertOwnImage(url: string) {
  if (!isOwnImageUrl(url)) throw new ServiceError(400, "Upload the photo again from this page.", "image");
}

// Anyone can open a listing. The donor also sees its requests (with the
// accepted person's contact); a requester sees their own request, and the
// donor's contact once accepted.
export async function getDetail(id: string, viewerId?: string): Promise<DonationDetail> {
  const donation = await Donation.findById(id).populate("user", PERSON_FIELDS);
  if (!donation) throw new ServiceError(404, "This listing doesn't exist anymore.");

  const donor = donation.user as unknown;
  const isOwner = Boolean(viewerId && idOf(donor) === viewerId);

  let requests: DonationDetail["requests"] = null;
  let myRequest: DonationDetail["myRequest"] = null;
  let donorContact: DonationDetail["donorContact"] = null;

  if (isOwner) {
    const docs = await DonationRequest.find({ donation: donation._id }).sort({ createdAt: -1 }).populate("requester", PERSON_FIELDS);
    requests = docs.map((doc) => toRequestDto(doc, "donor"));
  } else if (viewerId) {
    const mine = await DonationRequest.findOne({ donation: donation._id, requester: viewerId })
      .sort({ createdAt: -1 })
      .populate("requester", PUBLIC_FIELDS);
    if (mine) {
      myRequest = toRequestDto(mine, "requester");
      if ((mine.status === "accepted" || mine.status === "collected") && isPopulated(donor)) donorContact = toContact(donor);
    }
  }

  return {
    ...toDonationSummary(donation),
    description: donation.description,
    pickupNotes: donation.pickupNotes ?? null,
    weightKg: donation.weightKg ?? null,
    collectedAt: donation.collectedAt ? donation.collectedAt.toISOString() : null,
    isOwner,
    myRequest,
    donorContact,
    requests,
  };
}

export async function listMine(userId: string): Promise<MyDonation[]> {
  const docs = await Donation.find({ user: userId }).sort({ createdAt: -1 }).populate("user", PUBLIC_FIELDS);
  const counts = await DonationRequest.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { donor: new Types.ObjectId(userId), status: "pending" } },
    { $group: { _id: "$donation", count: { $sum: 1 } } },
  ]);
  const pending = new Map(counts.map((row) => [String(row._id), row.count]));
  return docs.map((doc) => ({ ...toDonationSummary(doc), pendingRequests: pending.get(String(doc._id)) ?? 0 }));
}

export async function create(userId: string, input: CreateDonationInput): Promise<DonationDetail> {
  assertNotPast(input.expiryDate);
  assertOwnImage(input.image);

  const { pantryItemId, safetyPledge: _pledge, ...fields } = input;
  let weightKg = fields.weightKg ?? null;

  // Listing something from the pantry marks it as donated there. Its weight
  // then counts once, through the pantry (see impactService).
  if (pantryItemId) {
    const item = await PantryItem.findOne({ _id: pantryItemId, user: userId, status: "active" });
    if (!item) throw new ServiceError(404, "That pantry item was already used or removed.");
    weightKg ??= item.weightKg ?? null;
    item.status = "donated";
    item.resolvedAt = new Date();
    await item.save();
  }

  const donation = await Donation.create({
    ...fields,
    weightKg,
    pickupNotes: fields.pickupNotes ?? null,
    expiryDate: dayToDate(fields.expiryDate),
    user: userId,
    pantryItem: pantryItemId ?? null,
  });
  return getDetail(String(donation._id), userId);
}

export async function update(userId: string, id: string, input: UpdateDonationInput): Promise<DonationDetail> {
  const donation = await findOwned(userId, id);
  if (donation.status === "collected") throw new ServiceError(409, "This food was already collected, so the listing can't change.");
  if (input.expiryDate) assertNotPast(input.expiryDate);
  // Only a new photo is checked: listings from the first version, or the
  // demo seed, keep theirs.
  if (input.image && input.image !== donation.image) assertOwnImage(input.image);

  const oldImageId = donation.imagePublicId;
  const photoChanged = Boolean(input.image && input.image !== donation.image);
  // The photo's Cloudinary id only changes along with the photo; the form
  // sends none when the photo stays the same.
  const { expiryDate, imagePublicId, ...rest } = input;
  donation.set(rest);
  if (expiryDate) donation.expiryDate = dayToDate(expiryDate);
  if (photoChanged) donation.imagePublicId = imagePublicId ?? null;
  await donation.save();

  if (oldImageId && oldImageId !== donation.imagePublicId) await deleteImage(oldImageId);
  return getDetail(id, userId);
}

// Deleting a listing closes its open requests (telling those people), and
// puts a pantry item it came from back in the pantry. Collected listings stay:
// they are the record of food that was shared.
export async function remove(userId: string, id: string): Promise<void> {
  const donation = await findOwned(userId, id);
  if (donation.status === "collected") {
    throw new ServiceError(409, "Collected listings stay as a record of food you've shared.");
  }

  const open = await DonationRequest.find({ donation: donation._id, status: { $in: ["pending", "accepted"] } }).populate(
    "requester",
    "name email",
  );
  for (const request of open) {
    const requester = request.requester as unknown;
    if (isPopulated(requester)) {
      notify(
        requester.email,
        requestDeclinedEmail(requester.name, {
          id,
          title: donation.title,
          location: donation.location,
          expiryDate: donation.expiryDate,
        }),
      );
    }
  }

  if (donation.pantryItem) {
    await PantryItem.updateOne({ _id: donation.pantryItem, status: "donated" }, { status: "active", resolvedAt: null });
  }
  await DonationRequest.deleteMany({ donation: donation._id });
  await donation.deleteOne();
  await deleteImage(donation.imagePublicId);
}
