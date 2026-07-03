import { Outlet } from "react-router-dom";
import { RouteFallback } from "../components/common/RouteFallback.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { AppLayout } from "./AppLayout.jsx";

export function SessionAwareLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteFallback />;
  }

  return isAuthenticated ? <AppLayout /> : <Outlet />;
}
