import { useEffect, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import Button from "./Button";
import { LogoMark } from "./Logo";
import { cx } from "../utils/format";

// Loading, empty, error and "are you sure?" states, shared by every page.

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
      <LogoMark className="h-11 w-11 motion-safe:animate-pulse" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-14 text-center motion-safe:animate-fade-up", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-mint text-leaf">{icon}</div>
      <h2 className="font-serif text-xl font-semibold text-forest">{title}</h2>
      {message && <p className="mt-1.5 max-w-sm text-sm text-on-surface-variant">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<TriangleAlert className="h-7 w-7" />}
      title="That didn't load"
      message={message}
      action={onRetry && <Button variant="outline" onClick={onRetry}>Try again</Button>}
    />
  );
}

// A grey placeholder in the shape of a listing card.
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-card" aria-hidden="true">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
      </div>
    </div>
  );
}

type ConfirmProps = {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  /** Red confirm button, for deleting and cancelling. */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
};

// A small "are you sure?" sheet: slides up from the bottom on phones, sits in
// the middle on larger screens.
export function ConfirmDialog({ open, title, message, confirmLabel, danger, loading, onConfirm, onClose, children }: ConfirmProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-forest-deep/40 backdrop-blur-sm motion-safe:animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-float motion-safe:animate-sheet-up">
        <h2 id="confirm-title" className="font-serif text-xl font-semibold text-forest">
          {title}
        </h2>
        <div className="mt-2 text-sm text-on-surface-variant">{message}</div>
        {children}
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" block onClick={onClose} disabled={loading}>
            Go back
          </Button>
          <Button variant={danger ? "danger" : "primary"} block onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
