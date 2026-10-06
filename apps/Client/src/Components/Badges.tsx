import { BadgeCheck, Building2, Clock, HeartHandshake } from "lucide-react";
import type { AccountType, DonationStatus, RequestStatus } from "../types";
import { DONATION_STATUS_LABELS, REQUEST_STATUS_LABELS, cx } from "../utils/format";
import { expiryLabel, expiryTone, type ExpiryTone } from "../utils/expiry";

const TONES: Record<ExpiryTone, string> = {
  expired: "bg-surface-container text-on-surface-variant",
  today: "bg-clay text-white",
  soon: "bg-amber-soft text-amber",
  fine: "bg-mint text-leaf",
};

// "Use today", "Use within 3 days"... coloured by how urgent it is.
export function ExpiryBadge({ date, className }: { date: string; className?: string }) {
  const tone = expiryTone(date);
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", TONES[tone], className)}>
      <Clock className="h-3 w-3" aria-hidden="true" />
      {expiryLabel(date)}
    </span>
  );
}

// Businesses and organisations get a badge beside their name.
export function AccountBadge({ type, className }: { type: AccountType; className?: string }) {
  if (type === "individual") return null;
  const business = type === "business";
  const Icon = business ? Building2 : HeartHandshake;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        business ? "bg-sprout-soft text-forest" : "bg-amber-soft text-amber",
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {business ? "Business" : "Organisation"}
    </span>
  );
}

export function VerifiedTick({ className }: { className?: string }) {
  return <BadgeCheck className={cx("h-4 w-4 text-leaf", className)} aria-label="Has shared food before" />;
}

const STATUS_TONES: Record<DonationStatus | RequestStatus, string> = {
  available: "bg-mint text-leaf",
  reserved: "bg-amber-soft text-amber",
  collected: "bg-forest text-white",
  pending: "bg-amber-soft text-amber",
  accepted: "bg-mint text-leaf",
  declined: "bg-surface-container text-on-surface-variant",
  cancelled: "bg-surface-container text-on-surface-variant",
};

export function StatusBadge({ status, kind }: { status: DonationStatus | RequestStatus; kind: "donation" | "request" }) {
  const label =
    kind === "donation" ? DONATION_STATUS_LABELS[status as DonationStatus] : REQUEST_STATUS_LABELS[status as RequestStatus];
  return <span className={cx("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_TONES[status])}>{label}</span>;
}
