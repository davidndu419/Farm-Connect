import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export function authorizeRole(...roles) {
  return asyncHandler(async (request, _response, next) => {
    if (!request.user || !request.supabase) {
      throw ApiError.unauthorized();
    }

    const { data: profile, error } = await request.supabase
      .from("profiles")
      .select("id, role")
      .eq("id", request.user.id)
      .single();

    if (error || !profile) {
      throw ApiError.unauthorized("A valid profile is required.");
    }

    if (!roles.includes(profile.role)) {
      throw ApiError.forbidden(
        `This action requires the ${roles.join(" or ")} role.`
      );
    }

    request.profile = profile;
    next();
  });
}
