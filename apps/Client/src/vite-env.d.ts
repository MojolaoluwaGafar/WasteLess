/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** The API's address, e.g. https://wasteless-api.onrender.com. Empty in development. */
  readonly VITE_BASE_URL?: string;
  /** The same, under the name the live Vercel project uses. */
  readonly VITE_BACKEND_URL?: string;
  /** Google OAuth client ID. Empty hides the Google button. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
