import { createUserSupabaseClient } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function authenticate(env, publicSupabase) {
  return asyncHandler(async (request, _response, next) => {
    const authorization = request.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      throw ApiError.unauthorized();
    }

    const accessToken = authorization.slice("Bearer ".length).trim();
    if (!accessToken) {
      throw ApiError.unauthorized();
    }

    const {
      data: { user },
      error
    } = await publicSupabase.auth.getUser(accessToken);

    if (error || !user) {
      throw ApiError.unauthorized("The session is invalid or has expired.");
    }

    request.accessToken = accessToken;
    request.user = user;
    request.supabase = createUserSupabaseClient(env, accessToken);
    next();
  });
}
