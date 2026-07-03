import { registrationSchema } from "@farm-connect/contracts";
import { z } from "zod";

export const registerSchema = registrationSchema.strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1).max(72)
  })
  .strict();
