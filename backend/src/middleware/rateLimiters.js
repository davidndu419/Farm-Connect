import { rateLimit } from "express-rate-limit";

function createLimiter(windowMs, limit, message) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: {
        code: "RATE_LIMITED",
        message
      }
    }
  });
}

export const authenticationLimiter = createLimiter(
  15 * 60 * 1000,
  20,
  "Too many authentication attempts. Please try again later."
);

export const searchLimiter = createLimiter(
  60 * 1000,
  120,
  "Too many marketplace requests. Please slow down."
);

export const uploadLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  "Too many upload attempts. Please try again later."
);

export const messageLimiter = createLimiter(
  60 * 1000,
  60,
  "Messages are being sent too quickly. Please slow down."
);
