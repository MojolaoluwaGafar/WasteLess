import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, Mail } from "lucide-react";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import Button from "../../Components/Button";
import GoogleButton from "../../Components/GoogleButton";
import { Field, TextInput } from "../../Components/Field";
import { apiErrorMessage, apiFieldErrors } from "../../utils/apiError";
import AuthShell from "./AuthShell";

// Where to go after signing in: the page that sent them here, or the dashboard.
export function useReturnTo() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  return from && from.startsWith("/") && !from.startsWith("/login") ? from : "/dashboard";
}

export default function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const returnTo = useReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={returnTo} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = "Enter a valid email address.";
    if (!password) found.password = "Enter your password.";
    setErrors(found);
    setFormError(undefined);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      signIn(await authService.login(email, password));
      navigate(returnTo, { replace: true });
    } catch (err) {
      setErrors(apiFieldErrors(err));
      setFormError(apiErrorMessage(err, "Couldn't sign you in."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New here?{" "}
          <Link to="/register" state={{ from: returnTo }} className="font-semibold text-leaf hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <p className="rounded-2xl bg-error-container px-4 py-3 text-sm font-medium text-error" role="alert">
            {formError}
          </p>
        )}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <TextInput id="email" type="email" autoComplete="email" icon={<Mail className="h-4.5 w-4.5" />} value={email} onChange={(event) => setEmail(event.target.value)} hasError={Boolean(errors.email)} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="relative">
            <TextInput id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} hasError={Boolean(errors.password)} className="pr-12" />
            <button type="button" onClick={() => setShow((value) => !value)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-outline hover:text-forest">
              {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
        </Field>
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-leaf hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" block size="lg" loading={loading}>
          Sign in
        </Button>
      </form>
      <GoogleButton text="signin_with" onDone={() => navigate(returnTo, { replace: true })} />
    </AuthShell>
  );
}
