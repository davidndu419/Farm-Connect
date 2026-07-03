import { Link } from "react-router-dom";

export function BackToMyProductsLink() {
  return (
    <Link
      className="mb-7 inline-flex w-fit items-center gap-2 rounded-xl border border-ink/10 bg-cream/70 px-4 py-2.5 text-sm font-bold text-leaf transition hover:bg-cream"
      to="/my-products"
    >
      <span aria-hidden="true">←</span>
      Back to my products
    </Link>
  );
}
