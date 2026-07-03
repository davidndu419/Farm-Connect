import { createUserSupabaseClient } from "../../config/supabase.js";
import { ApiError } from "../../utils/ApiError.js";
import { getOwnProfile, replaceAvatar } from "../profiles/profiles.service.js";

export const REFRESH_COOKIE = "fc_refresh_token";

export function refreshCookieOptions(env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000
  };
}

async function sessionPayload(env, session) {
  if (!session?.access_token || !session?.refresh_token || !session.user) {
    throw new ApiError(
      502,
      "AUTH_SESSION_MISSING",
      "Supabase did not return an active session."
    );
  }

  const userSupabase = createUserSupabaseClient(env, session.access_token);
  const profile = await getOwnProfile(userSupabase, session.user);

  return {
    user: {
      id: session.user.id,
      email: session.user.email
    },
    profile,
    accessToken: session.access_token,
    expiresAt: session.expires_at,
    refreshToken: session.refresh_token,
    userSupabase
  };
}

export async function registerAccount(env, publicSupabase, input, avatar) {
  const { data, error } = await publicSupabase.auth.signUp({
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

  if (error) {
    throw ApiError.badRequest("Registration could not be completed.");
  }

  const payload = await sessionPayload(env, data.session);
  const warnings = [];

  if (avatar) {
    try {
      payload.profile = await replaceAvatar(
        payload.userSupabase,
        data.user.id,
        avatar
      );
      payload.profile.email = data.user.email;
      payload.profile.phone = input.phone;
    } catch {
      warnings.push({
        code: "AVATAR_UPLOAD_FAILED",
        message: "Your account was created, but the avatar upload must be retried."
      });
    }
  }

  return { ...payload, warnings };
}

export async function loginAccount(env, publicSupabase, input) {
  const { data, error } = await publicSupabase.auth.signInWithPassword(input);

  if (error) {
    throw ApiError.unauthorized("Email or password is incorrect.");
  }

  return sessionPayload(env, data.session);
}

export async function refreshAccount(env, publicSupabase, refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized("A refresh session is required.");
  }

  const { data, error } = await publicSupabase.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error) {
    throw ApiError.unauthorized("The session can no longer be refreshed.");
  }

  return sessionPayload(env, data.session);
}

export async function revokeAccountSession(env, accessToken) {
  if (!accessToken) {
    return;
  }

  await fetch(`${env.SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function publicSessionPayload(payload) {
  const {
    refreshToken: _refreshToken,
    userSupabase: _userSupabase,
    warnings,
    ...publicPayload
  } = payload;
  void _refreshToken;
  void _userSupabase;

  return warnings?.length
    ? { ...publicPayload, warnings }
    : publicPayload;
}
