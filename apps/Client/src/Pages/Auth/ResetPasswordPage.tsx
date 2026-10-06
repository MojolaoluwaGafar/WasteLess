import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { authService } from "../../API/services/authService";
import { useAuth } from "../../Context/AuthContext";
import Button from "../../Components/Button";
import { Field, TextInput } from "../../Components/Field";
import { apiErrorMessage } from "../../utils/apiError";
import { showToast } from "../../utils/toastHelper";
import AuthShell from "./AuthShell";

// Opened from the reset email. A successful reset signs the person straight
// in (and signs out every other device).
export default function ResetPasswordPage() {
  const { token = "" } = useParams();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const found: Record<string, string> = {};
    if (password.length < 8) found.password = "Use at least 8 characters.";
    if (confirm !== password) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    setFormError(undefined);
    try {
      signIn(await authService.resetPassword(token, password));
      showToast("Password changed. You're signed in.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(apiErrorMessage(err, "Couldn't reset your password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Make it at least 8 characters.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <p className="rounded-2xl bg-error-container px-4 py-3 text-sm font-medium text-error" role="alert">
            {formError}{" "}
            <Link to="/forgot-password" className="underline">
              Get a new link
            </Link>
          </p>
        )}
        <Field label="New password" htmlFor="password" error={errors.password}>
          <TextInput id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} hasError={Boolean(errors.password)} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <TextInput id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} hasError={Boolean(errors.confirm)} />
        </Field>
        <Button type="submit" block size="lg" loading={loading}>
          Save and sign in
        </Button>
      </form>
    </AuthShell>
  );
}
