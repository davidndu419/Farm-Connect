import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function AppLayout() {
  const { logout, profile } = useAuth();

  return (
    <div className="min-h-screen pb-20 md:pb-8 bg-cream text-ink flex flex-col">
      <header className="border-b border-ink/10 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <Link className="flex items-center gap-3 font-display text-xl font-bold" to="/marketplace">
            <img src="/branding/logo.png" className="h-9 w-auto md:h-11 object-contain" alt="" />
            <span>Farm Connect</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold" aria-label="Account">
            <NavLink to="/marketplace" className={({ isActive }) => isActive ? "text-leaf underline underline-offset-4" : "text-ink/75 hover:text-leaf transition-colors"}>Marketplace</NavLink>
            {profile?.role === "farmer" ? <NavLink to="/my-products" className={({ isActive }) => isActive ? "text-leaf underline underline-offset-4" : "text-ink/75 hover:text-leaf transition-colors"}>My products</NavLink> : null}
            <NavLink to="/messages" className={({ isActive }) => isActive ? "text-leaf underline underline-offset-4" : "text-ink/75 hover:text-leaf transition-colors"}>Messages</NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "text-leaf underline underline-offset-4" : "text-ink/75 hover:text-leaf transition-colors"}>Profile</NavLink>
            <button className="text-red-700 cursor-pointer" onClick={logout} type="button">
              Log out
            </button>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-5 pt-3 pb-6">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink/8 bg-white/90 pb-safe-bottom shadow-lg backdrop-blur-md md:hidden" aria-label="Mobile Navigation">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          <NavLink
            to="/marketplace"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive ? "text-leaf font-bold scale-105" : "text-ink/60 font-medium"
              }`
            }
          >
            <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72M6.75 18h3.5a.75.75 0 00.75-.75V14a.75.75 0 00-.75-.75h-3.5A.75.75 0 006 14v3.25c0 .414.336.75.75.75z" />
            </svg>
            <span className="text-[10px] tracking-tight mt-0.5">Marketplace</span>
          </NavLink>

          {profile?.role === "farmer" && (
            <NavLink
              to="/my-products"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                  isActive ? "text-leaf font-bold scale-105" : "text-ink/60 font-medium"
                }`
              }
            >
              <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z" />
              </svg>
              <span className="text-[10px] tracking-tight mt-0.5">My Products</span>
            </NavLink>
          )}

          <NavLink
            to="/messages"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive ? "text-leaf font-bold scale-105" : "text-ink/60 font-medium"
              }`
            }
          >
            <svg className="size-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <span className="text-[10px] tracking-tight mt-0.5">Messages</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive ? "text-leaf font-bold scale-105" : "text-ink/60 font-medium"
              }`
            }
          >
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} className="size-6 rounded-full object-cover" alt="" />
            ) : (
              <div className="size-6 rounded-full bg-leaf text-white flex items-center justify-center font-bold text-[8px]">
                {((profile?.full_name?.charAt(0) || "") + (profile?.full_name?.split(/\s+/)[1]?.charAt(0) || "")).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] tracking-tight mt-0.5">Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
