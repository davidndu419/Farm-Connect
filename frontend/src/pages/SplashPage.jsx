import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const valueProps = [
  {
    icon: "🌱",
    title: "Fresh from Farmers",
    text: "Harvested directly and listed by local farmers—no middlemen, no extra markups."
  },
  {
    icon: "📍",
    title: "Search by Location",
    text: "Filter crops by city and state to find the best agricultural deals right next to you."
  },
  {
    icon: "💬",
    title: "Chat Before You Buy",
    text: "Message farmers directly inside the app to discuss prices, quantity, and collection."
  },
  {
    icon: "🤝",
    title: "Trust & Fair Prices",
    text: "Connect with verified farmers, compare crop details transparently, and save cost."
  }
];

export function SplashPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-gradient-to-br from-cream via-white to-leaf/5 text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-ink/5 pb-4">
          <Link className="flex items-center gap-3 font-bold" to="/marketplace" aria-label="Farm Connect home">
            <img src="/branding/logo.png" className="h-9 w-auto md:h-11 object-contain" alt="" />
            <span className="font-display text-xl font-bold tracking-tight">
              Farm Connect
            </span>
          </Link>
          <span className="rounded-full border border-leaf/15 bg-white/75 px-4 py-2 text-xs sm:text-sm font-semibold text-leaf shadow-sm">
            🇳🇬 Grown in Nigeria
          </span>
        </header>

        {/* Hero Section */}
        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div className="max-w-2xl flex flex-col items-center text-center lg:items-start lg:text-left">
            <img src="/branding/logo.png" className="h-24 sm:h-28 w-auto object-contain mb-8" alt="Farm Connect Logo" />
            <p className="mb-4 text-xs sm:text-sm font-bold uppercase tracking-[0.22em] text-harvest">
              FARM TO MARKET, MADE SIMPLER
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Buy fresh produce directly from local farmers
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-ink/70">
              Discover crops, compare prices, and chat with farmers near you. Farm Connect brings small-scale farmers and buyers together in one trusted marketplace.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                className="rounded-2xl bg-leaf hover:bg-leaf/90 px-8 py-3.5 text-center font-bold text-white shadow-soft transition-all duration-200 cursor-pointer text-sm sm:text-base hover:scale-[1.02]"
                to="/marketplace"
              >
                Browse Marketplace
              </Link>
              <Link
                className="rounded-2xl bg-harvest hover:bg-harvest/90 px-8 py-3.5 text-center font-bold text-white shadow-soft transition-all duration-200 cursor-pointer text-sm sm:text-base hover:scale-[1.02]"
                to="/register"
              >
                Create Account
              </Link>
              <Link
                className="rounded-2xl border border-ink/15 hover:bg-white/50 px-8 py-3.5 text-center font-semibold text-ink/80 transition-all duration-200 cursor-pointer text-sm sm:text-base hover:scale-[1.02]"
                to="/login"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* Fintech / Agritech Visual Cards Showcase */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-12 top-10 size-48 rounded-full bg-harvest/15 blur-3xl" />
            <div className="absolute -right-12 bottom-4 size-52 rounded-full bg-leaf/10 blur-3xl" />
            
            <div className="relative rounded-[2.5rem] border border-white/60 bg-white/70 p-5 shadow-card backdrop-blur-md flex flex-col gap-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50 px-2">
                Live Marketplace Preview
              </p>
              
              {/* Product cards snippet */}
              <div className="grid gap-3 grid-cols-2">
                {/* Product 1 */}
                <div className="rounded-2xl border border-ink/5 bg-white p-2.5 shadow-sm flex flex-col">
                  <div className="aspect-square w-full rounded-xl bg-cream/70 flex items-center justify-center mb-2 relative overflow-hidden">
                    <img src="/branding/tomato-preview.png" className="h-full w-full object-cover" alt="Tomatoes" />
                    <span className="absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-leaf/10 text-leaf border border-leaf/15 uppercase z-10">
                      Active
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-ink truncate">Jos Tomatoes</h3>
                  <p className="mt-0.5 text-xs font-extrabold text-leaf">₦8,000 <span className="text-[9px] font-normal text-ink/50">/ basket</span></p>
                  <p className="mt-1 text-[9px] text-ink/40">📍 Jos, Plateau</p>
                </div>
                
                {/* Product 2 */}
                <div className="rounded-2xl border border-ink/5 bg-white p-2.5 shadow-sm flex flex-col">
                  <div className="aspect-square w-full rounded-xl bg-cream/70 flex items-center justify-center mb-2 relative overflow-hidden">
                    <img src="/branding/garri-preview.png" className="h-full w-full object-cover" alt="Garri" />
                    <span className="absolute top-1 right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-leaf/10 text-leaf border border-leaf/15 uppercase z-10">
                      Active
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-ink truncate">White Garri</h3>
                  <p className="mt-0.5 text-xs font-extrabold text-leaf">₦45,000 <span className="text-[9px] font-normal text-ink/50">/ bag</span></p>
                  <p className="mt-1 text-[9px] text-ink/40">📍 Owerri, Imo</p>
                </div>
              </div>

              {/* Farmer/Buyer Chat snippet */}
              <div className="rounded-2xl border border-ink/5 bg-cream/60 p-4.5 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 border-b border-ink/5 pb-2">
                  <span className="text-lg">💬</span>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-ink/60">Negotiation Chat</span>
                </div>
                
                {/* Bubble 1 */}
                <div className="flex flex-col items-start max-w-[85%]">
                  <span className="text-[9px] text-ink/50 mb-0.5">Ada (Buyer)</span>
                  <div className="rounded-2xl rounded-tl-none bg-white border border-ink/5 px-3 py-2 text-xs text-ink shadow-sm">
                    Hello Baba, is the white garri still available?
                  </div>
                </div>

                {/* Bubble 2 */}
                <div className="flex flex-col items-end max-w-[85%] self-end">
                  <span className="text-[9px] text-ink/50 mb-0.5">Femi (Farmer)</span>
                  <div className="rounded-2xl rounded-tr-none bg-leaf text-white px-3 py-2 text-xs shadow-sm">
                    Yes, fresh batch just arrived from the farm. How many bags?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Section */}
        <section className="py-12 border-t border-ink/10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Why use Farm Connect?</h2>
            <p className="text-sm sm:text-base text-ink/65 mt-2">Connecting Nigerian farms to markets, directly and transparently.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((prop, idx) => (
              <article
                className="rounded-2xl border border-ink/5 bg-white p-6 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
                key={idx}
              >
                <span className="text-3xl mb-4 block" aria-hidden="true">{prop.icon}</span>
                <h3 className="font-display font-bold text-base text-ink">{prop.title}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-ink/65">
                  {prop.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-ink/5 py-6 text-center text-xs text-ink/50">
          © {new Date().getFullYear()} Farm Connect. Connecting Nigerian agriculture, one conversation at a time.
        </footer>
      </div>
    </main>
  );
}
