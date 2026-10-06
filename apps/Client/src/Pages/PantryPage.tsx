import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  Check,
  ChefHat,
  Clock,
  HandHeart,
  History,
  Lightbulb,
  Plus,
  Refrigerator,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import type { FoodCategory, PantryFormValues, PantryItem, PantryOutcome, RecipeIdea } from "../types";
import { pantryService } from "../API/services/pantryService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import Button from "../Components/Button";
import { ExpiryBadge } from "../Components/Badges";
import { ChipGroup, Field, TextInput } from "../Components/Field";
import { EmptyState, ErrorState, PageLoader } from "../Components/Feedback";
import { findTip, STORAGE_GUIDE } from "../data/storageGuide";
import { apiErrorMessage, apiFieldErrors } from "../utils/apiError";
import { showToast } from "../utils/toastHelper";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS, PANTRY_STATUS_LABELS, cx, formatKg, plural, timeAgo } from "../utils/format";
import { daysUntil, inputDaysFromToday } from "../utils/expiry";

const blank = (): PantryFormValues => ({ name: "", category: "produce", quantity: "1", unit: "items", weightKg: "", expiryDate: inputDaysFromToday(3) });

// Groups for the active list, most urgent first.
const GROUPS = [
  { key: "expired", title: "Past its date", hint: "Check it before eating, or log it as wasted so it counts.", test: (d: number) => d < 0 },
  { key: "today", title: "Use today", hint: "Cook it, freeze it or share it now.", test: (d: number) => d === 0 },
  { key: "soon", title: "Next few days", hint: "Plan these into this week's meals.", test: (d: number) => d > 0 && d <= 3 },
  { key: "later", title: "Later", hint: "", test: (d: number) => d > 3 },
];

function AddItemForm({ onAdded }: { onAdded: () => void }) {
  const [values, setValues] = useState<PantryFormValues>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [touchedDate, setTouchedDate] = useState(false);
  const [touchedCategory, setTouchedCategory] = useState(false);
  const tip = findTip(values.name);

  const setName = (name: string) => {
    const match = findTip(name);
    setValues((current) => ({
      ...current,
      name,
      // Fill in what the guide knows, unless the person already chose.
      category: match && !touchedCategory ? match.category : current.category,
      expiryDate: match && !touchedDate ? inputDaysFromToday(Math.min(match.days, 30)) : current.expiryDate,
    }));
    setErrors({});
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) return setErrors({ name: "What's the item?" });
    setSaving(true);
    try {
      await pantryService.create(values);
      showToast(`${values.name.trim()} added. We'll flag it before it expires.`);
      setValues(blank());
      setTouchedDate(false);
      setTouchedCategory(false);
      onAdded();
    } catch (err) {
      setErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "Couldn't add it."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-[32px] bg-white p-5 shadow-card ring-1 ring-forest/5 sm:p-6" noValidate>
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-forest">
        <Plus className="h-5 w-5 text-leaf" /> Add to pantry
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1.6fr_0.7fr_0.8fr]">
        <Field label="Item" htmlFor="pantry-name" error={errors.name}>
          <TextInput id="pantry-name" list="pantry-suggestions" value={values.name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Tomatoes" maxLength={80} hasError={Boolean(errors.name)} />
          <datalist id="pantry-suggestions">
            {STORAGE_GUIDE.map((entry) => (
              <option key={entry.name} value={entry.name} />
            ))}
          </datalist>
        </Field>
        <Field label="Quantity" htmlFor="pantry-qty">
          <TextInput id="pantry-qty" type="number" min={1} inputMode="decimal" value={values.quantity} onChange={(event) => setValues({ ...values, quantity: event.target.value })} />
        </Field>
        <Field label="Weight (kg)" htmlFor="pantry-kg" optional>
          <TextInput id="pantry-kg" type="number" min={0} step="0.1" inputMode="decimal" value={values.weightKg} onChange={(event) => setValues({ ...values, weightKg: event.target.value })} placeholder="0.5" />
        </Field>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-[13px] font-semibold text-on-surface">Category</span>
        <ChipGroup<FoodCategory>
          label="Category"
          className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0"
          value={values.category}
          onChange={(category) => {
            setTouchedCategory(true);
            setValues({ ...values, category });
          }}
          options={CATEGORIES.map((key) => ({ value: key, label: CATEGORY_LABELS[key], icon: <span aria-hidden="true">{CATEGORY_EMOJI[key]}</span> }))}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <Field label="Best before" htmlFor="pantry-date" className="mr-2">
          <input
            id="pantry-date"
            type="date"
            value={values.expiryDate}
            onChange={(event) => {
              setTouchedDate(true);
              setValues({ ...values, expiryDate: event.target.value });
            }}
            className="h-11 rounded-full border border-forest/10 bg-white px-4 text-sm font-semibold text-forest"
          />
        </Field>
        {[
          ["Today", 0],
          ["+3 days", 3],
          ["+1 week", 7],
          ["+1 month", 30],
        ].map(([label, days]) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              setTouchedDate(true);
              setValues({ ...values, expiryDate: inputDaysFromToday(days as number) });
            }}
            className={cx(
              "h-11 rounded-full px-4 text-sm font-semibold",
              values.expiryDate === inputDaysFromToday(days as number) ? "bg-forest text-white" : "bg-surface-low text-on-surface-variant",
            )}
          >
            {label}
          </button>
        ))}
        <Button type="submit" loading={saving} className="ml-auto" size="md">
          Add item
        </Button>
      </div>

      {tip && (
        <p className="mt-4 flex gap-2 rounded-2xl bg-mint px-4 py-3 text-sm text-forest">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
          <span>
            <strong>{tip.name}:</strong> {tip.storage.toLowerCase()}, keeps {tip.shelfLife.toLowerCase()}. {tip.tips[0]}
          </span>
        </p>
      )}
    </form>
  );
}

