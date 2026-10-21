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

    const userSupabase = createUserSupabaseClient(env, accessToken);
    const { data: account, error: accountError } = await userSupabase
      .from("profiles")
      .select("id, account_status, restriction_reason")
      .eq("id", user.id)
      .single();

    if (accountError || !account) {
      throw ApiError.unauthorized("A valid account profile is required.");
    }

    if (account.account_status === "suspended") {
      throw new ApiError(
        403,
        "ACCOUNT_SUSPENDED",
        account.restriction_reason
          ? `This account is suspended. ${account.restriction_reason}`
          : "This account is suspended."
      );
    }

    if (
      account.account_status === "frozen" &&
      !["GET", "HEAD", "OPTIONS"].includes(request.method)
    ) {
      throw new ApiError(
        403,
        "ACCOUNT_FROZEN",
        account.restriction_reason
          ? `This account is in read-only mode. ${account.restriction_reason}`
          : "This account is in read-only mode."
      );
    }

    request.accessToken = accessToken;
    request.user = user;
    request.account = account;
    request.supabase = userSupabase;
    next();
  });
}
