import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authorizeAdmin = asyncHandler(async (request, _response, next) => {
  if (!request.user || !request.supabase) {
    throw ApiError.unauthorized();
  }

  const { data, error } = await request.supabase.rpc("get_my_account_access");

  if (error || !data?.isAdmin || data.accountStatus !== "active") {
    throw ApiError.forbidden("Administrator access is required.");
  }

  request.adminAccess = data;
  next();
});
