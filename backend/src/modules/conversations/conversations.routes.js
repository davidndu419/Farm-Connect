import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRole } from "../../middleware/authorizeRole.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as controller from "./conversations.controller.js";
import * as schema from "./conversations.schema.js";

export function createConversationsRouter({ env, publicSupabase }) {
  const router = Router(); const auth = authenticate(env, publicSupabase);
  router.use(auth);
  router.get("/", validate({ query: schema.conversationListSchema }), asyncHandler(controller.list));
  router.post("/", authorizeRole("buyer"), validate({ body: schema.startConversationSchema }), asyncHandler(controller.start));
  router.get("/:conversationId", validate({ params: schema.conversationIdParamsSchema }), asyncHandler(controller.get));
  router.post("/:conversationId/read", validate({ params: schema.conversationIdParamsSchema }), asyncHandler(controller.read));
  return router;
}
