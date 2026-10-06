import { useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  ChefHat,
  Clock,
  Cloud,
  HandHeart,
  HeartHandshake,
  Leaf,
  MapPin,
  MessageCircleHeart,
  Refrigerator,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
  Utensils,
} from "lucide-react";
import { donationService } from "../API/services/donationService";
import { impactService } from "../API/services/impactService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { useAuth } from "../Context/AuthContext";
import Button from "../Components/Button";
import DonationCard from "../Components/DonationCard";
import Reveal from "../Components/Reveal";
import { CardSkeleton } from "../Components/Feedback";
import { CountUp, StatTile, WeeklyChart } from "../Components/Impact";
import { AccountBadge, ExpiryBadge } from "../Components/Badges";
import { cx, formatKg } from "../utils/format";

// The landing page doubles as the pitch: the problem, live proof that
// WasteLess works (real numbers from the API), how it works for each side,
// and why businesses and food banks should join.

// Global figures, cited on the page.
const PROBLEM = [
  {
    figure: "1.05 billion",
    unit: "tonnes",
    text: "of food were wasted worldwide in 2022, about a fifth of all food available to people.",
    source: "UNEP Food Waste Index Report 2024",
  },
  {
    figure: "783 million",
    unit: "people",
    text: "faced hunger in the same year. The food exists; it just isn't reaching them.",
    source: "UNEP / FAO, 2024",
  },
  {
    figure: "8–10%",
    unit: "of emissions",
    text: "of global greenhouse gases come from food that's lost or wasted, almost five times aviation.",
    source: "UNEP Food Waste Index Report 2024",
  },
];

const STEPS = {
  share: [
    { icon: <Sparkles className="h-5 w-5" />, title: "Snap and list in a minute", text: "A photo, what it is, best-before date and where to collect it. Restaurants and shops can list in bulk." },
    { icon: <MessageCircleHeart className="h-5 w-5" />, title: "Choose who gets it", text: "People and food banks nearby send a request with a message. You accept the one that suits you." },
    { icon: <ShieldCheck className="h-5 w-5" />, title: "Hand over safely", text: "Contact details are shared only after you accept. Confirm the pickup with their 4-digit code." },
  ],
  receive: [
    { icon: <Search className="h-5 w-5" />, title: "Find food near you", text: "Browse by area and category, or open Rescue today for food that must go before midnight." },
    { icon: <HandHeart className="h-5 w-5" />, title: "Ask for it", text: "Send a short request. Food banks and shelters can collect for many people at once." },
    { icon: <Utensils className="h-5 w-5" />, title: "Collect and say thanks", text: "Show your pickup code, enjoy the food, and leave a note that builds the donor's reputation." },
  ],
};

