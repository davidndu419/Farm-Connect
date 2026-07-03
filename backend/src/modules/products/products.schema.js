import {
  nigerianStateSchema,
  productCategorySchema,
  productInputSchema,
  productUnitSchema
} from "@farm-connect/contracts";
import { z } from "zod";

const managedProductStatusSchema = z.enum([
  "active",
  "sold_out",
  "archived"
]);

export const productIdParamsSchema = z.object({
  productId: z.string().uuid()
});

export const imageParamsSchema = productIdParamsSchema.extend({
  imageId: z.string().uuid()
});

export const createProductSchema = productInputSchema.strict();

export const updateProductSchema = productInputSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one change.");

export const updateProductStatusSchema = z
  .object({
    status: managedProductStatusSchema
  })
  .strict();

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().uuid()).min(1).max(5)
});

export const productListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: productCategorySchema.optional(),
  state: nigerianStateSchema.optional(),
  city: z.string().trim().max(100).optional(),
  unit: productUnitSchema.optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  farmerId: z.string().uuid().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const mineQuerySchema = z.object({
  status: managedProductStatusSchema.optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
