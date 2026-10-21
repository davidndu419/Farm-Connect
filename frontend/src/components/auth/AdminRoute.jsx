import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function AdminRoute() {
  const { profile } = useAuth();
  return profile?.isAdmin ? <Outlet /> : <Navigate to="/marketplace" replace />;
}
