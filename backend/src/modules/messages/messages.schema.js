import { messageBodySchema } from "@farm-connect/contracts";
import { z } from "zod";

export const messageParamsSchema = z.object({
  conversationId: z.string().uuid()
});

export const messageListSchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30)
});

export const sendMessageSchema = z
  .object({
    body: messageBodySchema.optional()
  })
  .strict();
