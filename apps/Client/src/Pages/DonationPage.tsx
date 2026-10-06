import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  Hand,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Scale,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { Contact, DonationDetail, DonationRequest } from "../types";
import { donationService } from "../API/services/donationService";
import { requestService, type RequestAction } from "../API/services/requestService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { useAuth } from "../Context/AuthContext";
import Button from "../Components/Button";
import { TextArea } from "../Components/Field";
import { AccountBadge, ExpiryBadge, StatusBadge } from "../Components/Badges";
import { ConfirmDialog, ErrorState, PageLoader } from "../Components/Feedback";
import { apiErrorMessage, apiFieldErrors } from "../utils/apiError";
import { showToast } from "../utils/toastHelper";
import { CATEGORY_EMOJI, CATEGORY_LABELS, cx, formatKg, plural, timeAgo } from "../utils/format";
import { daysUntil, formatDay } from "../utils/expiry";

const QUICK_MESSAGES = [
  "I can collect today. Thank you!",
  "This would really help my family this week.",
  "We're a food bank and can collect for several families.",
];

// wa.me needs the number with its country code and no symbols. Nigerian
// numbers are often written 0803..., which becomes 234803...
function whatsappLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `234${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function ContactCard({ contact, title, listingTitle }: { contact: Contact; title: string; listingTitle: string }) {
  return (
    <div className="rounded-3xl bg-mint p-5">
      <div className="text-xs font-bold uppercase tracking-wider text-leaf">{title}</div>
      <div className="mt-1 font-semibold text-forest">{contact.name}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {contact.phone && (
          <>
            <Button href={whatsappLink(contact.phone, `Hi! It's about "${listingTitle}" on WasteLess.`)} size="sm">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <Button href={`tel:${contact.phone}`} size="sm" variant="outline">
              <Phone className="h-4 w-4" /> {contact.phone}
            </Button>
          </>
        )}
        <Button href={`mailto:${contact.email}`} size="sm" variant="outline">
          <Mail className="h-4 w-4" /> Email
        </Button>
      </div>
    </div>
  );
}

// Where a request is up to, for the person who made it.
function Timeline({ status }: { status: DonationRequest["status"] }) {
  const steps = [
    { key: "pending", label: "Requested" },
    { key: "accepted", label: "Accepted" },
    { key: "collected", label: "Collected" },
  ];
  const reached = status === "collected" ? 3 : status === "accepted" ? 2 : 1;
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, index) => (
        <li key={step.key} className="flex flex-1 items-center gap-2">
          <span
            className={cx(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              index < reached ? "bg-forest text-sprout" : "bg-surface-container text-outline",
            )}
          >
            {index < reached ? <Check className="h-4 w-4" /> : index + 1}
          </span>
          <span className={cx("text-xs font-semibold", index < reached ? "text-forest" : "text-outline")}>{step.label}</span>
          {index < steps.length - 1 && <span className={cx("h-0.5 flex-1 rounded", index < reached - 1 ? "bg-forest" : "bg-surface-container")} />}
        </li>
      ))}
    </ol>
  );
}

// ------------------------------------------------------------------ requester

