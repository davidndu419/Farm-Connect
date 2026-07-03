import { apiRequest } from "./httpClient.js";

export function listProducts(search = "") {
  return apiRequest(`/products${search ? `?${search}` : ""}`);
}
export function getProduct(id) {
  return apiRequest(`/products/${id}`);
}
export function listMyProducts() {
  return apiRequest("/products/mine?limit=50");
}
export function createProduct(values) {
  return apiRequest("/products", { method: "POST", body: JSON.stringify(values) });
}
export function updateProduct(id, values) {
  return apiRequest(`/products/${id}`, { method: "PATCH", body: JSON.stringify(values) });
}
export function updateProductStatus(id, status) {
  return apiRequest(`/products/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
export function deleteProduct(id) {
  return apiRequest(`/products/${id}`, { method: "DELETE" });
}
export function uploadProductImages(id, files) {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return apiRequest(`/products/${id}/images`, { method: "POST", body: form });
}
export function deleteProductImage(productId, imageId) {
  return apiRequest(`/products/${productId}/images/${imageId}`, { method: "DELETE" });
}
