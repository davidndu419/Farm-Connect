import { describe, expect, it } from "vitest";
import { registrationSchema } from "./validation.js";

describe("registrationSchema", () => {
  it("normalizes a valid registration", () => {
    const result = registrationSchema.parse({
      fullName: "  Ada Farmer  ",
      email: "ADA@EXAMPLE.COM",
      password: "strong-pass",
      phone: "+2348012345678",
      state: "Enugu",
      city: "Nsukka",
      role: "farmer"
    });

    expect(result.fullName).toBe("Ada Farmer");
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects a phone number that is not E.164", () => {
    const result = registrationSchema.safeParse({
      fullName: "Ada Farmer",
      email: "ada@example.com",
      password: "strong-pass",
      phone: "08012345678",
      state: "Enugu",
      city: "Nsukka",
      role: "farmer"
    });

    expect(result.success).toBe(false);
  });
});
