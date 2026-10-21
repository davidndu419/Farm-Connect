import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeAdmin } from "../../middleware/authorizeAdmin.js";
import { reportLimiter } from "../../middleware/rateLimiters.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as controller from "./moderation.controller.js";
import * as schema from "./moderation.schema.js";

export function createReportsRouter({ env, publicSupabase }) {
  const router = Router();
  router.post(
    "/",
    authenticate(env, publicSupabase),
    reportLimiter,
    validate({ body: schema.reportUserSchema }),
    asyncHandler(controller.submitReport)
  );
  return router;
}

export function createAdminRouter({ env, publicSupabase }) {
  const router = Router();
  router.use(authenticate(env, publicSupabase), authorizeAdmin);

  router.get("/overview", asyncHandler(controller.dashboard));
  router.get(
    "/users",
    validate({ query: schema.usersQuerySchema }),
    asyncHandler(controller.users)
  );
  router.patch(
    "/users/:userId/status",
    validate({ params: schema.userIdParamsSchema, body: schema.accountStatusUpdateSchema }),
    asyncHandler(controller.accountStatus)
  );
  router.patch(
    "/users/:userId/admin",
    validate({ params: schema.userIdParamsSchema, body: schema.membershipUpdateSchema }),
    asyncHandler(controller.membership)
  );
  router.get(
    "/products",
    validate({ query: schema.productsQuerySchema }),
    asyncHandler(controller.products)
  );
  router.patch(
    "/products/:productId/moderation",
    validate({ params: schema.productIdParamsSchema, body: schema.productModerationSchema }),
    asyncHandler(controller.productModeration)
  );
  router.get(
    "/conversations",
    validate({ query: schema.conversationsQuerySchema }),
    asyncHandler(controller.conversations)
  );
  router.get(
    "/conversations/:conversationId/messages",
    validate({ params: schema.conversationIdParamsSchema, query: schema.paginationQuerySchema }),
    asyncHandler(controller.messages)
  );
  router.get(
    "/reports",
    validate({ query: schema.reportsQuerySchema }),
    asyncHandler(controller.reports)
  );
  router.patch(
    "/reports/:reportId",
    validate({ params: schema.reportIdParamsSchema, body: schema.reportUpdateSchema }),
    asyncHandler(controller.reportStatus)
  );
  router.get(
    "/audit",
    validate({ query: schema.paginationQuerySchema }),
    asyncHandler(controller.audit)
  );

  return router;
}
