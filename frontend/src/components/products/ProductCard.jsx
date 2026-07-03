import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency.js";

const statusBadges = {
  active: {
    label: "Active",
    className: "bg-leaf/10 text-leaf border border-leaf/15"
  },
  sold_out: {
    label: "Sold out",
    className: "bg-harvest/10 text-harvest border border-harvest/15"
  },
  archived: {
    label: "Archived",
    className: "bg-ink/10 text-ink/60 border border-ink/10"
  }
};

export function ProductCard({ product, ownerActions }) {
  const image = product.product_images?.[0];
  const hasPublicDetails = ["active", "sold_out"].includes(product.status);
  const badge = statusBadges[product.status] ?? {
    label: product.status.replace("_", " "),
    className: "bg-ink/10 text-ink/60 border border-ink/10"
  };
  const media = image ? (
    <img
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      src={image.url}
      alt={image.alt_text ?? product.title}
    />
  ) : (
    <div className="flex h-full w-full flex-col items-center justify-center bg-leaf/5 text-sm font-semibold text-leaf/40">
      <svg className="size-8 mb-1.5 opacity-55" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
      </svg>
      No image
    </div>
  );

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-soft transition-all duration-300 hover:shadow-card hover:-translate-y-0.5">
      <div className="aspect-square w-full overflow-hidden bg-ink/5 relative">
        {media}
        <span
          className={`absolute top-2 right-2 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide uppercase shadow-sm z-20 ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h2 className="font-display text-sm font-bold leading-tight text-ink line-clamp-1 group-hover:text-leaf">
          {hasPublicDetails ? (
            <Link
              to={`/products/${product.id}`}
              className="focus:outline-none after:absolute after:inset-0 after:z-10"
            >
              {product.title}
            </Link>
          ) : (
            product.title
          )}
        </h2>
        <p className="mt-1 font-sans text-base font-extrabold text-leaf">
          {formatCurrency(product.price)} <span className="text-[10px] font-semibold text-ink/50">/ {product.unit}</span>
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-ink/50">
          <div className="flex items-center gap-0.5 font-medium truncate max-w-[60%]">
            <svg className="size-3 text-harvest shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate">{product.city}, {product.state}</span>
          </div>
          {product.category && (
            <span className="rounded bg-cream px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink/60 shrink-0">
              {product.category.replace("_", " ")}
            </span>
          )}
        </div>
        {ownerActions ? (
          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-ink/5 relative z-20">
            {ownerActions(product)}
          </div>
        ) : null}
      </div>
    </article>
  );
}
