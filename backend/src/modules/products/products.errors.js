import { ApiError } from "../../utils/ApiError.js";

const schemaErrorCodes = new Set([
  "42P01",
  "42703",
  "PGRST200",
  "PGRST205"
]);

const permissionErrorCodes = new Set(["42501", "PGRST301"]);

export function marketplaceDataError(error) {
  const details = [
    {
      source: "supabase",
      path: "products",
      code: error?.code ?? "UNKNOWN",
      message: error?.message ?? "Supabase returned an unknown error."
    }
  ];

  if (schemaErrorCodes.has(error?.code)) {
    return new ApiError(
      503,
      "MARKETPLACE_SCHEMA_ERROR",
      "The marketplace database schema is not ready. Apply the latest Supabase migration.",
      details
    );
  }

  if (permissionErrorCodes.has(error?.code)) {
    return new ApiError(
      503,
      "MARKETPLACE_POLICY_ERROR",
      "Supabase denied marketplace access. Check the API key and product RLS policies.",
      details
    );
  }

  return new ApiError(
    502,
    "MARKETPLACE_DATA_ERROR",
    "Marketplace data is temporarily unavailable. Check the Supabase connection.",
    details
  );
}
