import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function GuestRoute() {
  const auth = useAuth();

  if (auth.isLoading) {
    return null;
  }

  return <Outlet />;
}
