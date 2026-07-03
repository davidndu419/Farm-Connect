import { z } from "zod";
import { ApiError } from "./ApiError.js";

const cursorSchema = z.object({
  value: z.union([z.string(), z.number()]),
  id: z.string().uuid()
});

export function encodeCursor(cursor) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(cursor) {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    );
    return cursorSchema.parse(decoded);
  } catch {
    throw ApiError.badRequest("The pagination cursor is invalid.");
  }
}
