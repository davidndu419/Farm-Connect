import { apiRequest } from "./httpClient.js";

let refreshPromise;

export function buildRegistrationForm(values) {
  const form = new FormData();

  const fields = {
    fullName: values.fullName,
    email: values.email,
    password: values.password,
    phone: values.phone,
    state: values.state,
    city: values.city,
    role: String(values.role ?? "").trim().toLowerCase()
  };

  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value ?? "");
  }

  const avatar =
    typeof File !== "undefined" && values.avatar instanceof File
      ? values.avatar
      : values.avatar?.[0];

  if (typeof File !== "undefined" && avatar instanceof File && avatar.size > 0) {
    form.append("avatar", avatar);
  }

  return form;
}

export function registerAccount(values) {
  const form = buildRegistrationForm(values);
  return apiRequest("/auth/register", { method: "POST", body: form });
}

export function loginAccount(values) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(values)
  });
}

export function refreshAccount() {
  if (!refreshPromise) {
    refreshPromise = apiRequest("/auth/refresh", { method: "POST" }).finally(
      () => {
        refreshPromise = null;
      }
    );
  }
  return refreshPromise;
}

export function logoutAccount() {
  return apiRequest("/auth/logout", { method: "POST" });
}
