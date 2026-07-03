import { createApp } from "./app.js";
import { readEnv } from "./config/env.js";

const env = readEnv();
const app = createApp({ env });

const server = app.listen(env.PORT, () => {
  console.log(`Farm Connect API listening on port ${env.PORT}.`);
});

function shutDown(signal) {
  console.log(`${signal} received; closing the HTTP server.`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));
