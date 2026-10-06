import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Mail, MailCheck } from "lucide-react";
import { authService } from "../../API/services/authService";
import Button from "../../Components/Button";
import { Field, TextInput } from "../../Components/Field";
import { apiErrorMessage } from "../../utils/apiError";
import AuthShell from "./AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    setError(undefined);
    setLoading(true);
    try {
      setSent(await authService.forgotPassword(email));
    } catch (err) {
      setError(apiErrorMessage(err, "Couldn't send the email. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      {sent ? (
        <div className="rounded-3xl bg-mint p-6">
          <MailCheck className="h-8 w-8 text-leaf" />
          <p className="mt-3 font-semibold text-forest">Check your inbox</p>
          <p className="mt-1 text-sm text-on-surface-variant">{sent}</p>
          <Button to="/login" variant="outline" className="mt-5">
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Email" htmlFor="email" error={error}>
            <TextInput id="email" type="email" autoComplete="email" icon={<Mail className="h-4.5 w-4.5" />} value={email} onChange={(event) => setEmail(event.target.value)} hasError={Boolean(error)} />
          </Field>
          <Button type="submit" block size="lg" loading={loading}>
            Send reset link
          </Button>
          <p className="text-center text-sm">
            <Link to="/login" className="font-semibold text-leaf hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
