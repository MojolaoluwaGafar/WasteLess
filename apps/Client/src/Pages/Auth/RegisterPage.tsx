import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { Building2, HeartHandshake, Mail, UserRound } from "lucide-react";
import type { AccountType } from "../../types";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import Button from "../../Components/Button";
import GoogleButton from "../../Components/GoogleButton";
import { Field, TextInput } from "../../Components/Field";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import { cx } from "../../utils/format";
import AuthShell from "./AuthShell";
import { useReturnTo } from "./LoginPage";

const TYPES: { value: AccountType; title: string; text: string; icon: React.ReactNode }[] = [
  { value: "individual", title: "Just me", text: "Share and find food at home", icon: <UserRound className="h-5 w-5" /> },
  { value: "business", title: "A business", text: "Restaurant, caterer, shop", icon: <Building2 className="h-5 w-5" /> },
  { value: "organisation", title: "An organisation", text: "Food bank, shelter, community", icon: <HeartHandshake className="h-5 w-5" /> },
];

export default function RegisterPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const returnTo = useReturnTo();
  const [params] = useSearchParams();
  const initialType = TYPES.some((type) => type.value === params.get("type")) ? (params.get("type") as AccountType) : "individual";

  const [accountType, setAccountType] = useState<AccountType>(initialType);
  const [values, setValues] = useState({ name: "", orgName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={returnTo} replace />;

  const set = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (values.name.trim().length < 2) found.name = "Enter your name.";
    if (accountType !== "individual" && !values.orgName.trim()) found.orgName = "Add the business or organisation name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) found.email = "Enter a valid email address.";
    if (values.password.length < 8) found.password = "Use at least 8 characters.";
    setErrors(found);
    setFormError(undefined);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      signIn(await authService.register({ ...values, accountType }));
      navigate(returnTo === "/dashboard" ? "/dashboard" : returnTo, { replace: true });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(apiErrorMessage(err, "Couldn't create your account."));
    } finally {
      setLoading(false);
    }
  };

  const org = accountType !== "individual";

  return (
    <AuthShell
      title="Join WasteLess"
      subtitle={
        <>
          Free for everyone. Already have an account?{" "}
          <Link to="/login" state={{ from: returnTo }} className="font-semibold text-leaf hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-on-surface">I'm joining as</legend>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={accountType === type.value}
                onClick={() => setAccountType(type.value)}
                className={cx(
                  "rounded-3xl p-3 text-left transition",
                  accountType === type.value ? "bg-forest text-white shadow-lift" : "bg-white text-on-surface ring-1 ring-forest/10 hover:ring-forest/25",
                )}
              >
                <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", accountType === type.value ? "bg-sprout text-forest-deep" : "bg-mint text-leaf")}>
                  {type.icon}
                </span>
                <span className="mt-2 block text-sm font-bold">{type.title}</span>
                <span className={cx("block text-[11px] leading-snug", accountType === type.value ? "text-white/70" : "text-on-surface-variant")}>{type.text}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {formError && (
          <p className="rounded-2xl bg-error-container px-4 py-3 text-sm font-medium text-error" role="alert">
            {formError}
          </p>
        )}
        {org && (
          <Field label={accountType === "business" ? "Business name" : "Organisation name"} htmlFor="orgName" error={errors.orgName} hint="Shown on your listings and profile.">
            <TextInput id="orgName" autoComplete="organization" value={values.orgName} onChange={(event) => set("orgName", event.target.value)} maxLength={80} hasError={Boolean(errors.orgName)} />
          </Field>
        )}
        <Field label={org ? "Your name" : "Name"} htmlFor="name" error={errors.name}>
          <TextInput id="name" autoComplete="name" value={values.name} onChange={(event) => set("name", event.target.value)} maxLength={60} hasError={Boolean(errors.name)} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <TextInput id="email" type="email" autoComplete="email" icon={<Mail className="h-4.5 w-4.5" />} value={values.email} onChange={(event) => set("email", event.target.value)} hasError={Boolean(errors.email)} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
          <TextInput id="password" type="password" autoComplete="new-password" value={values.password} onChange={(event) => set("password", event.target.value)} hasError={Boolean(errors.password)} />
        </Field>
        <Button type="submit" block size="lg" loading={loading}>
          Create account
        </Button>
        <p className="text-center text-xs text-on-surface-variant">
          By joining you agree to share only food that's safe to eat, and to treat everyone you meet with respect.
        </p>
      </form>
      {!org && <GoogleButton text="signup_with" onDone={() => navigate("/dashboard", { replace: true })} />}
    </AuthShell>
  );
}
