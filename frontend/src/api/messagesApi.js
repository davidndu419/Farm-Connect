import { apiRequest } from "./httpClient.js";

export const listMessages = (id) =>
  apiRequest(`/conversations/${id}/messages`);

export function sendMessage(id, { body, image }) {
  const form = new FormData();
  if (body) form.append("body", body);
  if (image) form.append("image", image);
  return apiRequest(`/conversations/${id}/messages`, {
    method: "POST",
    body: form
  });
}