function Hero() {
  const { data: stats } = useApiQuery(() => impactService.community(), [], "");
  const { data: recent } = useApiQuery(() => donationService.browse({ limit: 3 }), [], "");
  const cards = recent?.items ?? [];

  return (
    <section className="relative overflow-hidden bg-forest text-white">
      {/* Soft light behind the headline. */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-leaf/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-48 right-0 h-[480px] w-[480px] rounded-full bg-sprout/15 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-[1240px] gap-12 px-4 pb-20 pt-14 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-28 lg:pt-20">
        <div className="motion-safe:animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-sprout ring-1 ring-white/15">
            <span className="h-2 w-2 rounded-full bg-sprout motion-safe:animate-pulse" />
            {stats ? `${stats.activeListings} listings live right now` : "Live in Lagos"}
          </span>
          <h1 className="mt-6 font-serif text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Good food shouldn't end up <span className="italic text-sprout">in the bin.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
            WasteLess connects households, restaurants and food banks to share surplus food with people nearby, and keeps every
            kitchen one step ahead of its expiry dates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/browse" variant="sprout" size="lg">
              <Search className="h-4.5 w-4.5" /> Find food near you
            </Button>
            <Button to="/share" variant="light" size="lg">
              Share surplus food <ArrowRight className="h-4.5 w-4.5" />
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/70">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-sprout" /> Verified handovers
            </span>
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-sprout" /> Businesses &amp; food banks welcome
            </span>
            <span className="inline-flex items-center gap-2">
              <Leaf className="h-4.5 w-4.5 text-sprout" /> Free, always
            </span>
          </div>
        </div>

        {/* A stack of real listings, gently floating. */}
        <div className="relative mx-auto h-[420px] w-full max-w-md lg:h-[500px]" aria-hidden="true">
          {cards.slice(0, 3).map((card, index) => (
            <div
              key={card.id}
              className={cx(
                "absolute w-64 overflow-hidden rounded-3xl bg-white text-on-surface shadow-float motion-safe:animate-float sm:w-72",
                index === 0 && "left-0 top-6 -rotate-6",
                index === 1 && "right-0 top-24 rotate-3 [animation-delay:1.5s]",
                index === 2 && "bottom-0 left-6 -rotate-1 [animation-delay:3s]",
              )}
            >
              <img src={card.image} alt="" className="h-36 w-full object-cover" />
              <div className="p-4">
                <ExpiryBadge date={card.expiryDate} />
                <div className="mt-2 line-clamp-1 font-semibold">{card.title}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <MapPin className="h-3.5 w-3.5" /> {card.location}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                  {card.donor.displayName} <AccountBadge type={card.donor.accountType} />
                </div>
              </div>
            </div>
          ))}
          {cards.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center rounded-[40px] bg-white/5 ring-1 ring-white/10">
              <Leaf className="h-24 w-24 text-sprout/60" />
            </div>
          )}
          {stats && (
            <div className="absolute -bottom-6 -right-2 z-10 rounded-3xl bg-sprout px-5 py-4 text-forest-deep shadow-float motion-safe:animate-fade-up">
              <div className="text-xs font-bold uppercase tracking-wider">Saved so far</div>
              <div className="font-serif text-3xl font-semibold">
                <CountUp value={stats.kgSaved} format={(n) => formatKg(Math.round(n))} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function LiveNumbers() {
  const { data: stats } = useApiQuery(() => impactService.community(), [], "");
  if (!stats) return null;
  return (
    <section className="relative z-10 mx-auto -mt-10 max-w-[1240px] px-4 md:px-8">
      <div className="grid grid-cols-2 gap-3 rounded-[32px] bg-white p-3 shadow-lift ring-1 ring-forest/5 sm:p-4 lg:grid-cols-4">
        {[
          { icon: <Utensils className="h-5 w-5" />, value: stats.meals, label: "meals' worth saved" },
          { icon: <HandHeart className="h-5 w-5" />, value: stats.donationsShared, label: "handovers completed" },
          { icon: <Cloud className="h-5 w-5" />, value: stats.co2eKg, label: "kg CO₂e avoided", hint: "estimate" },
          { icon: <Users className="h-5 w-5" />, value: stats.members, label: "members", hint: `${stats.partners} businesses & organisations` },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl bg-surface-low p-5">
            <div className="flex items-center gap-2 text-leaf">{item.icon}</div>
            <div className="mt-3 font-serif text-3xl font-semibold text-forest sm:text-4xl">
              <CountUp value={item.value} />
            </div>
            <div className="mt-0.5 text-sm font-medium text-on-surface-variant">{item.label}</div>
            {item.hint && <div className="text-[11px] text-outline">{item.hint}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function RescueToday() {
  const { data, loading } = useApiQuery(() => donationService.browse({ today: true, limit: 8 }), [], "");
  const items = data?.items ?? [];
  if (!loading && items.length === 0) return null;

  return (
    <section className="mx-auto mt-20 max-w-[1240px] px-4 md:px-8">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-clay px-3 py-1 text-xs font-bold text-white">
            <Timer className="h-3.5 w-3.5" /> Ends at midnight
          </span>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-forest sm:text-4xl">Rescue today</h2>
          <p className="mt-1 text-on-surface-variant">Food that has to find a home before the day is out.</p>
        </div>
        <Button to="/browse?today=1" variant="outline">
          See all {data ? `(${data.total})` : ""} <ArrowRight className="h-4 w-4" />
        </Button>
      </Reveal>
      <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="w-72 shrink-0 md:w-auto">
                <CardSkeleton />
              </div>
            ))
          : items.slice(0, 4).map((donation) => (
              <DonationCard key={donation.id} donation={donation} className="w-72 shrink-0 snap-start md:w-auto" />
            ))}
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="mx-auto mt-24 max-w-[1240px] px-4 md:px-8">
      <Reveal className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay">The problem</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-forest sm:text-5xl">
          We throw away a fifth of our food while millions go hungry.
        </h2>
        <p className="mt-4 text-lg text-on-surface-variant">
          Most of it is wasted at home and in food businesses, one forgotten loaf and one cancelled event at a time. That's
          exactly the scale WasteLess works at.
        </p>
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PROBLEM.map((item, index) => (
          <Reveal key={item.figure} delay={index * 90} className="rounded-[32px] bg-white p-7 shadow-card ring-1 ring-forest/5">
            <div className="font-serif text-5xl font-semibold tracking-tight text-forest">{item.figure}</div>
            <div className="text-sm font-bold uppercase tracking-wider text-leaf">{item.unit}</div>
            <p className="mt-4 text-on-surface-variant">{item.text}</p>
            <p className="mt-4 text-[11px] text-outline">Source: {item.source}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const [side, setSide] = useState<"share" | "receive">("share");
  return (
    <section className="mx-auto mt-24 max-w-[1240px] px-4 md:px-8">
      <div className="rounded-[40px] bg-mint px-5 py-12 sm:px-10 lg:px-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf">How it works</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-forest sm:text-4xl">Three steps from surplus to someone's plate</h2>
          </div>
          <div className="inline-flex rounded-full bg-white p-1 shadow-card" role="tablist">
            {(["share", "receive"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={side === key}
                onClick={() => setSide(key)}
                className={cx(
                  "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                  side === key ? "bg-forest text-white" : "text-on-surface-variant hover:text-forest",
                )}
              >
                {key === "share" ? "I have food" : "I need food"}
              </button>
            ))}
          </div>
        </Reveal>
        <ol key={side} className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS[side].map((step, index) => (
            <li key={step.title} className="relative rounded-[28px] bg-white p-6 shadow-card motion-safe:animate-fade-up" style={{ animationDelay: `${index * 80}ms` }}>
              <span className="absolute right-6 top-5 font-serif text-5xl font-semibold text-mint">{index + 1}</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-sprout">{step.icon}</div>
              <h3 className="mt-5 text-lg font-semibold text-forest">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// A static picture of the pantry, to show what it does before signing up.
function PantryShowcase() {
  const { isAuthenticated } = useAuth();
  const items = [
    { name: "Spinach (efo)", label: "Use today", tone: "bg-clay text-white" },
    { name: "Tomatoes", label: "Use by tomorrow", tone: "bg-amber-soft text-amber" },
    { name: "Bread", label: "Use within 2 days", tone: "bg-amber-soft text-amber" },
    { name: "Eggs", label: "Use within 9 days", tone: "bg-mint text-leaf" },
  ];
  return (
    <section className="mx-auto mt-24 grid max-w-[1240px] gap-12 px-4 md:px-8 lg:grid-cols-2 lg:items-center">
      <Reveal>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf">Your kitchen, on a timer</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-forest sm:text-5xl">Waste starts at home. So does the fix.</h2>
        <p className="mt-4 text-lg text-on-surface-variant">
          Log what's in your fridge in seconds. WasteLess counts down every best-before date, suggests recipes that use up what's
          about to turn, and lets you share anything you won't get to in one tap.
        </p>
        <ul className="mt-6 space-y-3">
          {[
            [<Clock key="c" className="h-5 w-5" />, "Colour-coded expiry, soonest first"],
            [<ChefHat key="h" className="h-5 w-5" />, "“Use it up” recipe ideas from what's expiring"],
            [<HeartHandshake key="s" className="h-5 w-5" />, "Turn any item into a listing for your neighbours"],
          ].map(([icon, text]) => (
            <li key={String(text)} className="flex items-center gap-3 font-medium text-on-surface">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-leaf">{icon}</span>
              {text}
            </li>
          ))}
        </ul>
        <Button to={isAuthenticated ? "/pantry" : "/register"} className="mt-8" size="lg">
          <Refrigerator className="h-4.5 w-4.5" /> {isAuthenticated ? "Open my pantry" : "Start my pantry"}
        </Button>
      </Reveal>
      <Reveal delay={120} className="relative">
        <div className="rounded-[36px] bg-white p-5 shadow-float ring-1 ring-forest/5 sm:p-7">
          <div className="flex items-center justify-between">
            <span className="font-serif text-xl font-semibold text-forest">My pantry</span>
            <span className="rounded-full bg-clay-soft px-3 py-1 text-xs font-bold text-clay">3 expiring soon</span>
          </div>
          <ul className="mt-4 space-y-2.5">
            {items.map((item) => (
              <li key={item.name} className="flex items-center justify-between rounded-2xl bg-surface-low px-4 py-3">
                <span className="font-medium">{item.name}</span>
                <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-bold", item.tone)}>{item.label}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-3xl bg-forest p-5 text-white">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sprout">
              <ChefHat className="h-4 w-4" /> Use it up tonight
            </div>
            <div className="mt-2 font-serif text-xl font-semibold">Efo riro with tomato stew</div>
            <div className="mt-1 text-sm text-white/70">Uses spinach and tomatoes · 30 minutes</div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Partners() {
  return (
    <section className="mx-auto mt-24 max-w-[1240px] px-4 md:px-8">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf">Built for scale</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-forest sm:text-4xl">From one kitchen to a whole city</h2>
      </Reveal>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Reveal className="relative overflow-hidden rounded-[36px] bg-forest p-8 text-white sm:p-10">
          <Building2 className="h-10 w-10 text-sprout" />
          <h3 className="mt-6 font-serif text-2xl font-semibold sm:text-3xl">Restaurants, caterers &amp; shops</h3>
          <p className="mt-3 max-w-md text-white/75">
            Turn end-of-day surplus into community goodwill instead of disposal costs. List in bulk, get collected by verified food
            banks, and track every kilo you've kept out of landfill for your sustainability reporting.
          </p>
          <Button to="/register?type=business" variant="sprout" className="mt-8">
            Join as a business <ArrowRight className="h-4 w-4" />
          </Button>
        </Reveal>
        <Reveal delay={100} className="relative overflow-hidden rounded-[36px] bg-sprout-soft p-8 sm:p-10">
          <HeartHandshake className="h-10 w-10 text-forest" />
          <h3 className="mt-6 font-serif text-2xl font-semibold text-forest sm:text-3xl">Food banks, shelters &amp; communities</h3>
          <p className="mt-3 max-w-md text-on-surface-variant">
            See surplus as it's posted, request what you can redistribute, and collect for many families in one trip. Your thank-you
            notes help donors choose you again.
          </p>
          <Button to="/register?type=organisation" className="mt-8">
            Join as an organisation <ArrowRight className="h-4 w-4" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

function ImpactTeaser() {
  const { data: stats } = useApiQuery(() => impactService.community(), [], "");
  if (!stats) return null;
  return (
    <section className="mx-auto mt-24 max-w-[1240px] px-4 md:px-8">
      <Reveal className="grid gap-8 rounded-[40px] bg-forest-deep p-6 text-white sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sprout">Measured, not guessed</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">Every handover counts</h2>
          <p className="mt-3 text-white/70">
            Impact is calculated from real pickups and pantry outcomes, never self-reported totals. Here's the last eight weeks.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <StatTile tone="dark" icon={<Leaf className="h-5 w-5" />} value={formatKg(stats.kgSaved)} label="Food saved" />
            <StatTile tone="dark" icon={<Cloud className="h-5 w-5" />} value={`${Math.round(stats.co2eKg)} kg`} label="CO₂e avoided" hint="estimate" />
          </div>
          <Button to="/impact" variant="sprout" className="mt-6">
            Full impact report <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="rounded-[28px] bg-white/5 p-5 ring-1 ring-white/10 sm:p-7">
          <WeeklyChart weekly={stats.weekly} tone="dark" />
        </div>
      </Reveal>
    </section>
  );
}

function FinalCta() {
  const { isAuthenticated } = useAuth();
  return (
    <section className="mx-auto mt-24 max-w-[1240px] px-4 text-center md:px-8">
      <Reveal>
        <h2 className="mx-auto max-w-3xl font-serif text-4xl font-semibold leading-tight text-forest sm:text-6xl">
          The cheapest meal is the one that already exists.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-on-surface-variant">Join your neighbours in keeping good food on plates.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to={isAuthenticated ? "/share" : "/register"} size="lg">
            {isAuthenticated ? "Share food now" : "Create a free account"}
          </Button>
          <Button to="/browse" variant="outline" size="lg">
            Browse food
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <LiveNumbers />
      <RescueToday />
      <Problem />
      <HowItWorks />
      <PantryShowcase />
      <Partners />
      <ImpactTeaser />
      <FinalCta />
    </>
  );
}
