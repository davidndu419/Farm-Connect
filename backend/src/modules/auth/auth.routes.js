import { Router } from "express";
import { authenticationLimiter } from "../../middleware/rateLimiters.js";
import { avatarUpload } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  login,
  logout,
  refresh,
  register,
  requireTrustedOrigin
} from "./auth.controller.js";
import { loginSchema, registerSchema } from "./auth.schema.js";

export function createAuthRouter({ env, publicSupabase }) {
  const router = Router();
  const trustedOrigin = requireTrustedOrigin(env);

  router.post(
    "/register",
    authenticationLimiter,
    avatarUpload,
    validate({ body: registerSchema }),
    asyncHandler(register(env, publicSupabase))
  );
  router.post(
    "/login",
    authenticationLimiter,
    validate({ body: loginSchema }),
    asyncHandler(login(env, publicSupabase))
  );
  router.post(
    "/refresh",
    authenticationLimiter,
    trustedOrigin,
    asyncHandler(refresh(env, publicSupabase))
  );
  router.post("/logout", trustedOrigin, asyncHandler(logout(env)));

  return router;
}
