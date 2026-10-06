import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { Building2, Search, SearchX, Timer, X } from "lucide-react";
import type { DonationSummary, FoodCategory } from "../types";
import { donationService } from "../API/services/donationService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import DonationCard from "../Components/DonationCard";
import Button from "../Components/Button";
import { CardSkeleton, EmptyState, ErrorState } from "../Components/Feedback";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS, cx } from "../utils/format";

const PAGE_SIZE = 12;

// Browse. Every filter lives in the URL (?q=&category=&today=1&partners=1&sort=)
// so a search can be shared, bookmarked or opened from the home page.
export default function BrowsePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = (params.get("category") ?? "") as FoodCategory | "";
  const today = params.get("today") === "1";
  const partners = params.get("partners") === "1";
  const sort = params.get("sort") === "expiring" ? "expiring" : "newest";

  const [term, setTerm] = useState(q);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState<DonationSummary[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => setTerm(q), [q]);

  const filters = { q, category, today, partnersOnly: partners, sort } as const;
  const { data, loading, error, refetch } = useApiQuery(
    () => donationService.browse({ ...filters, page: 1, limit: PAGE_SIZE }),
    [q, category, today, partners, sort],
    "Couldn't load listings.",
  );

  // New filters start again from page 1.
  useEffect(() => {
    setPage(1);
    setMore([]);
  }, [q, category, today, partners, sort]);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setParams(next, { replace: true });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    update({ q: term.trim() || null });
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = await donationService.browse({ ...filters, page: page + 1, limit: PAGE_SIZE });
      setMore((items) => [...items, ...next.items]);
      setPage((value) => value + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  const items = [...(data?.items ?? []), ...more];
  const total = data?.total ?? 0;
  const anyFilter = Boolean(q || category || today || partners);

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8 md:pt-12">
      <div className={cx("rounded-[36px] p-6 sm:p-10", today ? "bg-clay text-white" : "bg-mint")}>
        <p className={cx("text-xs font-bold uppercase tracking-[0.16em]", today ? "text-white/80" : "text-leaf")}>
          {today ? "Ends at midnight" : "Free food near you"}
        </p>
        <h1 className={cx("mt-2 font-serif text-4xl font-semibold sm:text-5xl", today ? "text-white" : "text-forest")}>
          {today ? "Rescue today" : "Find food"}
        </h1>
        <p className={cx("mt-2 max-w-xl", today ? "text-white/85" : "text-on-surface-variant")}>
          {today
            ? "Everything here expires today. Request it now and it gets eaten instead of binned."
            : "Surplus from neighbours, restaurants and shops, free to collect. Search by food or area."}
        </p>
        <form onSubmit={submit} role="search" className="mt-6 flex max-w-2xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline" aria-hidden="true" />
            <input
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Try “bread”, “jollof” or “Yaba”"
              aria-label="Search listings"
              className="h-13 w-full rounded-full border-0 bg-white pl-11 pr-4 text-on-surface shadow-card placeholder:text-outline focus:outline-none focus:ring-4 focus:ring-leaf/20"
            />
          </div>
          <Button type="submit" size="lg" variant={today ? "light" : "primary"}>
            Search
          </Button>
        </form>
      </div>

      {/* Filters */}
      <div className="no-scrollbar -mx-4 mt-6 flex items-center gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <FilterChip active={today} onClick={() => update({ today: today ? null : "1" })} icon={<Timer className="h-4 w-4" />} urgent>
          Rescue today
        </FilterChip>
        <FilterChip active={partners} onClick={() => update({ partners: partners ? null : "1" })} icon={<Building2 className="h-4 w-4" />}>
          From businesses
        </FilterChip>
        <span className="mx-1 h-6 w-px shrink-0 bg-forest/10" />
        <FilterChip active={!category} onClick={() => update({ category: null })}>
          All food
        </FilterChip>
        {CATEGORIES.map((key) => (
          <FilterChip key={key} active={category === key} onClick={() => update({ category: category === key ? null : key })}>
            <span aria-hidden="true">{CATEGORY_EMOJI[key]}</span> {CATEGORY_LABELS[key]}
          </FilterChip>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-on-surface-variant" aria-live="polite">
          {loading ? "Looking for food…" : `${total} ${total === 1 ? "listing" : "listings"}${q ? ` for “${q}”` : ""}`}
        </p>
        <div className="flex items-center gap-3">
          {anyFilter && (
            <button type="button" onClick={() => setParams({}, { replace: true })} className="inline-flex items-center gap-1 text-sm font-semibold text-leaf hover:underline">
              <X className="h-4 w-4" /> Clear filters
            </button>
          )}
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            Sort
            <select
              value={sort}
              onChange={(event) => update({ sort: event.target.value === "expiring" ? "expiring" : null })}
              className="h-10 rounded-full border border-forest/10 bg-white px-4 text-sm font-semibold text-forest"
            >
              <option value="newest">Newest first</option>
              <option value="expiring">Expiring soonest</option>
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-7 w-7" />}
          title={anyFilter ? "Nothing matches yet" : "No food listed right now"}
          message={anyFilter ? "Try a different search, or clear the filters." : "New listings appear all day. Have something to share?"}
          action={<Button to="/share">Share food</Button>}
        />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
          {items.length < total && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" onClick={loadMore} loading={loadingMore}>
                Show more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  icon,
  urgent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  urgent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
        active
          ? urgent
            ? "bg-clay text-white"
            : "bg-forest text-white"
          : "bg-white text-on-surface-variant ring-1 ring-forest/10 hover:ring-forest/25",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
