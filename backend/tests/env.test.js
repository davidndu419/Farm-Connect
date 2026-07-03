import { describe, expect, it } from "vitest";
import { readEnv } from "../src/config/env.js";

const validEnv = {
  NODE_ENV: "test",
  PORT: "4000",
  FRONTEND_URL: "http://localhost:5173",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "a".repeat(20),
  COOKIE_SECRET: "s".repeat(32)
};

describe("readEnv", () => {
  it("parses a complete environment", () => {
    expect(readEnv(validEnv).PORT).toBe(4000);
  });

  it("fails fast when a secret is too short", () => {
    expect(() =>
      readEnv({ ...validEnv, COOKIE_SECRET: "short" })
    ).toThrow(/COOKIE_SECRET/);
  });
});
