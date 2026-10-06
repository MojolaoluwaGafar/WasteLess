import { button, clientUrl, codeBox, detailRows, emailLayout, escapeHtml, paragraph, quote } from "./layout";
import { formatDay } from "../Utils/dates";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

interface ListingInfo {
  id: string;
  title: string;
  location: string;
  expiryDate: Date;
  pickupNotes?: string | null;
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string | null;
}

const listingUrl = (id: string) => `${clientUrl()}/donations/${id}`;

const contactRows = (contact: ContactInfo): [string, string][] => [
  ["Name", escapeHtml(contact.name)],
  ["Email", `<a href="mailto:${escapeHtml(contact.email)}" style="color:#3F7D4E">${escapeHtml(contact.email)}</a>`],
  ...(contact.phone ? ([["Phone", escapeHtml(contact.phone)]] as [string, string][]) : []),
];

export function resetPasswordEmail(name: string, token: string): EmailContent {
  const link = `${clientUrl()}/reset-password/${token}`;
  return {
    subject: "Reset your WasteLess password",
    html: emailLayout({
      preheader: "Use this link within 30 minutes to choose a new password.",
      heading: "Choose a new password",
      body:
        paragraph(`Hi ${escapeHtml(name)}, someone (hopefully you) asked to reset the password for this account.`) +
        button(link, "Reset my password") +
        paragraph("The link works once and expires in 30 minutes. If you didn't ask for this, you can ignore this email."),
    }),
    text: `Hi ${name},\n\nReset your WasteLess password here (expires in 30 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
  };
}

// To the donor: someone wants their food.
export function newRequestEmail(donorName: string, requesterName: string, message: string, listing: ListingInfo): EmailContent {
  return {
    subject: `${requesterName} would like your ${listing.title}`,
    html: emailLayout({
      preheader: `${requesterName} sent a request for ${listing.title}.`,
      heading: "Someone wants your food",
      body:
        paragraph(`Hi ${escapeHtml(donorName)}, <strong>${escapeHtml(requesterName)}</strong> asked for <strong>${escapeHtml(listing.title)}</strong>.`) +
        quote("Their message", message) +
        paragraph("Accept the request to share your contact details and reserve the food for them.") +
        button(listingUrl(listing.id), "Review the request"),
    }),
    text: `Hi ${donorName},\n\n${requesterName} asked for "${listing.title}":\n"${message}"\n\nReview it: ${listingUrl(listing.id)}`,
  };
}

// To the requester: the donor said yes. Includes the donor's contact.
export function requestAcceptedEmail(
  requesterName: string,
  donor: ContactInfo,
  listing: ListingInfo,
  pickupCode: string | null,
): EmailContent {
  const rows: [string, string][] = [
    ["Pickup", escapeHtml(listing.location)],
    ["Best before", formatDay(listing.expiryDate)],
    ...contactRows(donor),
  ];
  return {
    subject: `Good news: ${listing.title} is reserved for you`,
    html: emailLayout({
      preheader: `${donor.name} accepted your request. Arrange a pickup.`,
      heading: "Your request was accepted",
      body:
        paragraph(`Hi ${escapeHtml(requesterName)}, ${escapeHtml(donor.name)} has reserved <strong>${escapeHtml(listing.title)}</strong> for you. Get in touch to arrange a pickup time.`) +
        (pickupCode ? codeBox(pickupCode) : "") +
        detailRows(rows) +
        (listing.pickupNotes ? quote("Pickup notes", listing.pickupNotes) : "") +
        button(listingUrl(listing.id), "View the listing"),
    }),
    text:
      `Hi ${requesterName},\n\n${donor.name} reserved "${listing.title}" for you.\n` +
      `${pickupCode ? `Pickup code: ${pickupCode} (show it to the donor when you collect)\n` : ""}` +
      `Pickup:${listing.location}\nEmail: ${donor.email}\n${donor.phone ? `Phone: ${donor.phone}\n` : ""}` +
      `${listing.pickupNotes ? `Notes: ${listing.pickupNotes}\n` : ""}\n${listingUrl(listing.id)}`,
  };
}

// To the requester: the donor said no, or gave it to someone else.
export function requestDeclinedEmail(requesterName: string, listing: ListingInfo): EmailContent {
  const browse = `${clientUrl()}/browse`;
  return {
    subject: `Update on your request for ${listing.title}`,
    html: emailLayout({
      preheader: "This one has gone, but there's more food nearby.",
      heading: "This one didn't work out",
      body:
        paragraph(`Hi ${escapeHtml(requesterName)}, <strong>${escapeHtml(listing.title)}</strong> is no longer available for you. It may have gone to someone else, or the donor's plans changed.`) +
        paragraph("There's usually more food being shared nearby.") +
        button(browse, "Browse food near you"),
    }),
    text: `Hi ${requesterName},\n\n"${listing.title}" is no longer available for you.\nBrowse other food: ${browse}`,
  };
}

// To the donor: their accepted requester backed out.
export function requestCancelledEmail(donorName: string, requesterName: string, listing: ListingInfo): EmailContent {
  return {
    subject: `${requesterName} can no longer collect ${listing.title}`,
    html: emailLayout({
      preheader: "Your listing is available again.",
      heading: "A pickup was cancelled",
      body:
        paragraph(`Hi ${escapeHtml(donorName)}, ${escapeHtml(requesterName)} cancelled their request for <strong>${escapeHtml(listing.title)}</strong>.`) +
        paragraph("If they had a reservation, the listing is available again, and any other requests are waiting for you.") +
        button(listingUrl(listing.id), "View the listing"),
    }),
    text: `Hi ${donorName},\n\n${requesterName} cancelled their request for "${listing.title}". The listing is available again.\n${listingUrl(listing.id)}`,
  };
}
