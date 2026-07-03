import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function ProtectedRoute() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream text-leaf">
        <p className="font-bold">Restoring your Farm Connect session…</p>
      </main>
    );
  }

  return auth.isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}
