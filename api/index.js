import { createApp } from "../backend/src/app.js";
import { readEnv } from "../backend/src/config/env.js";

const env = readEnv();
const app = createApp({ env });

export default app;
