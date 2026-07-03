import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

export function MarketplaceBackLink() {
  const { isAuthenticated } = useAuth();
  const destination = isAuthenticated ? "/profile" : "/";
  const label = isAuthenticated ? "Back to profile" : "Back to home";

  return (
    <Link
      className="mb-7 inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white/75 px-4 py-2.5 text-sm font-bold text-leaf shadow-soft transition hover:bg-white"
      to={destination}
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
