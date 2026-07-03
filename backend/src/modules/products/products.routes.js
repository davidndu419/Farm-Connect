import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorizeRole } from "../../middleware/authorizeRole.js";
import { productImageUpload } from "../../middleware/upload.js";
import { searchLimiter, uploadLimiter } from "../../middleware/rateLimiters.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as controller from "./products.controller.js";
import * as schema from "./products.schema.js";

export function createProductsRouter({ env, publicSupabase }) {
  const router = Router();
  const auth = authenticate(env, publicSupabase);
  const farmer = authorizeRole("farmer");

  router.get("/", searchLimiter, validate({ query: schema.productListQuerySchema }), asyncHandler(controller.list(publicSupabase)));
  router.get("/mine", auth, validate({ query: schema.mineQuerySchema }), asyncHandler(controller.mine));
  router.get("/:productId", validate({ params: schema.productIdParamsSchema }), asyncHandler(controller.detail(publicSupabase)));
  router.post("/", auth, farmer, validate({ body: schema.createProductSchema }), asyncHandler(controller.create));
  router.patch("/:productId/status", auth, farmer, validate({ params: schema.productIdParamsSchema, body: schema.updateProductStatusSchema }), asyncHandler(controller.updateStatus));
  router.patch("/:productId", auth, farmer, validate({ params: schema.productIdParamsSchema, body: schema.updateProductSchema }), asyncHandler(controller.update));
  router.delete("/:productId", auth, farmer, validate({ params: schema.productIdParamsSchema }), asyncHandler(controller.remove));
  router.post("/:productId/images", auth, farmer, uploadLimiter, validate({ params: schema.productIdParamsSchema }), productImageUpload, asyncHandler(controller.addImages));
  router.patch("/:productId/images/order", auth, farmer, validate({ params: schema.productIdParamsSchema, body: schema.reorderImagesSchema }), asyncHandler(controller.orderImages));
  router.delete("/:productId/images/:imageId", auth, farmer, validate({ params: schema.imageParamsSchema }), asyncHandler(controller.removeImage));
  return router;
}
