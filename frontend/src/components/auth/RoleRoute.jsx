import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function RoleRoute({ role }) {
  const { profile } = useAuth();
  return profile?.role === role ? <Outlet /> : <Navigate to="/profile" replace />;
}
