import { z } from "zod";
import {
  NIGERIAN_STATES,
  PRODUCT_CATEGORIES,
  PRODUCT_UNITS
} from "./catalog.js";
import {
  ACCOUNT_STATUSES,
  PRODUCT_STATUSES,
  REPORT_CATEGORIES,
  REPORT_STATUSES,
  USER_ROLES
} from "./roles.js";

const trimmedString = (minimum, maximum) =>
  z.string().trim().min(minimum).max(maximum);

export const userRoleSchema = z.enum(USER_ROLES);
export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export const reportCategorySchema = z.enum(REPORT_CATEGORIES);
export const reportStatusSchema = z.enum(REPORT_STATUSES);
export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);
export const productUnitSchema = z.enum(PRODUCT_UNITS);
export const nigerianStateSchema = z.enum(NIGERIAN_STATES);
export const fullNameSchema = trimmedString(2, 100);
export const citySchema = trimmedString(2, 100);
export const addressSchema = z
  .string()
  .trim()
  .max(200)
  .refine(
    (value) => value.length === 0 || value.length >= 5,
    "Enter at least 5 characters or leave the address blank."
  );
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use an international phone number such as +2348012345678.");
export const passwordSchema = z.string().min(8).max(72);
export const productTitleSchema = trimmedString(3, 120);
export const productDescriptionSchema = trimmedString(20, 5000);
export const messageBodySchema = trimmedString(1, 2000);

export const registrationSchema = z.object({
  fullName: fullNameSchema,
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  phone: phoneSchema,
  state: nigerianStateSchema,
  city: citySchema,
  role: userRoleSchema
});

export const productInputSchema = z.object({
  title: productTitleSchema,
  description: productDescriptionSchema,
  category: productCategorySchema,
  price: z.coerce.number().positive().multipleOf(0.01),
  unit: productUnitSchema,
  availableQuantity: z.coerce.number().nonnegative().multipleOf(0.01),
  state: nigerianStateSchema,
  city: citySchema
});