function ItemRow({ item, onChange }: { item: PantryItem; onChange: () => void }) {
  const [busy, setBusy] = useState<PantryOutcome | "delete" | null>(null);
  const tip = findTip(item.name);

  const resolve = async (outcome: PantryOutcome) => {
    setBusy(outcome);
    try {
      await pantryService.resolve(item.id, outcome);
      showToast(
        outcome === "wasted" ? `Logged. Knowing what gets wasted is the first step.` : `${item.name} saved from the bin!`,
        outcome === "wasted" ? "info" : "success",
      );
      onChange();
    } catch (err) {
      showToast(apiErrorMessage(err, "That didn't work."), "error");
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await pantryService.remove(item.id);
      onChange();
    } catch (err) {
      showToast(apiErrorMessage(err, "Couldn't remove it."), "error");
      setBusy(null);
    }
  };

  return (
    <li className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-forest/5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-low text-xl" aria-hidden="true">
            {CATEGORY_EMOJI[item.category]}
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-on-surface">{item.name}</div>
            <div className="text-xs text-on-surface-variant">
              {plural(item.quantity, item.unit === "items" ? "item" : item.unit, item.unit)}
              {item.weightKg ? ` · ${formatKg(item.weightKg)}` : ""}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <ExpiryBadge date={item.expiryDate} />
          <button type="button" onClick={remove} disabled={busy !== null} aria-label={`Remove ${item.name}`} className="rounded-full p-1.5 text-outline hover:bg-surface-low hover:text-error">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {tip && daysUntil(item.expiryDate) <= 1 && daysUntil(item.expiryDate) >= 0 && (
        <p className="mt-3 text-xs text-on-surface-variant">
          <Lightbulb className="mr-1 inline h-3.5 w-3.5 text-leaf" />
          {tip.tips[tip.tips.length - 1]}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => resolve("used")} loading={busy === "used"} disabled={busy !== null}>
          <Check className="h-4 w-4" /> Used it
        </Button>
        {daysUntil(item.expiryDate) >= 0 && (
          <Button size="sm" variant="secondary" to={`/share?fromPantry=${item.id}`}>
            <HandHeart className="h-4 w-4" /> Share it
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => resolve("donated")} loading={busy === "donated"} disabled={busy !== null}>
          Gave it away
        </Button>
        <Button size="sm" variant="ghost" onClick={() => resolve("wasted")} loading={busy === "wasted"} disabled={busy !== null} className="text-clay">
          Wasted
        </Button>
      </div>
    </li>
  );
}

function Ideas({ hasItems }: { hasItems: boolean }) {
  const [ideas, setIdeas] = useState<RecipeIdea[] | null>(null);
  const [basedOn, setBasedOn] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await pantryService.ideas();
      setIdeas(result.ideas);
      setBasedOn(result.basedOn);
    } catch (err) {
      showToast(apiErrorMessage(err, "Couldn't get ideas right now."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ideas" className="scroll-mt-28 overflow-hidden rounded-[32px] bg-forest p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sprout">
            <ChefHat className="h-4 w-4" /> Use it up
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">What can I cook before it goes off?</h2>
          <p className="mt-1 max-w-lg text-sm text-white/70">Recipe ideas built around whatever in your pantry expires first.</p>
        </div>
        <Button variant="sprout" onClick={load} loading={loading} disabled={!hasItems}>
          <Sparkles className="h-4 w-4" /> {ideas ? "New ideas" : "Get ideas"}
        </Button>
      </div>
      {!hasItems && <p className="mt-4 text-sm text-white/60">Add a few items to your pantry first.</p>}
      {ideas && ideas.length > 0 && (
        <>
          <p className="mt-5 text-xs text-white/60">Based on {basedOn.slice(0, 5).join(", ")}{basedOn.length > 5 ? "…" : ""}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {ideas.map((idea) => (
              <article key={idea.title} className="rounded-3xl bg-white p-5 text-on-surface motion-safe:animate-fade-up">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-[11px] font-bold text-leaf">
                    <Clock className="h-3 w-3" /> {idea.minutes} min
                  </span>
                  {idea.source === "ai" && <span className="text-[10px] font-bold uppercase tracking-wider text-outline">AI idea</span>}
                </div>
                <h3 className="mt-3 font-serif text-lg font-semibold text-forest">{idea.title}</h3>
                <p className="mt-1 text-xs font-semibold text-leaf">Uses {idea.uses.join(", ")}</p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm text-on-surface-variant">
                  {idea.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HistoryList() {
  const { data, loading, error, refetch } = useApiQuery(() => pantryService.list("history"), [], "Couldn't load your history.");
  if (loading) return <PageLoader />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data?.length) return <EmptyState icon={<History className="h-7 w-7" />} title="No history yet" message="Items you use, give away or waste show up here." />;

  const undo = async (item: PantryItem) => {
    try {
      await pantryService.undo(item.id);
      showToast(`${item.name} is back in your pantry.`, "info");
      void refetch();
    } catch (err) {
      showToast(apiErrorMessage(err, "Couldn't undo that."), "error");
    }
  };

  const tones: Record<string, string> = { used: "bg-mint text-leaf", donated: "bg-sprout-soft text-forest", wasted: "bg-clay-soft text-clay" };
  return (
    <ul className="space-y-2">
      {data.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 rounded-3xl bg-white px-4 py-3 shadow-card ring-1 ring-forest/5">
          <div className="flex min-w-0 items-center gap-3">
            <span aria-hidden="true">{CATEGORY_EMOJI[item.category]}</span>
            <div className="min-w-0">
              <div className="truncate font-medium">{item.name}</div>
              <div className="text-xs text-outline">{item.resolvedAt ? timeAgo(item.resolvedAt) : ""}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cx("rounded-full px-2.5 py-1 text-[11px] font-bold", tones[item.status])}>{PANTRY_STATUS_LABELS[item.status]}</span>
            <button type="button" onClick={() => undo(item)} aria-label={`Undo ${item.name}`} className="rounded-full p-2 text-outline hover:bg-surface-low hover:text-forest">
              <Undo2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PantryPage() {
  const [tab, setTab] = useState<"active" | "history">("active");
  const { data: items, loading, error, refetch } = useApiQuery(() => pantryService.list("active"), [], "Couldn't load your pantry.");

  const groups = useMemo(
    () => GROUPS.map((group) => ({ ...group, items: (items ?? []).filter((item) => group.test(daysUntil(item.expiryDate))) })),
    [items],
  );
  const urgent = groups.filter((group) => group.key !== "later").reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-8 md:px-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf">Your kitchen</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-forest">My pantry</h1>
          <p className="mt-1 text-on-surface-variant">
            {items?.length
              ? urgent
                ? `${plural(urgent, "item")} need${urgent === 1 ? "s" : ""} attention soon.`
                : "Everything's fresh. Nice."
              : "Log what's in your fridge and cupboards; we'll count down every date."}
          </p>
        </div>
        <div className="inline-flex rounded-full bg-white p-1 shadow-card" role="tablist">
          {(["active", "history"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cx("rounded-full px-5 py-2 text-sm font-semibold", tab === key ? "bg-forest text-white" : "text-on-surface-variant")}
            >
              {key === "active" ? `In pantry${items ? ` (${items.length})` : ""}` : "History"}
            </button>
          ))}
        </div>
      </div>

      {tab === "history" ? (
        <div className="mt-8">
          <HistoryList />
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <AddItemForm onAdded={refetch} />
          {loading && !items ? (
            <PageLoader />
          ) : error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : !items?.length ? (
            <EmptyState
              icon={<Refrigerator className="h-7 w-7" />}
              title="Your pantry is empty"
              message="Start with what's in the fridge right now: the things you're most likely to forget."
            />
          ) : (
            groups
              .filter((group) => group.items.length)
              .map((group) => (
                <section key={group.key}>
                  <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className={cx("font-serif text-xl font-semibold", group.key === "today" ? "text-clay" : "text-forest")}>
                      {group.title} <span className="text-base text-on-surface-variant">({group.items.length})</span>
                    </h2>
                    {group.hint && <span className="hidden text-xs text-on-surface-variant sm:block">{group.hint}</span>}
                  </div>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {group.items.map((item) => (
                      <ItemRow key={item.id} item={item} onChange={refetch} />
                    ))}
                  </ul>
                </section>
              ))
          )}
          <Ideas hasItems={Boolean(items?.length)} />
          <p className="text-center text-sm text-on-surface-variant">
            Not sure how to store something? <Link to="/tips" className="font-semibold text-leaf hover:underline">Open the storage guide</Link>
          </p>
        </div>
      )}
    </div>
  );
}
