import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProduct,
  listMyProducts,
  updateProductStatus
} from "../api/productsApi.js";
import { ProductGrid } from "../components/products/ProductGrid.jsx";

const actionClass =
  "rounded-md border border-ink/15 px-2 py-1 text-[11px] font-bold transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50 text-center flex items-center justify-center min-w-[65px] flex-1";

export function MyProductsPage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["my-products"],
    queryFn: listMyProducts
  });
  const [pendingProductId, setPendingProductId] = useState(null);
  const [error, setError] = useState("");

  async function refreshProducts(productId) {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["my-products"] }),
      client.invalidateQueries({ queryKey: ["products"] }),
      client.invalidateQueries({ queryKey: ["product", productId] })
    ]);
  }

  async function changeStatus(product, status) {
    setError("");
    setPendingProductId(product.id);
    try {
      await updateProductStatus(product.id, status);
      await refreshProducts(product.id);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setPendingProductId(null);
    }
  }

  async function remove(product) {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    setPendingProductId(product.id);
    try {
      await deleteProduct(product.id);
      await refreshProducts(product.id);
    } catch (caught) {
      setError(caught.message);
    } finally {
      setPendingProductId(null);
    }
  }

  function actions(product) {
    const disabled = pendingProductId === product.id;

    return (
      <>
        <Link
          className={`${actionClass} text-leaf`}
          to={`/products/${product.id}/edit`}
        >
          Edit
        </Link>
        {product.status === "active" ? (
          <>
            <button
              className={actionClass}
              disabled={disabled}
              onClick={() => changeStatus(product, "sold_out")}
              type="button"
            >
              Mark as Sold Out
            </button>
            <button
              className={actionClass}
              disabled={disabled}
              onClick={() => changeStatus(product, "archived")}
              type="button"
            >
              Archive
            </button>
          </>
        ) : null}
        {product.status === "sold_out" ? (
          <>
            <button
              className={actionClass}
              disabled={disabled}
              onClick={() => changeStatus(product, "active")}
              type="button"
            >
              Mark as Active
            </button>
            <button
              className={actionClass}
              disabled={disabled}
              onClick={() => changeStatus(product, "archived")}
              type="button"
            >
              Archive
            </button>
          </>
        ) : null}
        {product.status === "archived" ? (
          <button
            className={actionClass}
            disabled={disabled}
            onClick={() => changeStatus(product, "active")}
            type="button"
          >
            Unarchive
          </button>
        ) : null}
        <button
          className={`${actionClass} border-red-700/20 text-red-700`}
          disabled={disabled}
          onClick={() => remove(product)}
          type="button"
        >
          Delete
        </button>
      </>
    );
  }

  return (
    <main>
      <div className="mb-7 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">My products</h1>
        <Link
          className="rounded-xl bg-leaf px-4 py-3 font-bold text-white"
          to="/products/new"
        >
          Add product
        </Link>
      </div>
      {error ? (
        <p className="mb-5 rounded-xl bg-red-50 p-4 text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {query.isLoading ? <p>Loading…</p> : null}
      {query.isError ? <p role="alert">{query.error.message}</p> : null}
      {!query.isLoading && !query.isError ? (
        <ProductGrid products={query.data.data} ownerActions={actions} />
      ) : null}
    </main>
  );
}
