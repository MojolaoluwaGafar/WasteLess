import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../Context/AuthContext";

// Pages that need an account: send anyone who isn't signed in to the login
// page, and bring them back to where they were going afterwards. The first
// version let anyone open these pages, which then failed quietly.
export default function ProtectRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
