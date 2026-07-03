import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnProfile: vi.fn(),
  replaceAvatar: vi.fn(),
  userClient: { from: vi.fn() }
}));

vi.mock("../src/config/supabase.js", () => ({
  createUserSupabaseClient: vi.fn(() => mocks.userClient)
}));

vi.mock("../src/modules/profiles/profiles.service.js", () => ({
  getOwnProfile: mocks.getOwnProfile,
  replaceAvatar: mocks.replaceAvatar
}));

import {
  loginAccount,
  publicSessionPayload,
  refreshCookieOptions,
  registerAccount
} from "../src/modules/auth/auth.service.js";

const env = {
  NODE_ENV: "production",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "a".repeat(20)
};

const session = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expires_at: 123456,
  user: {
    id: "10000000-0000-4000-8000-000000000001",
    email: "ada@example.com"
  }
};

describe("authentication service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getOwnProfile.mockResolvedValue({
      id: session.user.id,
      role: "farmer"
    });
  });

  it("passes only validated profile metadata to Supabase signup", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { session, user: session.user },
      error: null
    });
    const publicSupabase = { auth: { signUp } };
    const input = {
      fullName: "Ada Farmer",
      email: "ada@example.com",
      password: "strong-pass",
      phone: "+2348012345678",
      state: "Enugu",
      city: "Nsukka",
      role: "farmer"
    };

    const result = await registerAccount(env, publicSupabase, input);

    expect(signUp).toHaveBeenCalledWith({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone,
          state: input.state,
          city: input.city,
          role: input.role
        }
      }
    });
    expect(publicSessionPayload(result)).not.toHaveProperty("refreshToken");
    expect(publicSessionPayload(result)).not.toHaveProperty("userSupabase");
  });

  it("uses a generic error for invalid login credentials", async () => {
    const publicSupabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {},
          error: new Error("specific provider detail")
        })
      }
    };

    await expect(
      loginAccount(env, publicSupabase, {
        email: "ada@example.com",
        password: "wrong-password"
      })
    ).rejects.toThrow("Email or password is incorrect.");
  });

  it("uses a secure, HTTP-only production refresh cookie", () => {
    expect(refreshCookieOptions(env)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/api"
    });
  });
});
