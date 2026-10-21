import { apiRequest } from "./httpClient.js";

function withQuery(path, values = {}) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const suffix = query.toString();
  return `${path}${suffix ? `?${suffix}` : ""}`;
}

export const getAdminOverview = () => apiRequest("/admin/overview");
export const listAdminUsers = (filters) =>
  apiRequest(withQuery("/admin/users", filters));
export const listAdminProducts = (filters) =>
  apiRequest(withQuery("/admin/products", filters));
export const listAdminConversations = (filters) =>
  apiRequest(withQuery("/admin/conversations", filters));
export const getAdminConversationMessages = (id) =>
  apiRequest(`/admin/conversations/${id}/messages?limit=100&offset=0`);
export const listAdminReports = (filters) =>
  apiRequest(withQuery("/admin/reports", filters));
export const listAdminAudit = (filters) =>
  apiRequest(withQuery("/admin/audit", filters));

export const updateAdminAccountStatus = (id, values) =>
  apiRequest(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(values)
  });

export const updateAdminMembership = (id, values) =>
  apiRequest(`/admin/users/${id}/admin`, {
    method: "PATCH",
    body: JSON.stringify(values)
  });

export const moderateAdminProduct = (id, values) =>
  apiRequest(`/admin/products/${id}/moderation`, {
    method: "PATCH",
    body: JSON.stringify(values)
  });

export const updateAdminReport = (id, values) =>
  apiRequest(`/admin/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values)
  });

export const submitUserReport = (values) =>
  apiRequest("/reports", {
    method: "POST",
    body: JSON.stringify(values)
  });
