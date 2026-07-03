import { Link, Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="min-h-screen bg-cream px-5 py-8 text-ink">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link className="inline-flex items-center gap-3 font-display text-xl font-bold" to="/">
            <img src="/branding/logo.png" className="h-9 w-auto object-contain" alt="" />
            <span>Farm Connect</span>
          </Link>
          <Link
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white/75 px-3 py-1.5 text-xs font-bold text-leaf shadow-soft transition hover:bg-white cursor-pointer"
            to="/"
          >
            <span aria-hidden="true">←</span>
            Back to home
          </Link>
        </div>
        <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-card sm:p-9">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
