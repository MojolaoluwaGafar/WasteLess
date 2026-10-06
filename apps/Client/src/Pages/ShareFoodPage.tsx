import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Check, MapPin, ShieldCheck } from "lucide-react";
import type { DonationFormValues, DonationSummary, FoodCategory } from "../types";
import { donationService } from "../API/services/donationService";
import { pantryService } from "../API/services/pantryService";
import { useAuth } from "../Context/AuthContext";
import Button from "../Components/Button";
import DonationCard from "../Components/DonationCard";
import ImageUpload from "../Components/ImageUpload";
import { ChipGroup, Field, TextArea, TextInput } from "../Components/Field";
import { PageLoader } from "../Components/Feedback";
import { apiErrorMessage, apiFieldErrors } from "../utils/apiError";
import { showToast } from "../utils/toastHelper";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS, cx } from "../utils/format";
import { dayPart, inputDaysFromToday, todayInput } from "../utils/expiry";

const PLEDGES = [
  "It's safe to eat and within its best-before date.",
  "It's been stored properly (chilled if it needs to be).",
  "I'd happily serve it to my own family.",
];

const UNITS = ["items", "portions", "kg", "loaves", "packs", "bags", "crates"];

const empty = (location: string): DonationFormValues => ({
  title: "",
  description: "",
  category: "produce",
  quantity: "1",
  unit: "items",
  weightKg: "",
  location,
  pickupNotes: "",
  expiryDate: inputDaysFromToday(1),
  image: "",
  imagePublicId: null,
});

