import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'
import { AuthProvider } from './Context/AuthContext.tsx'
import { GOOGLE_CLIENT_ID } from './utils/google.ts'

// Google's script only loads when a client ID is configured.
const WithGoogle = ({ children }: { children: ReactNode }) =>
  GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider> : <>{children}</>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WithGoogle>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </WithGoogle>
  </StrictMode>,
)
