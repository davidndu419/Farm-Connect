import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listMyProducts, updateProduct } from "../api/productsApi.js";
import { ProductForm } from "../components/products/ProductForm.jsx";
import { BackToMyProductsLink } from "../components/products/BackToMyProductsLink.jsx";

export function EditProductPage() {
  const { productId } = useParams(); const navigate = useNavigate(); const [error, setError] = useState("");
  const query = useQuery({ queryKey: ["my-products"], queryFn: listMyProducts });
  if (query.isLoading) return <section><BackToMyProductsLink /><p>Loading…</p></section>;
  const product = query.data.data.find(({ id }) => id === productId);
  if (!product) return <section><BackToMyProductsLink /><p role="alert">Owned product not found.</p></section>;
  const initial = { ...product, availableQuantity: Number(product.available_quantity) };
  async function submit(values) {
    try { const { images: _images, ...data } = values; void _images; await updateProduct(productId, data); navigate("/my-products"); } catch (caught) { setError(caught.message); }
  }
  return <section className="rounded-3xl bg-white p-7"><BackToMyProductsLink /><h1 className="mb-7 font-display text-3xl font-bold">Edit product</h1><ProductForm initialValues={initial} onSubmit={submit} />{error ? <p role="alert">{error}</p> : null}</section>;
}
