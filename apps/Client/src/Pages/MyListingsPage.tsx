import { useState } from "react";
import { Package } from "lucide-react";
import type { DonationStatus } from "../types";
import { donationService } from "../API/services/donationService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import Button from "../Components/Button";
import DonationCard from "../Components/DonationCard";
import { CardSkeleton, EmptyState, ErrorState } from "../Components/Feedback";
import { cx, plural } from "../utils/format";
import { daysUntil } from "../utils/expiry";

type Tab = DonationStatus | "all";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "reserved", label: "Reserved" },
  { key: "collected", label: "Collected" },
];

export default function MyListingsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const { data, loading, error, refetch } = useApiQuery(() => donationService.mine(), [], "Couldn't load your listings.");
  const listings = (data ?? []).filter((listing) => tab === "all" || listing.status === tab);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-forest">My listings</h1>
          <p className="mt-1 text-on-surface-variant">Food you've shared, and the requests for it.</p>
        </div>
        <Button to="/share">Share food</Button>
      </div>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4">
        {TABS.map(({ key, label }) => {
          const count = key === "all" ? data?.length : data?.filter((listing) => listing.status === key).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={cx(
                "h-10 shrink-0 rounded-full px-4 text-sm font-semibold",
                tab === key ? "bg-forest text-white" : "bg-white text-on-surface-variant ring-1 ring-forest/10",
              )}
            >
              {label}
              {count !== undefined && ` (${count})`}
            </button>
          );
        })}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<Package className="h-7 w-7" />}
          title={tab === "all" ? "Nothing shared yet" : "Nothing here"}
          message="Leftovers, extra shopping, event surplus: someone nearby will be glad of it."
          action={<Button to="/share">Share food</Button>}
        />
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <DonationCard
              key={listing.id}
              donation={listing}
              showStatus
              footer={
                listing.pendingRequests > 0 ? (
                  <p className="mt-3 rounded-2xl bg-amber-soft px-3 py-2 text-xs font-bold text-amber">
                    {plural(listing.pendingRequests, "request")} waiting for you
                  </p>
                ) : listing.status === "available" && daysUntil(listing.expiryDate) < 0 ? (
                  <p className="mt-3 rounded-2xl bg-surface-low px-3 py-2 text-xs font-semibold text-on-surface-variant">Expired: hidden from Browse</p>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
