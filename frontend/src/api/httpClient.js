const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

let accessToken = null;
let unauthorizedHandler = null;

export function setHttpAccessToken(token) {
  accessToken = token;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }
  if (options.body && !isFormData && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    const details = payload?.error?.details;
    const validationMessage = Array.isArray(details)
      ? details
          .map((detail) =>
            detail.path ? `${detail.path}: ${detail.message}` : detail.message
          )
          .join(" ")
      : "";
    const error = new Error(
      validationMessage ||
        payload?.error?.message ||
        "The request could not be completed."
    );
    error.status = response.status;
    error.code = payload?.error?.code;
    error.details = details;
    throw error;
  }

  return payload;
}
