import { useState } from "react";
import { Clock, Lightbulb, Search, Snowflake } from "lucide-react";
import type { FoodCategory } from "../types";
import { STORAGE_GUIDE } from "../data/storageGuide";
import { ChipGroup } from "../Components/Field";
import { EmptyState } from "../Components/Feedback";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from "../utils/format";

// How to keep common foods fresh for longer. The same guide fills in the
// pantry form as people type.
export default function TipsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FoodCategory | "all">("all");

  const q = query.trim().toLowerCase();
  const tips = STORAGE_GUIDE.filter(
    (tip) =>
      (category === "all" || tip.category === category) &&
      (!q || tip.name.toLowerCase().includes(q) || tip.aliases.some((alias) => alias.includes(q))),
  );
  const used = CATEGORIES.filter((key) => STORAGE_GUIDE.some((tip) => tip.category === key));

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8 md:pt-12">
      <div className="rounded-[36px] bg-sprout-soft p-6 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf">Storage guide</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold text-forest sm:text-5xl">Make food last longer</h1>
        <p className="mt-2 max-w-xl text-on-surface-variant">
          Where to keep it, how long it lasts, and what to do when it's about to turn. Most waste at home is simply food stored the
          wrong way.
        </p>
        <div className="relative mt-6 max-w-lg">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-outline" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a food, e.g. plantain"
            aria-label="Search the storage guide"
            className="h-13 w-full rounded-full bg-white pl-11 pr-4 shadow-card placeholder:text-outline focus:outline-none focus:ring-4 focus:ring-leaf/20"
          />
        </div>
      </div>

      <ChipGroup<FoodCategory | "all">
        label="Category"
        className="no-scrollbar -mx-4 mt-6 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0"
        value={category}
        onChange={setCategory}
        options={[
          { value: "all", label: "All" },
          ...used.map((key) => ({ value: key, label: CATEGORY_LABELS[key], icon: <span aria-hidden="true">{CATEGORY_EMOJI[key]}</span> })),
        ]}
      />

      {tips.length === 0 ? (
        <EmptyState icon={<Lightbulb className="h-7 w-7" />} title="Not in the guide yet" message="Try another name, or check the packaging for storage advice." />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <article key={tip.name} className="rounded-[28px] bg-white p-6 shadow-card ring-1 ring-forest/5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-low text-xl" aria-hidden="true">
                  {CATEGORY_EMOJI[tip.category]}
                </span>
                <h2 className="font-serif text-xl font-semibold text-forest">{tip.name}</h2>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="sr-only">Storage</dt>
                  <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
                  <dd className="text-on-surface">{tip.storage}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="sr-only">Keeps for</dt>
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
                  <dd className="text-on-surface">{tip.shelfLife}</dd>
                </div>
              </dl>
              <ul className="mt-4 space-y-1.5 border-t border-forest/8 pt-4 text-sm text-on-surface-variant">
                {tip.tips.map((line) => (
                  <li key={line} className="flex gap-2">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
      <p className="mt-8 text-center text-xs text-outline">Times are typical. Always check food looks, smells and feels right before eating it.</p>
    </div>
  );
}
