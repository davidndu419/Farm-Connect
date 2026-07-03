import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct, updateProductStatus, uploadProductImages } from "../api/productsApi.js";
import { ProductForm } from "../components/products/ProductForm.jsx";
import { BackToMyProductsLink } from "../components/products/BackToMyProductsLink.jsx";

export function AddProductPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  async function submit(values) {
    const files = [...values.images];
    if (!files.length) return setError("Add at least one product image.");
    try {
      const { images: _images, ...productValues } = values;
      void _images;
      const draft = (await createProduct(productValues)).data;
      await uploadProductImages(draft.id, files);
      await updateProductStatus(draft.id, "active");
      navigate(`/products/${draft.id}`);
    } catch (caught) { setError(caught.message); }
  }
  return <section className="rounded-3xl bg-white p-7 shadow-soft"><BackToMyProductsLink /><h1 className="font-display text-3xl font-bold">List a product</h1><p className="mt-2 mb-7 text-ink/60">Your draft becomes public after its images upload successfully.</p><ProductForm onSubmit={submit} submitLabel="Publish product" />{error ? <p className="mt-4 text-red-700" role="alert">{error}</p> : null}</section>;
}
