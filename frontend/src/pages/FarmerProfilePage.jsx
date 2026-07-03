import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { listProducts } from "../api/productsApi.js";
import { getFarmerProfile } from "../api/profilesApi.js";
import { ProductGrid } from "../components/products/ProductGrid.jsx";
import { PublicProfileCard } from "../components/profiles/PublicProfileCard.jsx";

export function FarmerProfilePage() {
  const { farmerId } = useParams();
  const navigate = useNavigate();
  const profile = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: () => getFarmerProfile(farmerId)
  });
  const products = useInfiniteQuery({
    queryKey: ["products", "farmer", farmerId],
    initialPageParam: null,
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams({ farmerId });
      if (pageParam) search.set("cursor", pageParam);
      return listProducts(search.toString());
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta?.nextCursor ?? undefined
  });

  if (profile.isLoading) {
    return <main className="p-10">Loading farmer…</main>;
  }
  if (profile.isError) {
    return (
      <main className="p-10" role="alert">
        {profile.error.message}
      </main>
    );
  }

  const farmer = profile.data.data;
  const visibleProducts = (
    products.data?.pages.flatMap((page) => page.data) ?? []
  ).filter((product) => ["active", "sold_out"].includes(product.status));

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-7 inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white/75 px-4 py-2.5 text-sm font-bold text-leaf shadow-soft transition hover:bg-white cursor-pointer"
        type="button"
      >
        <span aria-hidden="true">←</span>
        Back
      </button>

      <PublicProfileCard profile={farmer} listingsCount={visibleProducts.length} />

      <h2 className="mb-5 mt-10 font-display text-2xl font-bold">
        Visible listings
      </h2>
      {products.isLoading ? <p>Loading listings…</p> : null}
      {products.isError ? (
        <p role="alert">{products.error.message}</p>
      ) : null}
      {products.data ? <ProductGrid products={visibleProducts} /> : null}
      {products.hasNextPage ? (
        <button
          className="mx-auto mt-8 block rounded-xl border border-leaf px-5 py-3 font-bold text-leaf"
          disabled={products.isFetchingNextPage}
          onClick={() => products.fetchNextPage()}
          type="button"
        >
          {products.isFetchingNextPage
            ? "Loading…"
            : "Load more listings"}
        </button>
      ) : null}
    </main>
  );
}
