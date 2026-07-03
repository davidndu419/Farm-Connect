import { describe, expect, it } from "vitest";
import { buildRegistrationForm } from "./authApi.js";

const validRegistration = {
  fullName: "David Nduka",
  phone: "+2347069971950",
  email: "davidnduka3@gmail.com",
  password: "strong-pass",
  state: "Rivers",
  city: "Port Harcourt",
  role: "Farmer"
};

describe("buildRegistrationForm", () => {
  it("sends exact backend field names and normalizes the role", () => {
    const form = buildRegistrationForm({
      ...validRegistration,
      avatar: { length: 0 }
    });

    expect(Object.fromEntries(form.entries())).toEqual({
      fullName: "David Nduka",
      email: "davidnduka3@gmail.com",
      password: "strong-pass",
      phone: "+2347069971950",
      state: "Rivers",
      city: "Port Harcourt",
      role: "farmer"
    });
    expect(form.has("avatar")).toBe(false);
  });

  it("includes avatar only when an actual file is selected", () => {
    const avatar = new File(["image bytes"], "farmer.png", {
      type: "image/png"
    });
    const form = buildRegistrationForm({
      ...validRegistration,
      role: "farmer",
      avatar
    });

    expect(form.get("avatar")).toBe(avatar);
  });
});
