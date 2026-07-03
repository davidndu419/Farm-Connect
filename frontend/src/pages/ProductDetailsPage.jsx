import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { startConversation } from "../api/conversationsApi.js";
import { getProduct } from "../api/productsApi.js";
import { ProductDetailsBackLink } from "../components/products/ProductDetailsBackLink.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { formatCurrency } from "../utils/formatCurrency.js";

export function ProductDetailsPage() {
  const { productId } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId)
  });

  if (query.isLoading) {
    return <main className="p-10">Loading product…</main>;
  }
  if (query.isError) {
    return (
      <main className="p-10" role="alert">
        {query.error.message}
      </main>
    );
  }

  const product = query.data.data;
  const isOwner = auth.user?.id === product.farmer_id;
  const canManage = isOwner && auth.profile?.role === "farmer";

  async function openConversation() {
    const response = await startConversation(product.id);
    navigate(`/messages/${response.data.id}`);
  }

  return (
    <main
      className={
        auth.isAuthenticated
          ? "grid gap-8 lg:grid-cols-2"
          : "mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-2"
      }
    >
      <ProductDetailsBackLink canManage={canManage} />
      <div className="grid gap-3 sm:grid-cols-2">
        {product.product_images.map((image, index) => (
          <img
            className={`w-full rounded-3xl object-cover ${
              index === 0 ? "sm:col-span-2 sm:h-96" : "h-52"
            }`}
            key={image.id}
            src={image.url}
            alt={image.alt_text ?? product.title}
          />
        ))}
      </div>
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-bold uppercase tracking-wider text-harvest">
            {product.category.replace("_", " ")}
          </p>
          {product.status === "sold_out" ? (
            <span className="rounded-full bg-harvest/15 px-3 py-1 text-xs font-bold text-harvest">
              Sold out
            </span>
          ) : null}
        </div>
        <h1 className="mt-2 font-display text-4xl font-bold">
          {product.title}
        </h1>
        <p className="mt-5 text-2xl font-bold text-leaf">
          {formatCurrency(product.price)} / {product.unit}
        </p>
        <p className="mt-3">
          {product.status === "sold_out"
            ? "Currently sold out"
            : `${product.available_quantity} ${product.unit} available`}
          {" · "}
          {product.city}, {product.state}
        </p>
        <p className="mt-6 whitespace-pre-wrap leading-7 text-ink/75">
          {product.description}
        </p>
        {canManage ? (
          <Link
            className="mt-8 inline-block rounded-2xl bg-leaf px-5 py-3 font-bold text-white"
            to={`/products/${product.id}/edit`}
          >
            Edit product
          </Link>
        ) : isOwner ? (
          <Link
            className="mt-8 inline-block rounded-2xl border border-leaf px-5 py-3 font-bold text-leaf"
            to="/profile"
          >
            Switch to Farmer to manage this product
          </Link>
        ) : (
          <Link
            className="mt-8 inline-block rounded-2xl bg-leaf px-5 py-3 font-bold text-white"
            to={`/farmers/${product.profiles.id}`}
          >
            View {product.profiles.full_name}&apos;s profile
          </Link>
        )}
        {auth.profile?.role === "buyer" && !isOwner ? (
          <button
            className="ml-3 mt-8 rounded-2xl bg-harvest px-5 py-3 font-bold text-white"
            onClick={openConversation}
            type="button"
          >
            Chat with farmer
          </button>
        ) : !auth.isAuthenticated ? (
          <Link
            className="ml-3 mt-8 inline-block font-bold text-leaf underline"
            to="/login"
          >
            Log in to chat
          </Link>
        ) : null}
      </section>
    </main>
  );
}
