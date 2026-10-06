import crypto from "crypto";
import type { DonationRequest as RequestDto, MyRequest } from "../types/shared";
import { Donation, type DonationDoc } from "../Models/Donation";
import { DonationRequest, type RequestDoc } from "../Models/DonationRequest";
import { startOfToday } from "../Utils/dates";
import {
  newRequestEmail,
  requestAcceptedEmail,
  requestCancelledEmail,
  requestDeclinedEmail,
} from "../emails/templates";
import {
  displayName,
  isPopulated,
  PERSON_FIELDS,
  PUBLIC_FIELDS,
  toContact,
  toDonationSummary,
  toRequestDto,
  type PersonFields,
} from "./mappers";
import { notify } from "./notifyService";
import { ServiceError } from "./errors";

// The request flow, from the donor's side:
//   pending --accept--> accepted (listing reserved, pickup code issued)
//   accepted --complete with the pickup code--> collected
//   pending/accepted --decline--> declined (listing available again)
// and from the requester's side:
//   pending/accepted --cancel--> cancelled (listing available again)
//   collected --thank--> a thank-you note on the donor's profile
// Only one request per listing can be accepted at a time. Other pending
// requests wait, so the donor has a fallback if the pickup falls through.

const OPEN = ["pending", "accepted"] as const;
const isOpen = (status: string) => (OPEN as readonly string[]).includes(status);

const listingInfo = (donation: DonationDoc) => ({
  id: String(donation._id),
  title: donation.title,
  location: donation.location,
  expiryDate: donation.expiryDate,
  pickupNotes: donation.pickupNotes,
});

// 4 digits, from a secure random source so it can't be predicted.
const newPickupCode = () => String(crypto.randomInt(0, 10_000)).padStart(4, "0");

async function loadForDonor(userId: string, requestId: string): Promise<RequestDoc> {
  const request = await DonationRequest.findById(requestId).populate("requester", PERSON_FIELDS);
  if (!request || String(request.donor) !== userId) throw new ServiceError(404, "Request not found.");
  return request;
}

async function loadForRequester(userId: string, requestId: string): Promise<RequestDoc> {
  const request = await DonationRequest.findById(requestId).populate("requester", PUBLIC_FIELDS);
  if (!request || String((request.requester as unknown as PersonFields)._id) !== userId) {
    throw new ServiceError(404, "Request not found.");
  }
  return request;
}

async function loadDonation(request: RequestDoc): Promise<DonationDoc> {
  const donation = await Donation.findById(request.donation).populate("user", PERSON_FIELDS);
  if (!donation) throw new ServiceError(404, "This listing doesn't exist anymore.");
  return donation;
}

// Puts a reserved listing back on Browse when its reservation falls through.
async function releaseReservation(donationId: unknown) {
  await Donation.updateOne({ _id: donationId, status: "reserved" }, { status: "available" });
}

export async function create(userId: string, donationId: string, message: string): Promise<RequestDto> {
  const donation = await Donation.findById(donationId).populate("user", PERSON_FIELDS);
  if (!donation) throw new ServiceError(404, "This listing doesn't exist anymore.");

  const donor = donation.user as unknown as PersonFields;
  if (String(donor._id) === userId) throw new ServiceError(400, "This is your own listing.");
  if (donation.status === "collected") throw new ServiceError(409, "This food has already been collected.");
  if (donation.expiryDate < startOfToday()) throw new ServiceError(410, "This listing has expired.");
  if (donation.status === "reserved") {
    throw new ServiceError(409, "This is reserved for someone else right now. Check back later in case it frees up.");
  }

  const existing = await DonationRequest.findOne({ donation: donation._id, requester: userId, status: { $in: [...OPEN] } });
  if (existing) throw new ServiceError(409, "You've already asked for this. The donor will reply soon.");

  const request = await DonationRequest.create({ donation: donation._id, donor: donor._id, requester: userId, message });
  await request.populate("requester", PUBLIC_FIELDS);

  const requesterName = isPopulated(request.requester) ? displayName(request.requester) : "Someone";
  notify(donor.email, newRequestEmail(donor.name, requesterName, message, listingInfo(donation)));
  return toRequestDto(request, "requester");
}

