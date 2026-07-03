import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { avatarUpload } from "../../middleware/upload.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  getMe,
  getBasicProfile,
  getPublicProfile,
  removeMyAvatar,
  switchRole,
  updateMe,
  uploadMyAvatar
} from "./profiles.controller.js";
import {
  profileIdParamsSchema,
  switchRoleSchema,
  updateProfileSchema
} from "./profiles.schema.js";

export function createProfilesRouter({ env, publicSupabase }) {
  const router = Router();
  const requireAuth = authenticate(env, publicSupabase);

  router.get("/me", requireAuth, asyncHandler(getMe));
  router.patch(
    "/me",
    requireAuth,
    validate({ body: updateProfileSchema }),
    asyncHandler(updateMe)
  );
  router.patch(
    "/me/role",
    requireAuth,
    validate({ body: switchRoleSchema }),
    asyncHandler(switchRole)
  );
  router.post(
    "/me/avatar",
    requireAuth,
    avatarUpload,
    asyncHandler(uploadMyAvatar)
  );
  router.delete("/me/avatar", requireAuth, asyncHandler(removeMyAvatar));
  router.get(
    "/:profileId/basic",
    requireAuth,
    validate({ params: profileIdParamsSchema }),
    asyncHandler(getBasicProfile)
  );
  router.get(
    "/:profileId",
    validate({ params: profileIdParamsSchema }),
    asyncHandler(getPublicProfile(publicSupabase))
  );

  return router;
}
