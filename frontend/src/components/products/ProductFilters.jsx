import { NIGERIAN_STATES, PRODUCT_CATEGORIES } from "@farm-connect/contracts";
import { useEffect, useState } from "react";

export function ProductFilters({ values, onChange }) {
  const [localQ, setLocalQ] = useState(values.q ?? "");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync local search state with external search parameter changes
  useEffect(() => {
    setLocalQ(values.q ?? "");
  }, [values.q]);

  // Debounced search text state propagation
  useEffect(() => {
    const handler = setTimeout(() => {
      if ((values.q ?? "") !== localQ) {
        onChange("q", localQ);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localQ, onChange, values.q]);

  const activeChips = [];
  if (values.category) {
    activeChips.push({ name: "category", label: values.category.replace("_", " ") });
  }
  if (values.state) {
    activeChips.push({ name: "state", label: values.state });
  }
  if (values.sort && values.sort !== "newest") {
    const sortLabels = {
      price_asc: "Price: Low to High",
      price_desc: "Price: High to Low"
    };
    activeChips.push({ name: "sort", label: sortLabels[values.sort] || values.sort });
  }
  if (values.q) {
    activeChips.push({ name: "q", label: `Search: "${values.q}"` });
  }

  function clearAll() {
    onChange("category", "");
    onChange("state", "");
    onChange("sort", "newest");
    onChange("q", "");
  }

  return (
    <div className="w-full">
      {/* Primary search & filter bar row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-ink/40">
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            className="form-input pl-11 bg-white border border-ink/10 focus:border-harvest focus:ring-1 focus:ring-harvest transition-all duration-200 rounded-full py-3 text-sm shadow-soft"
            name="q"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Search products, farmers, city..."
            aria-label="Search products"
          />
        </div>
        
        {/* Gear filter icon trigger */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center justify-center p-3 rounded-full border border-ink/10 bg-white hover:bg-ink/5 shadow-soft transition cursor-pointer text-ink/65 hover:text-ink shrink-0"
          aria-label="Filter"
          title="Filter & Sort"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </button>
      </div>

      {/* Active Filter Chips list */}
      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
          {activeChips.map((chip) => (
            <button
              key={chip.name}
              onClick={() => onChange(chip.name, chip.name === "sort" ? "newest" : "")}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-leaf/10 text-leaf border border-leaf/15 hover:bg-leaf/15 transition cursor-pointer"
              type="button"
            >
              <span className="capitalize">{chip.label}</span>
              <span className="text-[14px] leading-none text-leaf/60 font-semibold">×</span>
            </button>
          ))}
          <button
            onClick={clearAll}
            className="text-xs font-bold text-ink/40 hover:text-leaf underline transition ml-2 cursor-pointer"
            type="button"
          >
            Clear All
          </button>
        </div>
      ) : null}

      {/* Bottom Sheet Modal / Drawer Wrapper */}
      <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Darkened backdrop */}
        <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
        
        {/* Drawer container (slides from bottom on mobile, right on desktop) */}
        <div className={`relative w-full max-h-[85vh] bg-white border border-ink/5 p-6 shadow-card flex flex-col transition-all duration-300 transform mt-auto rounded-t-[2rem] overflow-y-auto
          md:max-h-screen md:h-full md:mt-0 md:w-85 md:rounded-none md:rounded-l-[2rem]
          ${isDrawerOpen ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-ink/5 pb-4 mb-5">
            <h2 className="font-display text-lg font-bold text-ink">Filters & Sorting</h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-2xl text-ink/40 hover:text-ink/75 font-semibold cursor-pointer"
              type="button"
            >
              ×
            </button>
          </div>

          {/* Form dropdowns */}
          <div className="flex flex-col gap-5 flex-1">
            {/* Category Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink/45" htmlFor="category-select">Category</label>
              <div className="relative">
                <select
                  id="category-select"
                  className="form-input appearance-none pr-9 bg-cream/10 focus:bg-white focus:border-harvest focus:ring-1 focus:ring-harvest transition-all duration-200"
                  name="category"
                  value={values.category ?? ""}
                  onChange={(e) => onChange("category", e.target.value)}
                  aria-label="Category"
                >
                  <option value="">All categories</option>
                  {PRODUCT_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item.replace("_", " ")}
                    </option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink/40">
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* State Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink/45" htmlFor="state-select">State</label>
              <div className="relative">
                <select
                  id="state-select"
                  className="form-input appearance-none pr-9 bg-cream/10 focus:bg-white focus:border-harvest focus:ring-1 focus:ring-harvest transition-all duration-200"
                  name="state"
                  value={values.state ?? ""}
                  onChange={(e) => onChange("state", e.target.value)}
                  aria-label="State"
                >
                  <option value="">All states</option>
                  {NIGERIAN_STATES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink/40">
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Sort Select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-ink/45" htmlFor="sort-select">Sort By</label>
              <div className="relative">
                <select
                  id="sort-select"
                  className="form-input appearance-none pr-9 bg-cream/10 focus:bg-white focus:border-harvest focus:ring-1 focus:ring-harvest transition-all duration-200"
                  name="sort"
                  value={values.sort ?? "newest"}
                  onChange={(e) => onChange("sort", e.target.value)}
                  aria-label="Sort products"
                >
                  <option value="newest">Newest first</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="recently_added" disabled>Recently Added</option>
                  <option value="nearest" disabled>Nearest (Coming Soon)</option>
                </select>
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink/40">
                  <svg className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Future scale elements (Visual only) */}
            <div className="mt-4 pt-5 border-t border-ink/5 flex flex-col gap-4 opacity-50">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40">Upcoming Filters</span>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-ink/70">Price Range</span>
                <div className="h-1 bg-ink/10 rounded-full w-full relative">
                  <div className="absolute left-2 right-8 h-1 bg-leaf rounded-full" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink/70">Verified Farmers Only</span>
                <div className="h-5 w-9 rounded-full bg-ink/15 p-0.5">
                  <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer controls */}
          <div className="mt-8 border-t border-ink/5 pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={clearAll}
              className="flex-1 py-2.5 rounded-xl border border-ink/10 hover:bg-ink/5 text-xs font-bold text-ink/65 transition cursor-pointer"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 py-2.5 rounded-xl bg-leaf hover:bg-leaf/90 text-xs font-bold text-white transition cursor-pointer shadow-soft"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
