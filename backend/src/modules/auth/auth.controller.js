import { ApiError } from "../../utils/ApiError.js";
import { sendData } from "../../utils/responses.js";
import {
  REFRESH_COOKIE,
  loginAccount,
  publicSessionPayload,
  refreshAccount,
  refreshCookieOptions,
  registerAccount,
  revokeAccountSession
} from "./auth.service.js";

function setSessionCookie(response, env, token) {
  response.cookie(REFRESH_COOKIE, token, refreshCookieOptions(env));
}

function clearSessionCookie(response, env) {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions(env);
  void _maxAge;
  response.clearCookie(REFRESH_COOKIE, options);
}

export function register(env, publicSupabase) {
  return async function registerUser(request, response) {
    const session = await registerAccount(
      env,
      publicSupabase,
      request.body,
      request.file
    );
    setSessionCookie(response, env, session.refreshToken);
    sendData(response, publicSessionPayload(session), 201);
  };
}

export function login(env, publicSupabase) {
  return async function loginUser(request, response) {
    const session = await loginAccount(env, publicSupabase, request.body);
    setSessionCookie(response, env, session.refreshToken);
    sendData(response, publicSessionPayload(session));
  };
}

export function refresh(env, publicSupabase) {
  return async function refreshUser(request, response) {
    if (!request.cookies[REFRESH_COOKIE]) {
      return response.sendStatus(204);
    }

    const session = await refreshAccount(
      env,
      publicSupabase,
      request.cookies[REFRESH_COOKIE]
    );
    setSessionCookie(response, env, session.refreshToken);
    return sendData(response, publicSessionPayload(session));
  };
}

export function logout(env) {
  return async function logoutUser(request, response) {
    const authorization = request.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : null;

    try {
      await revokeAccountSession(env, accessToken);
    } finally {
      clearSessionCookie(response, env);
    }
    response.sendStatus(204);
  };
}

export function requireTrustedOrigin(env) {
  return function trustedOrigin(request, _response, next) {
    const origin = request.get("origin");
    if (origin && origin !== env.FRONTEND_URL) {
      return next(ApiError.forbidden("The request origin is not trusted."));
    }
    return next();
  };
}
