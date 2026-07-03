import { createApp } from "../backend/src/app.js";
import { readEnv } from "../backend/src/config/env.js";

// Boot the Express app once at module scope.
// Vercel re-uses this instance across warm invocations.
let app;
try {
  const env = readEnv();
  app = createApp({ env });
  console.log("[farm-connect] serverless handler initialised");
} catch (err) {
  // Log the full error so it appears in Vercel Function Logs.
  console.error("[farm-connect] FATAL: failed to initialise app:", err.message);
  // Fall back to a minimal handler that always returns 500 so Vercel
  // does not hang waiting for a response.
  app = (_req, res) => {
    res.status(500).json({
      error: {
        code: "STARTUP_FAILURE",
        message: "Server configuration error. Check Vercel environment variables.",
        detail: err.message
      }
    });
  };
}

export default app;
