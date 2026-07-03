import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { chatImageUpload } from "../../middleware/upload.js";
import { messageLimiter } from "../../middleware/rateLimiters.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as controller from "./messages.controller.js";
import * as schema from "./messages.schema.js";

export function createMessagesRouter({ env, publicSupabase }) {
  const router = Router({ mergeParams: true });
  const auth = authenticate(env, publicSupabase);

  router.get(
    "/",
    auth,
    validate({
      params: schema.messageParamsSchema,
      query: schema.messageListSchema
    }),
    asyncHandler(controller.list)
  );
  router.post(
    "/",
    auth,
    messageLimiter,
    validate({ params: schema.messageParamsSchema }),
    chatImageUpload,
    validate({ body: schema.sendMessageSchema }),
    asyncHandler(controller.send)
  );

  return router;
}
