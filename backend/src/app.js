import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { createPublicSupabaseClient } from "./config/supabase.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { requestId } from "./middleware/requestId.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createProfilesRouter } from "./modules/profiles/profiles.routes.js";
import { createProductsRouter } from "./modules/products/products.routes.js";
import { createConversationsRouter } from "./modules/conversations/conversations.routes.js";
import { createMessagesRouter } from "./modules/messages/messages.routes.js";
import {
  createAdminRouter,
  createReportsRouter
} from "./modules/moderation/moderation.routes.js";

export function createApp({ env, publicSupabase, logger = true } = {}) {
  if (!env) {
    throw new Error("createApp requires validated environment configuration.");
  }

  const app = express();
  const supabase = publicSupabase ?? createPublicSupabaseClient(env);

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  app.use(requestId);
  app.use(
    pinoHttp({
      enabled: logger,
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers.set-cookie"
        ],
        censor: "[REDACTED]"
      },
      customProps: (request) => ({ requestId: request.id })
    })
  );
  app.use(
    helmet()
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === env.FRONTEND_URL) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["authorization", "content-type", "x-request-id"]
    })
  );
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(express.json({ limit: "100kb" }));

  app.locals.env = env;
  app.locals.supabase = supabase;

  app.use("/api/v1/health", createHealthRouter());
  app.use("/api/v1/auth", createAuthRouter({ env, publicSupabase: supabase }));
  app.use(
    "/api/v1/profiles",
    createProfilesRouter({ env, publicSupabase: supabase })
  );
  app.use(
    "/api/v1/products",
    createProductsRouter({ env, publicSupabase: supabase })
  );
  app.use(
    "/api/v1/conversations/:conversationId/messages",
    createMessagesRouter({ env, publicSupabase: supabase })
  );
  app.use(
    "/api/v1/conversations",
    createConversationsRouter({ env, publicSupabase: supabase })
  );
  app.use(
    "/api/v1/reports",
    createReportsRouter({ env, publicSupabase: supabase })
  );
  app.use(
    "/api/v1/admin",
    createAdminRouter({ env, publicSupabase: supabase })
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
