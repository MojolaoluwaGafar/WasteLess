import { Link } from "react-router";
import { ArrowRight, Cloud, HandHeart, Inbox, Leaf, Package, Plus, Refrigerator, Search, Utensils } from "lucide-react";
import { impactService } from "../API/services/impactService";
import { donationService } from "../API/services/donationService";
import { pantryService } from "../API/services/pantryService";
import { requestService } from "../API/services/requestService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { useAuth } from "../Context/AuthContext";
import Button from "../Components/Button";
import { ExpiryBadge, StatusBadge } from "../Components/Badges";
import { Milestones, StatTile } from "../Components/Impact";
import { PageLoader } from "../Components/Feedback";
import { CATEGORY_EMOJI, formatKg, plural } from "../utils/format";
import { daysUntil } from "../utils/expiry";

// "My WasteLess": what needs doing now (expiring food, requests to answer,
// pickups to make) above the person's impact and milestones.
export default function DashboardPage() {
  const { user } = useAuth();
  const impact = useApiQuery(() => impactService.mine(), [], "");
  const pantry = useApiQuery(() => pantryService.list("active"), [], "");
  const listings = useApiQuery(() => donationService.mine(), [], "");
  const requests = useApiQuery(() => requestService.mine(), [], "");

  if (impact.loading && !impact.data) return <PageLoader />;

  const expiring = (pantry.data ?? []).filter((item) => daysUntil(item.expiryDate) <= 3).slice(0, 5);
  const waiting = (listings.data ?? []).filter((listing) => listing.pendingRequests > 0);
  const pickups = (requests.data ?? []).filter((request) => request.status === "accepted");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const data = impact.data;

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-leaf">{greeting},</p>
          <h1 className="font-serif text-4xl font-semibold text-forest">{user?.orgName || user?.name.split(" ")[0]}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button to="/share">
            <Plus className="h-4 w-4" /> Share food
          </Button>
          <Button to="/pantry" variant="outline">
            <Refrigerator className="h-4 w-4" /> Pantry
          </Button>
          <Button to="/browse" variant="outline">
            <Search className="h-4 w-4" /> Find food
          </Button>
        </div>
      </div>

      {/* To do */}
      {(expiring.length > 0 || waiting.length > 0 || pickups.length > 0) && (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {waiting.length > 0 && (
            <section className="rounded-[28px] bg-amber-soft p-5">
              <h2 className="flex items-center gap-2 font-semibold text-amber">
                <Inbox className="h-5 w-5" /> {plural(waiting.reduce((sum, listing) => sum + listing.pendingRequests, 0), "request")} to answer
              </h2>
              <ul className="mt-3 space-y-2">
                {waiting.map((listing) => (
                  <li key={listing.id}>
                    <Link to={`/donations/${listing.id}`} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium hover:shadow-card">
                      <span className="truncate">{listing.title}</span>
                      <span className="ml-2 shrink-0 rounded-full bg-amber px-2 py-0.5 text-[11px] font-bold text-white">{listing.pendingRequests}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {pickups.length > 0 && (
            <section className="rounded-[28px] bg-forest p-5 text-white">
              <h2 className="flex items-center gap-2 font-semibold text-sprout">
                <HandHeart className="h-5 w-5" /> {plural(pickups.length, "pickup")} to collect
              </h2>
              <ul className="mt-3 space-y-2">
                {pickups.map((request) => (
                  <li key={request.id}>
                    <Link to={`/donations/${request.donation.id}`} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium hover:bg-white/15">
                      <span className="truncate">{request.donation.title}</span>
                      <span className="ml-2 font-mono font-bold tracking-widest text-sprout">{request.pickupCode}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {expiring.length > 0 && (
            <section className="rounded-[28px] bg-clay-soft p-5">
              <h2 className="flex items-center gap-2 font-semibold text-clay">
                <Refrigerator className="h-5 w-5" /> Use soon
              </h2>
              <ul className="mt-3 space-y-2">
                {expiring.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm">
                    <span className="truncate font-medium">
                      {CATEGORY_EMOJI[item.category]} {item.name}
                    </span>
                    <ExpiryBadge date={item.expiryDate} />
                  </li>
                ))}
              </ul>
              <Link to="/pantry#ideas" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-clay hover:underline">
                Get recipe ideas <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          )}
        </div>
      )}

      {/* Impact */}
      {data && (
        <>
          <h2 className="mt-12 font-serif text-2xl font-semibold text-forest">Your impact</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile icon={<Leaf className="h-5 w-5" />} value={formatKg(data.kgSaved)} label="Food saved" hint={`${plural(data.itemsSaved, "pantry item")} used or given`} />
            <StatTile icon={<Utensils className="h-5 w-5" />} value={data.meals} label="Meals' worth" hint="about 0.5 kg each" />
            <StatTile icon={<HandHeart className="h-5 w-5" />} value={data.donationsShared} label="Listings shared" hint={`${data.donationsReceived} collected from others`} />
            <StatTile icon={<Cloud className="h-5 w-5" />} value={`${Math.round(data.co2eKg)} kg`} label="CO₂e avoided" hint="estimate" />
          </div>
          {data.itemsWasted > 0 && (
            <p className="mt-3 text-sm text-on-surface-variant">
              {plural(data.itemsWasted, "item")} ({formatKg(data.kgWasted)}) went to waste. Logging it helps you spot patterns.
            </p>
          )}
          <div className="mt-10">
            <Milestones impact={data} />
          </div>
        </>
      )}

      {/* Recent listings */}
      {listings.data && listings.data.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-semibold text-forest">Your listings</h2>
            <Link to="/my-listings" className="text-sm font-semibold text-leaf hover:underline">
              See all
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.data.slice(0, 3).map((listing) => (
              <li key={listing.id}>
                <Link to={`/donations/${listing.id}`} className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-card ring-1 ring-forest/5 hover:shadow-lift">
                  <img src={listing.image} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{listing.title}</div>
                    <div className="mt-1">
                      <StatusBadge status={listing.status} kind="donation" />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {listings.data?.length === 0 && (
        <div className="mt-12 flex flex-col items-start gap-4 rounded-[32px] bg-mint p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-2xl font-semibold text-forest">
              <Package className="h-6 w-6 text-leaf" /> Got food you won't finish?
            </h2>
            <p className="mt-1 text-on-surface-variant">List it in a minute and someone nearby will be glad of it.</p>
          </div>
          <Button to="/share">Share your first listing</Button>
        </div>
      )}
    </div>
  );
}
