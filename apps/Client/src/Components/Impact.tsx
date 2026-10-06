import { useEffect, useRef, useState, type ReactNode } from "react";
import { Award, Flame, HandHeart, Leaf, Sprout, Trophy, Utensils } from "lucide-react";
import type { CommunityStats, Impact } from "../types";
import { cx, formatKg } from "../utils/format";

// Numbers, charts and milestones for the impact sections.

// Counts up from 0 the first time it scrolls into view. People who ask for
// reduced motion see the final number straight away.
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString() }: { value: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      setShown(value);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / 1200);
        setShown(value * (1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    if (ref.current) observer.observe(ref.current);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={ref}>{format(shown)}</span>;
}

export function StatTile({
  icon,
  value,
  label,
  hint,
  tone = "light",
  className,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  hint?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      className={cx(
        "rounded-3xl p-5",
        dark ? "bg-white/8 text-white ring-1 ring-white/12" : "bg-white shadow-card ring-1 ring-forest/5",
        className,
      )}
    >
      <div className={cx("flex h-10 w-10 items-center justify-center rounded-2xl", dark ? "bg-sprout text-forest-deep" : "bg-mint text-leaf")}>
        {icon}
      </div>
      <div className={cx("mt-4 font-serif text-3xl font-semibold tracking-tight sm:text-4xl", dark ? "text-white" : "text-forest")}>{value}</div>
      <div className={cx("mt-1 text-sm font-semibold", dark ? "text-white/85" : "text-on-surface")}>{label}</div>
      {hint && <div className={cx("mt-0.5 text-xs", dark ? "text-white/60" : "text-on-surface-variant")}>{hint}</div>}
    </div>
  );
}

// Food saved per week as bars. Plain SVG: no chart library to download.
export function WeeklyChart({ weekly, tone = "light" }: { weekly: CommunityStats["weekly"]; tone?: "light" | "dark" }) {
  const max = Math.max(1, ...weekly.map((week) => week.kg));
  const dark = tone === "dark";
  return (
    <div>
      <div className="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label="Kilograms of food saved per week, last 8 weeks">
        {weekly.map((week, index) => {
          const height = Math.max(4, (week.kg / max) * 100);
          const latest = index === weekly.length - 1;
          return (
            <div key={week.weekStart} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className={cx("text-[11px] font-bold opacity-0 transition-opacity group-hover:opacity-100", latest && "opacity-100", dark ? "text-sprout" : "text-leaf")}>
                {formatKg(week.kg)}
              </span>
              <div
                className={cx(
                  "w-full rounded-t-xl transition-all duration-700 motion-safe:animate-fade-up",
                  latest ? "bg-sprout" : dark ? "bg-white/25 group-hover:bg-white/40" : "bg-leaf/35 group-hover:bg-leaf/60",
                )}
                style={{ height: `${height}%`, animationDelay: `${index * 60}ms` }}
              />
            </div>
          );
        })}
      </div>
      <div className={cx("mt-2 flex gap-2 text-[10px] font-semibold sm:gap-3", dark ? "text-white/50" : "text-outline")}>
        {weekly.map((week) => (
          <span key={week.weekStart} className="flex-1 text-center">
            {new Date(`${week.weekStart}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </span>
        ))}
      </div>
    </div>
  );
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  reached: boolean;
  /** 0 to 1, for the progress bar on milestones not reached yet. */
  progress: number;
}

// Small goals that make the first weeks feel like progress.
export function milestonesFor(impact: Impact): Milestone[] {
  const goal = (value: number, target: number) => Math.min(1, value / target);
  return [
    { id: "first-save", title: "First save", description: "Use up or give away one pantry item", icon: <Sprout className="h-5 w-5" />, reached: impact.itemsSaved >= 1, progress: goal(impact.itemsSaved, 1) },
    { id: "first-share", title: "First share", description: "Have a listing collected", icon: <HandHeart className="h-5 w-5" />, reached: impact.donationsShared >= 1, progress: goal(impact.donationsShared, 1) },
    { id: "ten-kg", title: "10 kg rescued", description: "Save 10 kg of food from the bin", icon: <Leaf className="h-5 w-5" />, reached: impact.kgSaved >= 10, progress: goal(impact.kgSaved, 10) },
    { id: "fifty-meals", title: "50 meals", description: "Save the equivalent of 50 meals", icon: <Utensils className="h-5 w-5" />, reached: impact.meals >= 50, progress: goal(impact.meals, 50) },
    { id: "thanked", title: "Thanked", description: "Receive a thank-you note", icon: <Award className="h-5 w-5" />, reached: impact.thanksReceived >= 1, progress: goal(impact.thanksReceived, 1) },
    { id: "hero", title: "Community hero", description: "Share 10 listings", icon: <Trophy className="h-5 w-5" />, reached: impact.donationsShared >= 10, progress: goal(impact.donationsShared, 10) },
    { id: "streak", title: "Waste watcher", description: "Track 25 pantry items", icon: <Flame className="h-5 w-5" />, reached: impact.itemsTracked >= 25, progress: goal(impact.itemsTracked, 25) },
  ];
}

export function Milestones({ impact }: { impact: Impact }) {
  const items = milestonesFor(impact);
  const reached = items.filter((item) => item.reached).length;
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-xl font-semibold text-forest">Milestones</h2>
        <span className="text-xs font-semibold text-on-surface-variant">
          {reached} of {items.length}
        </span>
      </div>
      <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
        {items.map((item) => (
          <li
            key={item.id}
            className={cx(
              "w-36 shrink-0 rounded-3xl p-4 sm:w-auto",
              item.reached ? "bg-forest text-white shadow-lift" : "bg-white text-on-surface ring-1 ring-forest/8",
            )}
          >
            <div className={cx("flex h-10 w-10 items-center justify-center rounded-2xl", item.reached ? "bg-sprout text-forest-deep" : "bg-surface-container text-outline")}>
              {item.icon}
            </div>
            <div className="mt-3 text-sm font-bold">{item.title}</div>
            <div className={cx("mt-0.5 text-[11px] leading-snug", item.reached ? "text-white/70" : "text-on-surface-variant")}>{item.description}</div>
            {!item.reached && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-container">
                <div className="h-full rounded-full bg-leaf" style={{ width: `${Math.round(item.progress * 100)}%` }} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
