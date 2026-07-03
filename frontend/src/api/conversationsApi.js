import { apiRequest } from "./httpClient.js";
export const listConversations = () => apiRequest("/conversations");
export const getConversation = (id) => apiRequest(`/conversations/${id}`);
export const startConversation = (productId) => apiRequest("/conversations", { method: "POST", body: JSON.stringify({ productId }) });
export const markConversationRead = (id) => apiRequest(`/conversations/${id}/read`, { method: "POST" });
