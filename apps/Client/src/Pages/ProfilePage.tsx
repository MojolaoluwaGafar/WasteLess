import { useParams } from "react-router";
import { CalendarDays, HandHeart, Leaf, MapPin, Quote } from "lucide-react";
import { requestService } from "../API/services/requestService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { useAuth } from "../Context/AuthContext";
import Button from "../Components/Button";
import DonationCard from "../Components/DonationCard";
import { AccountBadge } from "../Components/Badges";
import { StatTile } from "../Components/Impact";
import { ErrorState, PageLoader } from "../Components/Feedback";
import { formatKg, timeAgo } from "../utils/format";

// A donor's public page: never contact details, just what they've shared
// and the thanks they've had. This is what makes a stranger's pickup feel safe.
export default function ProfilePage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { data: profile, loading, error, refetch } = useApiQuery(() => requestService.profile(id), [id], "Couldn't load this profile.");

  if (loading && !profile) return <PageLoader />;
  if (error || !profile) return <ErrorState message={error ?? "This profile doesn't exist."} onRetry={refetch} />;

  const since = new Date(profile.memberSince).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-col gap-6 rounded-[36px] bg-mint p-6 sm:flex-row sm:items-center sm:p-10">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] bg-forest font-serif text-4xl font-semibold text-sprout">
          {profile.displayName[0]?.toUpperCase()}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl font-semibold text-forest">{profile.displayName}</h1>
            <AccountBadge type={profile.accountType} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-on-surface-variant">
            {profile.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-leaf" /> {profile.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-leaf" /> Member since {since}
            </span>
          </div>
        </div>
        {user?.id === profile.id && (
          <Button to="/account" variant="outline">
            Edit profile
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile icon={<HandHeart className="h-5 w-5" />} value={profile.donationsShared} label="Listings shared" />
        <StatTile icon={<Leaf className="h-5 w-5" />} value={formatKg(profile.kgShared)} label="Food shared" />
        <StatTile icon={<Quote className="h-5 w-5" />} value={profile.thanks.length} label="Thank-you notes" className="col-span-2 md:col-span-1" />
      </div>

      {profile.thanks.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold text-forest">What people say</h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profile.thanks.map((thank) => (
              <li key={`${thank.from}-${thank.createdAt}`} className="rounded-[28px] bg-white p-6 shadow-card ring-1 ring-forest/5">
                <Quote className="h-6 w-6 text-sprout" />
                <p className="mt-3 font-serif text-lg italic leading-snug text-forest">&ldquo;{thank.note}&rdquo;</p>
                <p className="mt-4 text-xs text-on-surface-variant">
                  <strong className="text-on-surface">{thank.from}</strong> · for {thank.listingTitle} · {timeAgo(thank.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-forest">Available now</h2>
        {profile.activeListings.length === 0 ? (
          <p className="mt-3 text-on-surface-variant">Nothing listed right now.</p>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {profile.activeListings.map((donation) => (
              <DonationCard key={donation.id} donation={donation} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
