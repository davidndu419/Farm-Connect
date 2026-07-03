import { sendData } from "../../utils/responses.js";
import * as service from "./products.service.js";

export function list(publicSupabase) {
  return async (request, response) => {
    const result = await service.listProducts(
      publicSupabase,
      request.validated.query
    );
    sendData(response, result.products, 200, result.meta);
  };
}
export function detail(publicSupabase) {
  return async (request, response) =>
    sendData(response, await service.getProduct(publicSupabase, request.params.productId));
}
export async function mine(request, response) {
  sendData(
    response,
    await service.listOwnedProducts(
      request.supabase,
      request.user.id,
      request.validated.query
    )
  );
}
export async function create(request, response) {
  sendData(response, await service.createProduct(request.supabase, request.user.id, request.body), 201);
}
export async function update(request, response) {
  sendData(response, await service.updateProduct(request.supabase, request.user.id, request.params.productId, request.body));
}
export async function updateStatus(request, response) {
  sendData(
    response,
    await service.changeProductStatus(
      request.supabase,
      request.user.id,
      request.params.productId,
      request.body.status
    )
  );
}
export async function remove(request, response) {
  await service.softDeleteProduct(request.supabase, request.user.id, request.params.productId);
  response.sendStatus(204);
}
export async function addImages(request, response) {
  sendData(response, await service.addProductImages(request.supabase, request.user.id, request.params.productId, request.files), 201);
}
export async function orderImages(request, response) {
  sendData(response, await service.reorderImages(request.supabase, request.params.productId, request.body.imageIds));
}
export async function removeImage(request, response) {
  await service.deleteProductImage(request.supabase, request.params.productId, request.params.imageId);
  response.sendStatus(204);
}
