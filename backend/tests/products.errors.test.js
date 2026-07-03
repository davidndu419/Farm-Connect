import { describe, expect, it } from "vitest";
import { marketplaceDataError } from "../src/modules/products/products.errors.js";

describe("marketplaceDataError", () => {
  it("identifies an unapplied marketplace migration", () => {
    const error = marketplaceDataError({
      code: "PGRST205",
      message: "Could not find the table public.products in the schema cache"
    });

    expect(error.status).toBe(503);
    expect(error.code).toBe("MARKETPLACE_SCHEMA_ERROR");
    expect(error.message).toMatch(/Apply the latest Supabase migration/);
  });

  it("identifies Supabase policy or key failures", () => {
    const error = marketplaceDataError({
      code: "42501",
      message: "permission denied for table products"
    });

    expect(error.status).toBe(503);
    expect(error.code).toBe("MARKETPLACE_POLICY_ERROR");
    expect(error.message).toMatch(/RLS policies/);
  });
});