function RequestPanel({ donation, onChange }: { donation: DonationDetail; onChange: () => void }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const mine = donation.myRequest;
  const expired = daysUntil(donation.expiryDate) < 0;

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!isAuthenticated) return navigate("/login", { state: { from: location.pathname } });
    setBusy(true);
    setError(undefined);
    try {
      await donationService.request(donation.id, message);
      showToast("Request sent. You'll get an email when they reply.");
      onChange();
    } catch (err) {
      setError(apiFieldErrors(err).message ?? apiErrorMessage(err, "Couldn't send your request."));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!mine) return;
    setBusy(true);
    try {
      await requestService.act(mine.id, "cancel");
      showToast("Request cancelled.", "info");
      setConfirmCancel(false);
      onChange();
    } catch (err) {
      showToast(apiErrorMessage(err, "Couldn't cancel."), "error");
    } finally {
      setBusy(false);
    }
  };

  const thank = async (event: FormEvent) => {
    event.preventDefault();
    if (!mine) return;
    setBusy(true);
    try {
      await requestService.thank(mine.id, note);
      showToast("Thank you sent. It'll show on their profile.");
      onChange();
    } catch (err) {
      showToast(apiErrorMessage(err, "Couldn't send your note."), "error");
    } finally {
      setBusy(false);
    }
  };

  // An open or finished request of their own.
  if (mine && ["pending", "accepted", "collected"].includes(mine.status)) {
    return (
      <div className="space-y-4">
        <Timeline status={mine.status} />
        {mine.status === "pending" && (
          <div className="rounded-3xl bg-amber-soft p-5 text-amber">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="h-5 w-5" /> Waiting for {donation.donor.displayName}
            </div>
            <p className="mt-1 text-sm">We've emailed them your request. You'll hear back by email, or check here.</p>
          </div>
        )}
        {mine.status === "accepted" && (
          <>
            <div className="rounded-3xl bg-forest p-6 text-center text-white">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-sprout">Your pickup code</div>
              <div className="mt-2 font-mono text-5xl font-bold tracking-[0.3em]">{mine.pickupCode}</div>
              <p className="mt-2 text-sm text-white/70">Show this to the donor when you collect. They'll enter it to confirm.</p>
            </div>
            {donation.donorContact && <ContactCard contact={donation.donorContact} title="Arrange pickup with" listingTitle={donation.title} />}
          </>
        )}
        {mine.status === "collected" &&
          (mine.thankYouNote ? (
            <div className="rounded-3xl bg-mint p-5">
              <div className="flex items-center gap-2 font-semibold text-forest">
                <CircleCheck className="h-5 w-5 text-leaf" /> Collected. You said thanks:
              </div>
              <p className="mt-2 font-serif italic text-forest">&ldquo;{mine.thankYouNote}&rdquo;</p>
            </div>
          ) : (
            <form onSubmit={thank} className="rounded-3xl bg-mint p-5">
              <div className="flex items-center gap-2 font-semibold text-forest">
                <CircleCheck className="h-5 w-5 text-leaf" /> Enjoy! Say thanks to {donation.donor.displayName}?
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">Your note appears on their profile and helps others trust them.</p>
              <TextArea id="thanks" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={280} placeholder="It made our evening…" className="mt-3" />
              <Button type="submit" className="mt-3" loading={busy} disabled={note.trim().length < 2}>
                Send thanks
              </Button>
            </form>
          ))}
        {(mine.status === "pending" || mine.status === "accepted") && (
          <button type="button" onClick={() => setConfirmCancel(true)} className="text-sm font-semibold text-error hover:underline">
            I can't collect it anymore
          </button>
        )}
        <ConfirmDialog
          open={confirmCancel}
          title="Cancel your request?"
          message="The donor will be able to give it to someone else."
          confirmLabel="Cancel request"
          danger
          loading={busy}
          onConfirm={cancel}
          onClose={() => setConfirmCancel(false)}
        />
      </div>
    );
  }

  if (donation.status === "collected") {
    return <Notice icon={<CircleCheck className="h-5 w-5" />} title="This food found a home" text="It's been collected. Thanks to everyone who helped." />;
  }
  if (expired) {
    return <Notice icon={<Clock className="h-5 w-5" />} title="This listing has expired" text="Its best-before date has passed." />;
  }
  if (donation.status === "reserved") {
    return (
      <Notice
        icon={<Hand className="h-5 w-5" />}
        title="Reserved for someone else"
        text="If their pickup falls through, it'll be available again. Check back later."
      />
    );
  }

  return (
    <form onSubmit={send} className="space-y-3">
      {mine && (mine.status === "declined" || mine.status === "cancelled") && (
        <p className="rounded-2xl bg-surface-low px-4 py-3 text-sm text-on-surface-variant">
          Your earlier request was {mine.status}. You can ask again.
        </p>
      )}
      <label htmlFor="request-message" className="block text-sm font-semibold text-on-surface">
        Message to {donation.donor.displayName}
      </label>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {QUICK_MESSAGES.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => setMessage(text)}
            className="shrink-0 rounded-full bg-surface-low px-3 py-1.5 text-xs font-medium text-on-surface-variant ring-1 ring-forest/8 hover:bg-mint"
          >
            {text}
          </button>
        ))}
      </div>
      <TextArea
        id="request-message"
        rows={3}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={500}
        placeholder="When can you collect? Who's it for?"
        hasError={Boolean(error)}
      />
      {error && (
        <p className="text-xs font-medium text-error" role="alert" id="request-message-error">
          {error}
        </p>
      )}
      <Button type="submit" block size="lg" loading={busy} disabled={isAuthenticated && message.trim().length < 2}>
        <Hand className="h-4.5 w-4.5" /> {isAuthenticated ? "Request this food" : "Sign in to request"}
      </Button>
      <p className="text-center text-xs text-on-surface-variant">Your contact details are only shared if they accept.</p>
    </form>
  );
}

