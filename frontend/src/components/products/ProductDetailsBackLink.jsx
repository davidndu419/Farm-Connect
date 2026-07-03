import { Link } from "react-router-dom";

export function ProductDetailsBackLink({ canManage }) {
  return (
    <Link
      className="inline-flex w-fit items-center gap-2 rounded-xl border border-ink/10 bg-white/75 px-4 py-2.5 text-sm font-bold text-leaf shadow-soft transition hover:bg-white lg:col-span-2"
      to={canManage ? "/my-products" : "/marketplace"}
    >
      <span aria-hidden="true">←</span>
      {canManage ? "Back to my products" : "Back to marketplace"}
    </Link>
  );
}
