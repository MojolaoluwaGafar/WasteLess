import type { ReactNode, MouseEvent } from "react";
import { Link } from "react-router";
import { LoaderCircle } from "lucide-react";
import { cx } from "../utils/format";

type Variant = "primary" | "sprout" | "secondary" | "outline" | "ghost" | "danger" | "light";
type Size = "lg" | "md" | "sm";

type Props = {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Renders a link styled as a button. Internal paths use the router. */
  to?: string;
  /** Renders an external link (opens in a new tab). */
  href?: string;
  variant?: Variant;
  size?: Size;
  /** Full width. */
  block?: boolean;
  disabled?: boolean;
  /** Shows a spinner and blocks clicks. */
  loading?: boolean;
  className?: string;
  ariaLabel?: string;
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-forest text-white shadow-card hover:bg-forest-deep hover:shadow-lift",
  // The bright accent, mostly on dark (forest) backgrounds.
  sprout: "bg-sprout text-forest-deep shadow-card hover:brightness-105 hover:shadow-lift",
  secondary: "bg-mint text-forest hover:bg-surface-container",
  outline: "border-[1.5px] border-forest/20 bg-white text-forest hover:border-forest/40 hover:bg-surface-low",
  ghost: "text-forest hover:bg-surface-container",
  danger: "bg-error-container text-error hover:brightness-95",
  light: "bg-white/12 text-white ring-1 ring-white/25 backdrop-blur-md hover:bg-white/20",
};

const SIZES: Record<Size, string> = {
  lg: "h-13 px-7 text-[15px]",
  md: "h-11 px-5 text-sm",
  sm: "h-9 px-4 text-[13px]",
};

// Every button in the app is a pill.
export default function Button({
  children,
  type = "button",
  onClick,
  to,
  href,
  variant = "primary",
  size = "md",
  block,
  disabled,
  loading,
  className,
  ariaLabel,
}: Props) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap",
    "transition-all duration-200 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 active:scale-[0.98]",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    (disabled || loading) && "pointer-events-none opacity-50",
    className,
  );

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes} disabled={disabled || loading} aria-label={ariaLabel} aria-busy={loading}>
      {loading && <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