function Notice({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-surface-low p-5">
      <div className="flex items-center gap-2 font-semibold text-forest">
        {icon} {title}
      </div>
      <p className="mt-1 text-sm text-on-surface-variant">{text}</p>
    </div>
  );
}

// ------------------------------------------------------------------ donor

// `reserved`: someone else is already accepted, so waiting requests can only
// be declined (or kept as a fallback in case that pickup falls through).
function RequestRow({
  request,
  listingTitle,
  reserved,
  onChange,
}: {
  request: DonationRequest;
  listingTitle: string;
  reserved: boolean;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState<RequestAction | "complete" | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();

  const act = async (action: RequestAction) => {
    setBusy(action);
    try {
      await requestService.act(request.id, action);
      showToast(action === "accept" ? "Accepted. We've sent them your contact and a pickup code." : "Request declined.", action === "accept" ? "success" : "info");
      onChange();
    } catch (err) {
      showToast(apiErrorMessage(err, "That didn't work."), "error");
    } finally {
      setBusy(null);
    }
  };

  const complete = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("complete");
    setCodeError(undefined);
    try {
      await requestService.complete(request.id, code);
      showToast("Handover confirmed. That's food saved!");
      onChange();
    } catch (err) {
      setCodeError(apiFieldErrors(err).code ?? apiErrorMessage(err, "Couldn't confirm."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className={cx("rounded-3xl p-4 ring-1", request.status === "accepted" ? "bg-white ring-leaf/40 shadow-card" : "bg-white ring-forest/8")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 font-semibold text-on-surface">
            {request.requesterName} <AccountBadge type={request.requesterType} />
          </div>
          <div className="text-xs text-outline">{timeAgo(request.createdAt)}</div>
        </div>
        <StatusBadge status={request.status} kind="request" />
      </div>
      <p className="mt-2 text-sm text-on-surface-variant">&ldquo;{request.message}&rdquo;</p>

      {request.status === "pending" && reserved && (
        <p className="mt-3 rounded-2xl bg-surface-low px-3 py-2 text-xs text-on-surface-variant">
          On the waiting list. If your current pickup falls through, you can accept them instead.
        </p>
      )}
      {request.status === "pending" && !reserved && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => act("accept")} loading={busy === "accept"} disabled={busy !== null}>
            <Check className="h-4 w-4" /> Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={() => act("decline")} loading={busy === "decline"} disabled={busy !== null}>
            <X className="h-4 w-4" /> Decline
          </Button>
        </div>
      )}

      {request.status === "accepted" && (
        <div className="mt-4 space-y-3">
          {request.contact && <ContactCard contact={request.contact} title="Their contact" listingTitle={listingTitle} />}
          <form onSubmit={complete} className="rounded-3xl bg-surface-low p-4">
            <label htmlFor={`code-${request.id}`} className="text-sm font-semibold text-forest">
              Handing it over? Enter their 4-digit pickup code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={`code-${request.id}`}
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="0000"
                aria-invalid={Boolean(codeError)}
                className="h-12 w-32 rounded-2xl border border-forest/12 bg-white text-center font-mono text-2xl font-bold tracking-[0.3em] focus:border-leaf focus:outline-none focus:ring-4 focus:ring-leaf/15"
              />
              <Button type="submit" loading={busy === "complete"} disabled={code.length !== 4}>
                Confirm pickup
              </Button>
            </div>
            {codeError && (
              <p className="mt-2 text-xs font-medium text-error" role="alert">
                {codeError}
              </p>
            )}
          </form>
          <button type="button" onClick={() => act("decline")} className="text-xs font-semibold text-error hover:underline">
            They didn't show up: release it
          </button>
        </div>
      )}

      {request.thankYouNote && <p className="mt-3 rounded-2xl bg-mint px-4 py-3 font-serif text-sm italic text-forest">&ldquo;{request.thankYouNote}&rdquo;</p>}
    </li>
  );
}

function OwnerPanel({ donation, onChange }: { donation: DonationDetail; onChange: () => void }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const requests = donation.requests ?? [];
  const open = requests.filter((request) => request.status === "pending" || request.status === "accepted");
  const closed = requests.filter((request) => !open.includes(request));

  const remove = async () => {
    setDeleting(true);
    try {
      await donationService.remove(donation.id);
      showToast("Listing deleted.", "info");
      navigate("/my-listings");
    } catch (err) {
      showToast(apiErrorMessage(err, "Couldn't delete it."), "error");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <StatusBadge status={donation.status} kind="donation" />
        {donation.status !== "collected" && (
          <div className="flex gap-2">
            <Button to={`/donations/${donation.id}/edit`} size="sm" variant="outline">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)} ariaLabel="Delete listing">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <h2 className="font-serif text-xl font-semibold text-forest">
        Requests {requests.length > 0 && <span className="text-on-surface-variant">({requests.length})</span>}
      </h2>
      {requests.length === 0 ? (
        <p className="rounded-3xl bg-surface-low p-5 text-sm text-on-surface-variant">
          No requests yet. We'll email you the moment someone asks. Sharing the link on WhatsApp helps it go faster.
        </p>
      ) : (
        <ul className="space-y-3">
          {[...open.filter((r) => r.status === "accepted"), ...open.filter((r) => r.status === "pending"), ...closed].map((request) => (
            <RequestRow key={request.id} request={request} listingTitle={donation.title} reserved={donation.status === "reserved"} onChange={onChange} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this listing?"
        message={open.length ? `${plural(open.length, "person")} waiting will be told it's no longer available.` : "This can't be undone."}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ------------------------------------------------------------------ page

export default function DonationPage() {
  const { id = "" } = useParams();
  const { data: donation, loading, error, refetch } = useApiQuery(() => donationService.get(id), [id], "Couldn't load this listing.");

  if (loading && !donation) return <PageLoader />;
  if (error || !donation) return <ErrorState message={error ?? "This listing doesn't exist anymore."} onRetry={refetch} />;

  const facts = [
    { icon: <Package className="h-4.5 w-4.5" />, label: "Quantity", value: plural(donation.quantity, donation.unit === "items" ? "item" : donation.unit, donation.unit) },
    { icon: <CalendarDays className="h-4.5 w-4.5" />, label: "Best before", value: formatDay(donation.expiryDate) },
    { icon: <MapPin className="h-4.5 w-4.5" />, label: "Pickup area", value: donation.location },
    ...(donation.weightKg ? [{ icon: <Scale className="h-4.5 w-4.5" />, label: "About", value: formatKg(donation.weightKg) }] : []),
  ];

  return (
    <div className="mx-auto max-w-[1240px] px-4 pt-6 md:px-8 md:pt-10">
      <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf hover:underline">
        <ArrowLeft className="h-4 w-4" /> All food
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="relative overflow-hidden rounded-[32px] bg-surface-container shadow-card">
            <img src={donation.image} alt={donation.title} className="aspect-[4/3] w-full object-cover" />
            <div className="absolute left-4 top-4">
              <ExpiryBadge date={donation.expiryDate} className="shadow-card" />
            </div>
          </div>

          <div className="mt-6">
            <span className="text-sm font-semibold text-leaf">
              {CATEGORY_EMOJI[donation.category]} {CATEGORY_LABELS[donation.category]} · Listed {timeAgo(donation.createdAt)}
            </span>
            <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-forest sm:text-4xl">{donation.title}</h1>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-on-surface-variant">{donation.description}</p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-forest/5">
                <dt className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
                  <span className="text-leaf">{fact.icon}</span> {fact.label}
                </dt>
                <dd className="mt-1 font-semibold text-on-surface">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {donation.pickupNotes && (
            <div className="mt-4 rounded-3xl bg-sprout-soft p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-forest">Pickup notes</div>
              <p className="mt-1 text-forest">{donation.pickupNotes}</p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[32px] bg-white p-5 shadow-lift ring-1 ring-forest/5 sm:p-6">
            <Link to={`/people/${donation.donor.id}`} className="flex items-center gap-3 rounded-3xl bg-surface-low p-3 hover:bg-mint">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest font-bold text-sprout">
                {donation.donor.displayName[0]?.toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2 font-semibold text-on-surface">
                  {donation.donor.displayName} <AccountBadge type={donation.donor.accountType} />
                </span>
                <span className="text-xs text-on-surface-variant">View profile and thank-you notes</span>
              </span>
            </Link>
            <div className="mt-5">
              {donation.isOwner ? <OwnerPanel donation={donation} onChange={refetch} /> : <RequestPanel donation={donation} onChange={refetch} />}
            </div>
          </div>

          {!donation.isOwner && (
            <div className="mt-4 flex gap-3 rounded-3xl bg-surface-low p-5 text-sm text-on-surface-variant">
              <ShieldCheck className="h-5 w-5 shrink-0 text-leaf" />
              <p>
                <span className="font-semibold text-forest">Collect safely.</span> Meet somewhere public or at a business address,
                check the food looks and smells right, and keep cooked food chilled until you eat it.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
