import type { ReactNode } from "react";
import { Link } from "react-router";
import { MapPin } from "lucide-react";
import type { DonationSummary } from "../types";
import { CATEGORY_EMOJI, cx, plural } from "../utils/format";
import { AccountBadge, ExpiryBadge, StatusBadge } from "./Badges";

type Props = {
  donation: DonationSummary;
  /** Shows the status chip (for "My listings"). */
  showStatus?: boolean;
  /** Extra line under the title, e.g. "2 requests waiting". */
  footer?: ReactNode;
  className?: string;
};

// The listing card used on Browse, the home page and profiles.
export default function DonationCard({ donation, showStatus, footer, className }: Props) {
  return (
    <Link
      to={`/donations/${donation.id}`}
      className={cx(
        "group flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-forest/5 transition-all duration-300",
        "motion-safe:hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-container">
        <img
          src={donation.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {showStatus && donation.status !== "available" ? (
            <StatusBadge status={donation.status} kind="donation" />
          ) : (
            <ExpiryBadge date={donation.expiryDate} className="shadow-card" />
          )}
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-forest shadow-card">
          {plural(donation.quantity, donation.unit === "items" ? "item" : donation.unit, donation.unit)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-on-surface">
          <span aria-hidden="true">{CATEGORY_EMOJI[donation.category]} </span>
          {donation.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-on-surface-variant">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{donation.location}</span>
        </p>
        <div className="mt-auto flex items-center gap-2 pt-3 text-xs font-medium text-on-surface-variant">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-[10px] font-bold text-forest">
            {donation.donor.displayName[0]?.toUpperCase()}
          </span>
          <span className="truncate">{donation.donor.displayName}</span>
          <AccountBadge type={donation.donor.accountType} />
        </div>
        {footer}
      </div>
    </Link>
  );
}
