import { useInfiniteQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { useSearchParams } from "react-router-dom";
import { listProducts } from "../api/productsApi.js";
import { ProductFilters } from "../components/products/ProductFilters.jsx";
import { ProductGrid } from "../components/products/ProductGrid.jsx";
import { MarketplaceBackLink } from "../components/products/MarketplaceBackLink.jsx";
import { useAuth } from "../hooks/useAuth.js";

export function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.toString();
  const deferredSearch = useDeferredValue(search);
  const query = useInfiniteQuery({
    queryKey: ["products", deferredSearch],
    initialPageParam: null,
    queryFn: ({ pageParam }) => {
      const page = new URLSearchParams(deferredSearch);
      if (pageParam) page.set("cursor", pageParam);
      return listProducts(page.toString());
    },
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined
  });
  const products = query.data?.pages.flatMap((page) => page.data) ?? [];
  const values = Object.fromEntries(params);
  function change(name, value) {
    const next = new URLSearchParams(params);
    value ? next.set(name, value) : next.delete(name);
    setParams(next);
  }
  return (
    <main
      className={
        isAuthenticated
          ? "text-ink"
          : "mx-auto max-w-6xl px-5 py-10 text-ink"
      }
    >
      {!isAuthenticated ? <MarketplaceBackLink /> : null}
      <p className="text-sm font-bold uppercase tracking-[.18em] text-harvest">Nigerian produce, directly listed</p>
      <h1 className="mt-2 font-display text-4xl font-bold">Marketplace</h1>
      <div className="mt-7"><ProductFilters values={values} onChange={change} /></div>
      <div className="mt-8">{query.isLoading ? <p>Loading fresh listings…</p> : query.isError ? <p role="alert">{query.error.message}</p> : <><ProductGrid products={products} />{query.hasNextPage ? <button className="mx-auto mt-8 block rounded-xl border border-leaf px-5 py-3 font-bold text-leaf" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? "Loading…" : "Load more products"}</button> : null}</>}</div>
    </main>
  );
}
