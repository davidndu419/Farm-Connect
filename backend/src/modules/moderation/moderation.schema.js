import {
  accountStatusSchema,
  reportCategorySchema,
  reportStatusSchema,
  userRoleSchema
} from "@farm-connect/contracts";
import { z } from "zod";

const optionalUuid = z.string().uuid().optional();
const reasonSchema = z.string().trim().min(5).max(500);

export const reportUserSchema = z
  .object({
    reportedUserId: z.string().uuid(),
    category: reportCategorySchema,
    details: z.string().trim().min(10).max(1000),
    conversationId: optionalUuid,
    messageId: optionalUuid
  })
  .strict()
  .refine((value) => !value.messageId || value.conversationId, {
    path: ["conversationId"],
    message: "A conversation is required when message evidence is included."
  });

export const userIdParamsSchema = z.object({ userId: z.string().uuid() });
export const productIdParamsSchema = z.object({ productId: z.string().uuid() });
export const reportIdParamsSchema = z.object({ reportId: z.string().uuid() });
export const conversationIdParamsSchema = z.object({
  conversationId: z.string().uuid()
});

const paginationFields = {
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0)
};

export const usersQuerySchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    status: z.union([z.literal("all"), accountStatusSchema]).default("all"),
    role: z.union([z.literal("all"), userRoleSchema]).default("all"),
    admin: z.enum(["all", "admin", "user"]).default("all"),
    ...paginationFields
  })
  .strict();

export const productsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    status: z
      .enum(["all", "draft", "active", "sold_out", "archived", "deleted"])
      .default("all"),
    moderation: z.enum(["all", "visible", "hidden"]).default("all"),
    ...paginationFields
  })
  .strict();

export const conversationsQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    ...paginationFields
  })
  .strict();

export const reportsQuerySchema = z
  .object({
    status: z.union([z.literal("all"), reportStatusSchema]).default("all"),
    ...paginationFields
  })
  .strict();

export const paginationQuerySchema = z.object(paginationFields).strict();

export const accountStatusUpdateSchema = z
  .object({
    status: accountStatusSchema,
    reason: reasonSchema
  })
  .strict();

export const membershipUpdateSchema = z
  .object({
    isAdmin: z.boolean(),
    reason: reasonSchema
  })
  .strict();

export const productModerationSchema = z
  .object({
    hidden: z.boolean(),
    reason: reasonSchema
  })
  .strict();

export const reportUpdateSchema = z
  .object({
    status: z.enum(["reviewing", "resolved", "dismissed"]),
    resolutionNotes: z.string().trim().max(1000).default("")
  })
  .strict()
  .refine(
    (value) =>
      value.status === "reviewing" || value.resolutionNotes.length >= 5,
    {
      path: ["resolutionNotes"],
      message: "Enter at least 5 characters when closing a report."
    }
  );
