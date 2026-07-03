import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const env = {
  NODE_ENV: "test",
  PORT: 4000,
  FRONTEND_URL: "http://localhost:5173",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "a".repeat(20),
  COOKIE_SECRET: "s".repeat(32),
  TRUST_PROXY: false,
  LOG_LEVEL: "silent"
};

describe("API foundation", () => {
  it("reports service health without exposing framework details", async () => {
    const response = await request(createApp({ env, logger: false })).get(
      "/api/v1/health"
    );

    expect(response.status).toBe(200);
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(response.body.data).toMatchObject({
      status: "ok",
      service: "farm-connect-api"
    });
  });

  it("returns the standard error envelope for unknown routes", async () => {
    const response = await request(createApp({ env, logger: false })).get(
      "/unknown"
    );

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      error: {
        code: "NOT_FOUND",
        message: "No route matches GET /unknown."
      }
    });
  });

  it("treats a missing refresh cookie as an anonymous session", async () => {
    const response = await request(createApp({ env, logger: false }))
      .post("/api/v1/auth/refresh")
      .set("Origin", env.FRONTEND_URL);

    expect(response.status).toBe(204);
  });
});
