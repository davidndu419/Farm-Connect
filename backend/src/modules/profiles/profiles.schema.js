import {
  addressSchema,
  citySchema,
  fullNameSchema,
  nigerianStateSchema,
  phoneSchema,
  userRoleSchema
} from "@farm-connect/contracts";
import { z } from "zod";

export const profileIdParamsSchema = z.object({
  profileId: z.string().uuid()
});

export const updateProfileSchema = z
  .object({
    fullName: fullNameSchema,
    phone: phoneSchema,
    address: addressSchema,
    state: nigerianStateSchema,
    city: citySchema
  })
  .strict();

export const switchRoleSchema = z
  .object({
    role: userRoleSchema
  })
  .strict();
