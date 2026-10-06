import { Link } from "react-router";
import { ChevronRight, Inbox } from "lucide-react";
import { requestService } from "../API/services/requestService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import Button from "../Components/Button";
import { StatusBadge } from "../Components/Badges";
import { EmptyState, ErrorState, PageLoader } from "../Components/Feedback";
import { cx, timeAgo } from "../utils/format";

// Food the person asked for. Accepted ones show the pickup code right here,
// so it's one tap away at the door.
export default function MyRequestsPage() {
  const { data, loading, error, refetch } = useApiQuery(() => requestService.mine(), [], "Couldn't load your requests.");

  if (loading && !data) return <PageLoader />;

  return (
    <div className="mx-auto max-w-[900px] px-4 pt-8 md:px-8 md:pt-12">
      <h1 className="font-serif text-4xl font-semibold text-forest">My requests</h1>
      <p className="mt-1 text-on-surface-variant">Food you've asked for, and where each request is up to.</p>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState
          icon={<Inbox className="h-7 w-7" />}
          title="No requests yet"
          message="Find something you'd like, and send the donor a short message."
          action={<Button to="/browse">Find food</Button>}
        />
      ) : (
        <ul className="mt-8 space-y-3">
          {data.map((request) => (
            <li key={request.id}>
              <Link
                to={`/donations/${request.donation.id}`}
                className={cx(
                  "flex items-center gap-4 rounded-3xl bg-white p-3 pr-4 shadow-card ring-1 transition hover:shadow-lift",
                  request.status === "accepted" ? "ring-leaf/40" : "ring-forest/5",
                )}
              >
                <img src={request.donation.image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{request.donation.title}</div>
                  <div className="text-xs text-on-surface-variant">
                    {request.donation.donor.displayName} · {request.donation.location} · {timeAgo(request.createdAt)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} kind="request" />
                    {request.status === "accepted" && request.pickupCode && (
                      <span className="rounded-full bg-forest px-3 py-1 font-mono text-xs font-bold tracking-widest text-sprout">
                        Code {request.pickupCode}
                      </span>
                    )}
                    {request.status === "collected" && !request.thankYouNote && (
                      <span className="text-xs font-semibold text-leaf">Say thanks →</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-outline" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
