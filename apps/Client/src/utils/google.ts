// The Google OAuth client for "Sign in with Google". Client IDs are public
// (they're in every page that shows the button), so the live one is the
// fallback when VITE_GOOGLE_CLIENT_ID isn't set, as on the Vercel project.
// The Server must accept the same ID (GOOGLE_CLIENT_ID / authService.ts).
const LIVE_CLIENT_ID = "696845003047-5d1gev6gienmpk35ebffauo7gk78dh6k.apps.googleusercontent.com";

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || LIVE_CLIENT_ID;
