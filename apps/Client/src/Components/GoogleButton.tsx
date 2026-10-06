import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "../API/services/authService";
import { useAuth } from "../Context/AuthContext";
import { apiErrorMessage } from "../utils/apiError";
import { showToast } from "../utils/toastHelper";
import { GOOGLE_CLIENT_ID } from "../utils/google";

export const googleEnabled = Boolean(GOOGLE_CLIENT_ID);

// Google's own button, which returns an ID token the server verifies against
// our client ID. The first version sent an access token instead, which any
// other app's token could have stood in for.
export default function GoogleButton({ onDone, text = "continue_with" }: { onDone: () => void; text?: "signin_with" | "signup_with" | "continue_with" }) {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!googleEnabled) return null;

  return (
    <div className={busy ? "pointer-events-none opacity-60" : undefined}>
      <div className="relative my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-outline">
        <span className="h-px flex-1 bg-forest/10" /> or <span className="h-px flex-1 bg-forest/10" />
      </div>
      <div className="flex justify-center">
        <GoogleLogin
          text={text}
          shape="pill"
          size="large"
          width="320"
          // Chrome and Edge show their own account picker (FedCM) instead of
          // a popup window, which popup and ad blockers often stop. Other
          // browsers still use the popup.
          use_fedcm_for_button
          onSuccess={async ({ credential }) => {
            if (!credential) return showToast("Google sign-in didn't complete. Try again.", "error");
            setBusy(true);
            try {
              signIn(await authService.google(credential));
              onDone();
            } catch (err) {
              showToast(apiErrorMessage(err, "Google sign-in didn't work. Try again."), "error");
            } finally {
              setBusy(false);
            }
          }}
          onError={() => showToast("Google sign-in was closed or blocked.", "error")}
        />
      </div>
      <p className="mt-2 text-center text-xs text-outline">If nothing opens, allow pop-ups for this site and try again.</p>
    </div>
  );
}
