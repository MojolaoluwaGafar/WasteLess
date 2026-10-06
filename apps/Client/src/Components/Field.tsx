import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "../utils/format";

// Shared look for every text box, dropdown and text area.
export const inputClass = (hasError?: boolean) =>
  cx(
    "w-full rounded-2xl border bg-white px-4 text-on-surface placeholder:text-outline/70",
    "transition-shadow focus:border-leaf focus:outline-none focus:ring-4 focus:ring-leaf/15",
    hasError ? "border-error" : "border-forest/12",
  );

type WrapperProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

// A label above a control, with a hint or error below it.
export function Field({ label, htmlFor, error, hint, optional, children, className }: WrapperProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold text-on-surface">
        <span>{label}</span>
        {optional && <span className="text-[11px] font-normal text-outline">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs font-medium text-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; hasError?: boolean; icon?: ReactNode };

export function TextInput({ id, hasError, icon, className, ...rest }: InputProps) {
  const input = (
    <input
      id={id}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? `${id}-error` : undefined}
      className={cx(inputClass(hasError), "h-12", Boolean(icon) && "pl-11", className)}
      {...rest}
    />
  );
  if (!icon) return input;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline">{icon}</span>
      {input}
    </div>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { id: string; hasError?: boolean; children: ReactNode };

export function SelectInput({ id, hasError, className, children, ...rest }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={cx(inputClass(hasError), "h-12 appearance-none pr-10", className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden="true" />
    </div>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; hasError?: boolean };

export function TextArea({ id, hasError, className, ...rest }: TextAreaProps) {
  return (
    <textarea
      id={id}
      aria-invalid={hasError || undefined}
      aria-describedby={hasError ? `${id}-error` : undefined}
      className={cx(inputClass(hasError), "py-3", className)}
      {...rest}
    />
  );
}

type ChipOption<T extends string> = { value: T; label: string; icon?: ReactNode };

// A row of pill toggles for picking one value (categories, filters).
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("flex gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
              active ? "bg-forest text-white shadow-card" : "bg-white text-on-surface-variant ring-1 ring-forest/10 hover:ring-forest/25",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
