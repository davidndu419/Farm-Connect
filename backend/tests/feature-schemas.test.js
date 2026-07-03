import { describe, expect, it } from "vitest";
import { registerSchema } from "../src/modules/auth/auth.schema.js";
import { sendMessageSchema } from "../src/modules/messages/messages.schema.js";
import { updateProfileSchema } from "../src/modules/profiles/profiles.schema.js";
import {
  createProductSchema,
  mineQuerySchema,
  productListQuerySchema,
  updateProductSchema,
  updateProductStatusSchema
} from "../src/modules/products/products.schema.js";

describe("feature request schemas", () => {
  it("accepts the Nigerian registration values sent by the frontend", () => {
    const registration = registerSchema.parse({
      fullName: "David Nduka",
      phone: "+2347069971950",
      email: "davidnduka3@gmail.com",
      password: "strong-pass",
      state: "Rivers",
      city: "Port Harcourt",
      role: "farmer"
    });

    expect(registration.role).toBe("farmer");
    expect(registration.state).toBe("Rivers");
    expect(registration.phone).toBe("+2347069971950");
  });

  it("normalizes a valid controlled product payload", () => {
    const product = createProductSchema.parse({
      title: "Fresh yam tubers",
      description: "Freshly harvested yam tubers ready for collection.",
      category: "tubers",
      price: "18000.00",
      unit: "basket",
      availableQuantity: "8",
      state: "Benue",
      city: "Makurdi"
    });

    expect(product.price).toBe(18000);
    expect(product.availableQuantity).toBe(8);
  });

  it("rejects unknown marketplace categories", () => {
    expect(
      productListQuerySchema.safeParse({ category: "not-a-category" }).success
    ).toBe(false);
  });

  it("accepts only farmer-visible lifecycle statuses", () => {
    expect(
      updateProductStatusSchema.parse({ status: "sold_out" }).status
    ).toBe("sold_out");
    expect(
      updateProductStatusSchema.safeParse({ status: "deleted" }).success
    ).toBe(false);
    expect(
      updateProductStatusSchema.safeParse({ status: "draft" }).success
    ).toBe(false);
    expect(mineQuerySchema.safeParse({ status: "archived" }).success).toBe(
      true
    );
    expect(mineQuerySchema.safeParse({ status: "deleted" }).success).toBe(
      false
    );
    expect(
      updateProductSchema.safeParse({ status: "archived" }).success
    ).toBe(false);
  });

  it("validates editable profile contact and address fields", () => {
    const profile = updateProfileSchema.parse({
      fullName: "Ada Farmer",
      phone: "+2348012345678",
      address: "8 Market Road",
      state: "Enugu",
      city: "Nsukka"
    });

    expect(profile.address).toBe("8 Market Road");
    expect(
      updateProfileSchema.safeParse({ ...profile, address: "No" }).success
    ).toBe(false);
    expect(
      updateProfileSchema.safeParse({ ...profile, address: "" }).success
    ).toBe(true);
  });

  it("rejects blank and oversized messages", () => {
    expect(sendMessageSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(
      false
    );
  });
});
