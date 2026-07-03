import { ProductCard } from "./ProductCard.jsx";

export function ProductGrid({ products, ownerActions }) {
  if (!products?.length) return <p className="rounded-3xl bg-white p-8 text-center text-ink/60">No products match this view.</p>;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} ownerActions={ownerActions} />
      ))}
    </div>
  );
}
