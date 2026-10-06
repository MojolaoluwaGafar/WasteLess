import { Building2, Cloud, HandHeart, Leaf, MapPin, Package, Users, Utensils } from "lucide-react";
import { CO2E_PER_KG, KG_PER_MEAL } from "../types/shared";
import { impactService } from "../API/services/impactService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import Button from "../Components/Button";
import Reveal from "../Components/Reveal";
import { CountUp, StatTile, WeeklyChart } from "../Components/Impact";
import { ErrorState, PageLoader } from "../Components/Feedback";
import { formatKg } from "../utils/format";

// The public impact report: the page to show an investor, a council or a
// partner. Every number comes from real handovers and pantry outcomes.
export default function ImpactPage() {
  const { data: stats, loading, error, refetch } = useApiQuery(() => impactService.community(), [], "Couldn't load the impact report.");

  if (loading && !stats) return <PageLoader />;
  if (error || !stats) return <ErrorState message={error ?? "No data yet."} onRetry={refetch} />;

  const maxArea = Math.max(1, ...stats.topAreas.map((area) => area.shared));
  const lastWeeks = stats.weekly.slice(-4).reduce((sum, week) => sum + week.kg, 0);
  const prevWeeks = stats.weekly.slice(0, 4).reduce((sum, week) => sum + week.kg, 0);
  const growth = prevWeeks > 0 ? Math.round(((lastWeeks - prevWeeks) / prevWeeks) * 100) : null;

  return (
    <>
      <section className="bg-forest-deep text-white">
        <div className="mx-auto max-w-[1240px] px-4 py-14 md:px-8 md:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sprout">Impact report · live</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            <CountUp value={stats.kgSaved} format={(n) => formatKg(Math.round(n))} /> of food kept out of the bin.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/70">
            That's about <strong className="text-white">{stats.meals.toLocaleString()} meals</strong> and{" "}
            <strong className="text-white">{Math.round(stats.co2eKg).toLocaleString()} kg of CO₂e</strong> that never reached the
            atmosphere{growth !== null && growth > 0 ? `, and the last four weeks were up ${growth}% on the four before` : ""}.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile tone="dark" icon={<HandHeart className="h-5 w-5" />} value={<CountUp value={stats.donationsShared} />} label="Handovers completed" />
            <StatTile tone="dark" icon={<Package className="h-5 w-5" />} value={<CountUp value={stats.activeListings} />} label="Listings live now" hint={`${stats.rescueToday} must go today`} />
            <StatTile tone="dark" icon={<Users className="h-5 w-5" />} value={<CountUp value={stats.members} />} label="Members" />
            <StatTile tone="dark" icon={<Building2 className="h-5 w-5" />} value={<CountUp value={stats.partners} />} label="Businesses & organisations" />
          </div>
        </div>
      </section>

      <div className="mx-auto mt-12 grid max-w-[1240px] gap-6 px-4 md:px-8 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="rounded-[32px] bg-white p-6 shadow-card ring-1 ring-forest/5 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-forest">Food saved each week</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Pantry items used or given away, plus listings collected. Last 8 weeks.</p>
          <div className="mt-8">
            <WeeklyChart weekly={stats.weekly} />
          </div>
        </Reveal>

        <Reveal delay={100} className="rounded-[32px] bg-white p-6 shadow-card ring-1 ring-forest/5 sm:p-8">
          <h2 className="font-serif text-2xl font-semibold text-forest">Most generous areas</h2>
          <p className="mt-1 text-sm text-on-surface-variant">By handovers completed.</p>
          {stats.topAreas.length === 0 ? (
            <p className="mt-6 text-sm text-on-surface-variant">The first handovers will show up here.</p>
          ) : (
            <ol className="mt-6 space-y-4">
              {stats.topAreas.map((area, index) => (
                <li key={area.area}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-semibold text-on-surface">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint text-[11px] font-bold text-forest">{index + 1}</span>
                      <MapPin className="h-3.5 w-3.5 text-leaf" /> {area.area}
                    </span>
                    <span className="text-on-surface-variant">
                      {area.shared} · {formatKg(area.kg)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-leaf" style={{ width: `${(area.shared / maxArea) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Reveal>
      </div>

      <div className="mx-auto mt-6 grid max-w-[1240px] gap-4 px-4 md:grid-cols-3 md:px-8">
        <StatTile icon={<Leaf className="h-5 w-5" />} value={formatKg(stats.kgSaved)} label="Food saved" hint="Weights given by donors and pantry users" />
        <StatTile icon={<Utensils className="h-5 w-5" />} value={stats.meals.toLocaleString()} label="Meals' worth" hint={`At ${KG_PER_MEAL} kg per meal`} />
        <StatTile icon={<Cloud className="h-5 w-5" />} value={`${Math.round(stats.co2eKg).toLocaleString()} kg`} label="CO₂e avoided" hint={`At ${CO2E_PER_KG} kg CO₂e per kg of food`} />
      </div>

      <section className="mx-auto mt-12 max-w-[1240px] px-4 md:px-8">
        <div className="rounded-[32px] bg-surface-low p-6 sm:p-8">
          <h2 className="font-serif text-xl font-semibold text-forest">How we count</h2>
          <ul className="mt-3 grid gap-3 text-sm text-on-surface-variant md:grid-cols-3">
            <li>
              <strong className="text-on-surface">Only real outcomes.</strong> A listing counts once the donor confirms the handover
              with the collector's pickup code; a pantry item counts once it's marked used or given away.
            </li>
            <li>
              <strong className="text-on-surface">No double counting.</strong> Food listed from a pantry is counted once, through the
              pantry, however it was handed over.
            </li>
            <li>
              <strong className="text-on-surface">Conservative factors.</strong> {CO2E_PER_KG} kg CO₂e per kg of food and {KG_PER_MEAL} kg
              per meal, in line with WRAP and FAO estimates. Weights are optional, so true totals are higher.
            </li>
          </ul>
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button to="/share" size="lg">
            Add to these numbers
          </Button>
          <Button to="/register?type=business" variant="outline" size="lg">
            Partner with WasteLess
          </Button>
        </div>
      </section>
    </>
  );
}
