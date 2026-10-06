import { Types } from "mongoose";
import type { PublicProfile } from "../types/shared";
import { User } from "../Models/User";
import { Donation } from "../Models/Donation";
import { DonationRequest } from "../Models/DonationRequest";
import { startOfToday } from "../Utils/dates";
import { round1 } from "../Utils/impact";
import { accountTypeOf, displayName, isPopulated, PUBLIC_FIELDS, toDonationSummary } from "./mappers";
import { ServiceError } from "./errors";

// A donor's public page: never contact details, just what they've shared and
// the thank-you notes from people who collected. That history is how someone
// new decides whether to trust a pickup.
export async function getProfile(id: string): Promise<PublicProfile> {
  const user = await User.findById(id).select("name accountType orgName location createdAt");
  if (!user) throw new ServiceError(404, "This profile doesn't exist.");

  const userId = new Types.ObjectId(id);
  const [shared, active, thanks] = await Promise.all([
    Donation.aggregate<{ count: number; kg: number }>([
      { $match: { user: userId, status: "collected" } },
      { $group: { _id: null, count: { $sum: 1 }, kg: { $sum: { $ifNull: ["$weightKg", 0] } } } },
    ]),
    Donation.find({ user: userId, status: "available", expiryDate: { $gte: startOfToday() } })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("user", PUBLIC_FIELDS),
    DonationRequest.find({ donor: userId, thankYouNote: { $ne: null } })
      .sort({ thankedAt: -1 })
      .limit(20)
      .populate("requester", PUBLIC_FIELDS)
      .populate("donation", "title"),
  ]);

  return {
    id,
    displayName: displayName(user),
    accountType: accountTypeOf(user),
    location: user.location ?? null,
    memberSince: (user.createdAt ?? user._id.getTimestamp()).toISOString(),
    donationsShared: shared[0]?.count ?? 0,
    kgShared: round1(shared[0]?.kg ?? 0),
    activeListings: active.map(toDonationSummary),
    thanks: thanks.map((request) => {
      const donation = request.donation as unknown as { title?: string } | null;
      return {
        from: isPopulated(request.requester) ? displayName(request.requester) : "Someone",
        note: request.thankYouNote ?? "",
        listingTitle: donation?.title ?? "a listing",
        createdAt: (request.thankedAt ?? request.updatedAt).toISOString(),
      };
    }),
  };
}