export async function listMine(userId: string): Promise<MyRequest[]> {
  const requests = await DonationRequest.find({ requester: userId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("requester", PUBLIC_FIELDS)
    .populate({ path: "donation", populate: { path: "user", select: PERSON_FIELDS } });

  return requests
    .filter((request) => request.donation && typeof request.donation === "object" && "title" in request.donation)
    .map((request) => {
      const donation = request.donation as unknown as DonationDoc;
      const donor = donation.user as unknown;
      const accepted = request.status === "accepted" || request.status === "collected";
      return {
        ...toRequestDto(request, "requester"),
        donation: toDonationSummary(donation),
        donorContact: accepted && isPopulated(donor) ? toContact(donor) : null,
      };
    });
}

export async function accept(userId: string, requestId: string): Promise<RequestDto> {
  const request = await loadForDonor(userId, requestId);
  if (request.status !== "pending") throw new ServiceError(409, "Only waiting requests can be accepted.");

  // Reserve atomically, so two quick taps (or two devices) can't accept two
  // people for the same food.
  const donation = await Donation.findOneAndUpdate(
    { _id: request.donation, user: userId, status: "available" },
    { status: "reserved" },
    { returnDocument: "after" },
  ).populate("user", PERSON_FIELDS);

  if (!donation) {
    const current = await Donation.findById(request.donation);
    if (current?.status === "reserved") {
      throw new ServiceError(409, "You've already accepted someone for this. Decline them first to choose someone else.");
    }
    throw new ServiceError(409, "This listing can't be reserved anymore.");
  }

  request.status = "accepted";
  request.pickupCode = newPickupCode();
  await request.save();

  const requester = request.requester as unknown;
  if (isPopulated(requester)) {
    notify(
      requester.email,
      requestAcceptedEmail(requester.name, toContact(donation.user as unknown as PersonFields), listingInfo(donation), request.pickupCode),
    );
  }
  return toRequestDto(request, "donor");
}

export async function decline(userId: string, requestId: string): Promise<RequestDto> {
  const request = await loadForDonor(userId, requestId);
  if (!isOpen(request.status)) throw new ServiceError(409, "This request is already closed.");

  const wasAccepted = request.status === "accepted";
  request.status = "declined";
  request.pickupCode = null;
  await request.save();
  if (wasAccepted) await releaseReservation(request.donation);

  const donation = await loadDonation(request);
  const requester = request.requester as unknown;
  if (isPopulated(requester)) notify(requester.email, requestDeclinedEmail(requester.name, listingInfo(donation)));
  return toRequestDto(request, "donor");
}

// The requester backs out. The donor only hears about it if they had
// reserved the food for this person.
export async function cancel(userId: string, requestId: string): Promise<RequestDto> {
  const request = await loadForRequester(userId, requestId);
  if (!isOpen(request.status)) throw new ServiceError(409, "This request is already closed.");

  const wasAccepted = request.status === "accepted";
  request.status = "cancelled";
  request.pickupCode = null;
  await request.save();

  if (wasAccepted) {
    await releaseReservation(request.donation);
    const donation = await loadDonation(request);
    const donor = donation.user as unknown;
    const requester = request.requester as unknown as PersonFields;
    if (isPopulated(donor)) notify(donor.email, requestCancelledEmail(donor.name, displayName(requester), listingInfo(donation)));
  }
  return toRequestDto(request, "requester");
}

// The donor confirms the handover with the code the requester shows them.
// The listing then counts toward both people's impact, and everyone else
// still waiting is told it's gone.
export async function complete(userId: string, requestId: string, code: string): Promise<RequestDto> {
  const request = await loadForDonor(userId, requestId);
  if (request.status !== "accepted") throw new ServiceError(409, "Accept the request before marking it collected.");
  if (request.pickupCode && request.pickupCode !== code) {
    throw new ServiceError(400, "That code doesn't match. Ask them to check the code on their request.", "code");
  }

  const requester = request.requester as unknown as PersonFields;
  const donation = await Donation.findOneAndUpdate(
    { _id: request.donation, user: userId, status: "reserved" },
    { status: "collected", collectedAt: new Date(), collectedBy: requester._id },
    { returnDocument: "after" },
  );
  if (!donation) throw new ServiceError(409, "This listing isn't reserved anymore.");

  request.status = "collected";
  request.pickupCode = null;
  await request.save();

  const others = await DonationRequest.find({ donation: donation._id, status: "pending" }).populate("requester", "name email");
  await DonationRequest.updateMany({ donation: donation._id, status: "pending" }, { status: "declined" });
  for (const other of others) {
    const person = other.requester as unknown;
    if (isPopulated(person)) notify(person.email, requestDeclinedEmail(person.name, listingInfo(donation)));
  }
  return toRequestDto(request, "donor");
}

// After pickup, the requester can thank the donor once. Notes show on the
// donor's public profile, which is how new people decide whom to trust.
export async function thank(userId: string, requestId: string, note: string): Promise<RequestDto> {
  const request = await loadForRequester(userId, requestId);
  if (request.status !== "collected") throw new ServiceError(409, "You can say thanks once you've collected the food.");
  if (request.thankYouNote) throw new ServiceError(409, "You've already thanked them for this one.");
  request.thankYouNote = note;
  request.thankedAt = new Date();
  await request.save();
  return toRequestDto(request, "requester");
}
