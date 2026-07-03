import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 text-center text-ink">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-harvest">
          404
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold">
          This path has not been planted.
        </h1>
        <p className="mt-4 text-ink/65">
          Return to the Farm Connect home page and start again.
        </p>
        <Link
          className="mt-7 inline-flex rounded-2xl bg-leaf px-5 py-3 font-bold text-white"
          to="/"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
