import { z } from "zod";

export const conversationIdParamsSchema = z.object({
  conversationId: z.string().uuid()
});
export const startConversationSchema = z.object({
  productId: z.string().uuid()
});
export const conversationListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20)
});
