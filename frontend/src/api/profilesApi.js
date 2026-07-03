import { apiRequest } from "./httpClient.js";

export function updateProfile(values) {
  return apiRequest("/profiles/me", {
    method: "PATCH",
    body: JSON.stringify(values)
  });
}

export function switchRole(role) {
  return apiRequest("/profiles/me/role", {
    method: "PATCH",
    body: JSON.stringify({ role })
  });
}

export function uploadAvatar(avatar) {
  const form = new FormData();
  form.append("avatar", avatar);
  return apiRequest("/profiles/me/avatar", {
    method: "POST",
    body: form
  });
}

export function deleteAvatar() {
  return apiRequest("/profiles/me/avatar", { method: "DELETE" });
}

export function getFarmerProfile(id) {
  return apiRequest(`/profiles/${id}`);
}

export function getBasicProfile(id) {
  return apiRequest(`/profiles/${id}/basic`);
}
