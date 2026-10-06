import { cx } from "../utils/format";

// The leaf mark from public/favicon.svg.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cx("h-9 w-9", className)} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="var(--color-forest)" />
      <path d="M32 13c-9 9-11 20-6 29 2.8 5 6 7 6 7s3.2-2 6-7c5-9 3-20-6-29Z" fill="var(--color-sprout)" />
      <path d="M32 24v24M32 36l-6-5M32 42l6-5" stroke="var(--color-forest)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Logo({ light, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cx("font-serif text-[22px] font-semibold tracking-tight", light ? "text-white" : "text-forest")}>
        WasteLess
      </span>
    </span>
  );
}