// Making a listing (/share), editing one (/donations/:id/edit), or listing a
// pantry item (/share?fromPantry=<id>), which prefills the form and marks the
// item as given away once listed.
export default function ShareFoodPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const fromPantry = params.get("fromPantry");
  const { user } = useAuth();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const [values, setValues] = useState<DonationFormValues>(() => empty(user?.location ?? ""));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pledges, setPledges] = useState<boolean[]>(PLEDGES.map(() => editing));
  const [loading, setLoading] = useState(Boolean(id || fromPantry));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      donationService
        .get(id)
        .then((donation) => {
          if (!donation.isOwner) return navigate(`/donations/${id}`, { replace: true });
          setValues({
            title: donation.title,
            description: donation.description,
            category: donation.category,
            quantity: String(donation.quantity),
            unit: donation.unit,
            weightKg: donation.weightKg ? String(donation.weightKg) : "",
            location: donation.location,
            pickupNotes: donation.pickupNotes ?? "",
            expiryDate: dayPart(donation.expiryDate),
            image: donation.image,
            imagePublicId: null,
          });
        })
        .catch((err) => showToast(apiErrorMessage(err, "Couldn't load the listing."), "error"))
        .finally(() => setLoading(false));
    } else if (fromPantry) {
      pantryService
        .list("active")
        .then((items) => {
          const item = items.find((entry) => entry.id === fromPantry);
          if (!item) return;
          setValues((current) => ({
            ...current,
            title: item.name,
            category: item.category,
            quantity: String(item.quantity),
            unit: item.unit,
            weightKg: item.weightKg ? String(item.weightKg) : "",
            // A listing can't be in the past; pantry items sometimes are.
            expiryDate: dayPart(item.expiryDate) < todayInput() ? todayInput() : dayPart(item.expiryDate),
          }));
        })
        .finally(() => setLoading(false));
    }
  }, [id, fromPantry, navigate]);

  const set = <K extends keyof DonationFormValues>(key: K, value: DonationFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.image) next.image = "Add a photo of the food.";
    if (values.title.trim().length < 3) next.title = "Give it a title.";
    if (values.description.trim().length < 10) next.description = "Add a little more detail (at least 10 characters).";
    if (!(Number(values.quantity) > 0)) next.quantity = "Enter a quantity.";
    if (values.location.trim().length < 2) next.location = "Where can it be picked up?";
    if (!values.expiryDate || values.expiryDate < todayInput()) next.expiryDate = "Pick today or a later date.";
    if (values.weightKg && !(Number(values.weightKg) > 0)) next.weightKg = "Enter the weight in kg, or leave it empty.";
    return next;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate();
    if (!editing && pledges.some((ticked) => !ticked)) found.pledge = "Please confirm all three to share food.";
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    try {
      const saved = editing ? await donationService.update(id!, values) : await donationService.create(values, fromPantry);
      showToast(editing ? "Listing updated." : "You're sharing food! We'll email you when someone asks for it.");
      navigate(`/donations/${saved.id}`);
    } catch (err) {
      setErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "Couldn't save the listing."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  // What the card will look like on Browse.
  const preview: DonationSummary = {
    id: "preview",
    title: values.title || "Your food's title",
    category: values.category,
    quantity: Number(values.quantity) || 1,
    unit: values.unit || "items",
    location: values.location || "Your area",
    image: values.image || "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==",
    expiryDate: `${values.expiryDate || todayInput()}T00:00:00.000Z`,
    status: "available",
    donor: { id: user?.id ?? "", displayName: user?.orgName || user?.name.split(" ")[0] || "You", accountType: user?.accountType ?? "individual" },
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-8 md:px-8 md:pt-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-leaf">{editing ? "Edit listing" : "Share food"}</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-forest">{editing ? "Update your listing" : "What are you sharing?"}</h1>
      <p className="mt-2 text-on-surface-variant">
        {fromPantry ? "We've filled this in from your pantry. Add a photo and where to collect it." : "It takes about a minute. People nearby will see it straight away."}
      </p>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={submit} noValidate className="space-y-6">
          <ImageUpload
            value={values.image}
            error={errors.image}
            onChange={({ url, publicId }) => {
              setValues((current) => ({ ...current, image: url, imagePublicId: publicId }));
              setErrors((current) => ({ ...current, image: "" }));
            }}
          />

          <Field label="Title" htmlFor="title" error={errors.title}>
            <TextInput id="title" value={values.title} onChange={(event) => set("title", event.target.value)} maxLength={80} placeholder="e.g. 10 plates of jollof rice" hasError={Boolean(errors.title)} />
          </Field>

          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-on-surface">Category</span>
            <ChipGroup<FoodCategory>
              label="Category"
              className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
              value={values.category}
              onChange={(value) => set("category", value)}
              options={CATEGORIES.map((key) => ({ value: key, label: CATEGORY_LABELS[key], icon: <span aria-hidden="true">{CATEGORY_EMOJI[key]}</span> }))}
            />
          </div>

          <Field label="Description" htmlFor="description" error={errors.description} hint="What is it, how was it stored, any allergens (nuts, dairy, gluten)?">
            <TextArea id="description" rows={4} value={values.description} onChange={(event) => set("description", event.target.value)} maxLength={600} hasError={Boolean(errors.description)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Quantity" htmlFor="quantity" error={errors.quantity}>
              <TextInput id="quantity" type="number" min={1} inputMode="decimal" value={values.quantity} onChange={(event) => set("quantity", event.target.value)} hasError={Boolean(errors.quantity)} />
            </Field>
            <Field label="Unit" htmlFor="unit">
              <TextInput id="unit" list="units" value={values.unit} onChange={(event) => set("unit", event.target.value)} maxLength={20} />
              <datalist id="units">
                {UNITS.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </Field>
            <Field label="Weight (kg)" htmlFor="weightKg" optional error={errors.weightKg} hint="Counts toward impact">
              <TextInput id="weightKg" type="number" min={0} step="0.1" inputMode="decimal" value={values.weightKg} onChange={(event) => set("weightKg", event.target.value)} placeholder="2.5" />
            </Field>
          </div>

          <Field label="Best before" htmlFor="expiryDate" error={errors.expiryDate}>
            <div className="flex flex-wrap gap-2">
              {[
                ["Today", 0],
                ["Tomorrow", 1],
                ["In 3 days", 3],
                ["In a week", 7],
              ].map(([label, days]) => {
                const day = inputDaysFromToday(days as number);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => set("expiryDate", day)}
                    className={cx(
                      "h-10 rounded-full px-4 text-sm font-semibold",
                      values.expiryDate === day ? "bg-forest text-white" : "bg-white text-on-surface-variant ring-1 ring-forest/10",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
              <input
                id="expiryDate"
                type="date"
                min={todayInput()}
                value={values.expiryDate}
                onChange={(event) => set("expiryDate", event.target.value)}
                className="h-10 rounded-full border border-forest/10 bg-white px-4 text-sm font-semibold text-forest"
              />
            </div>
          </Field>

          <Field label="Pickup area" htmlFor="location" error={errors.location} hint="An area or landmark is enough. Share the exact address once you accept someone.">
            <TextInput id="location" icon={<MapPin className="h-4.5 w-4.5" />} value={values.location} onChange={(event) => set("location", event.target.value)} maxLength={100} placeholder="e.g. Yaba, Lagos" hasError={Boolean(errors.location)} />
          </Field>

          <Field label="Pickup notes" htmlFor="pickupNotes" optional>
            <TextArea id="pickupNotes" rows={2} value={values.pickupNotes} onChange={(event) => set("pickupNotes", event.target.value)} maxLength={300} placeholder="e.g. Evenings after 6pm, bring a bag." />
          </Field>

          {!editing && (
            <fieldset className={cx("rounded-3xl p-5", errors.pledge ? "bg-error-container/50 ring-1 ring-error" : "bg-mint")}>
              <legend className="sr-only">Food safety pledge</legend>
              <div className="flex items-center gap-2 font-semibold text-forest">
                <ShieldCheck className="h-5 w-5 text-leaf" /> Food safety pledge
              </div>
              <div className="mt-3 space-y-2">
                {PLEDGES.map((text, index) => (
                  <label key={text} className="flex cursor-pointer items-start gap-3 text-sm text-on-surface">
                    <input
                      type="checkbox"
                      checked={pledges[index]}
                      onChange={(event) => {
                        setPledges((current) => current.map((value, i) => (i === index ? event.target.checked : value)));
                        setErrors((current) => ({ ...current, pledge: "" }));
                      }}
                      className="peer sr-only"
                    />
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-forest/30 bg-white text-white peer-checked:border-forest peer-checked:bg-forest peer-focus-visible:ring-2 peer-focus-visible:ring-leaf">
                      {pledges[index] && <Check className="h-3.5 w-3.5" />}
                    </span>
                    {text}
                  </label>
                ))}
              </div>
              {errors.pledge && (
                <p className="mt-3 text-xs font-medium text-error" role="alert">
                  {errors.pledge}
                </p>
              )}
            </fieldset>
          )}

          <Button type="submit" size="lg" block loading={saving}>
            {editing ? "Save changes" : "Share it"}
          </Button>
        </form>

        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-outline">Preview</p>
            <div className="pointer-events-none">
              <DonationCard donation={preview} />
            </div>
            <p className="mt-4 text-sm text-on-surface-variant">
              Clear photos and a specific title (“10 plates of jollof” rather than “food”) get requests fastest.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
