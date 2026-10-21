import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const navigation = [
  ["", "Overview"],
  ["users", "Users"],
  ["products", "Products"],
  ["conversations", "Conversations"],
  ["reports", "Reports"],
  ["audit", "Audit log"]
];

export function AdminLayout() {
  const { logout, profile } = useAuth();

  return (
    <div className="min-h-screen bg-[#f3f5ef] text-[#17372a] lg:flex">
      <aside className="bg-[#123d2b] text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:block lg:border-b-0 lg:px-6 lg:py-7">
          <Link className="flex items-center gap-3" to="/admin">
            <img className="h-10 w-10 rounded-xl bg-white object-contain p-1" src="/branding/logo.png" alt="" />
            <div>
              <p className="font-display text-lg font-bold leading-tight">Farm Connect</p>
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#9ed4b4]">Admin centre</p>
            </div>
          </Link>
          <Link className="text-xs font-bold text-[#b9ddc7] hover:text-white lg:mt-7 lg:inline-flex" to="/marketplace">
            ← Marketplace
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4 lg:pt-4" aria-label="Admin navigation">
          {navigation.map(([path, label]) => (
            <NavLink
              end={path === ""}
              key={label}
              to={`/admin${path ? `/${path}` : ""}`}
              className={({ isActive }) =>
                `shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition lg:w-full ${
                  isActive
                    ? "bg-white text-[#123d2b] shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-white/10 p-5 lg:block">
          <p className="truncate text-sm font-bold">{profile?.full_name}</p>
          <p className="mt-0.5 truncate text-xs text-white/55">{profile?.email}</p>
          <button className="mt-4 text-xs font-bold text-[#ffc1ad] hover:text-white" onClick={logout} type="button">
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-[#17372a]/8 bg-white/85 px-5 py-4 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#3e7d5b]">Operations workspace</p>
              <p className="font-display text-xl font-bold">Good to see you, {profile?.full_name?.split(" ")[0]}</p>
            </div>
            <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 lg:hidden" onClick={logout} type="button">
              Log out
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
