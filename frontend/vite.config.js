import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function listBuildFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? listBuildFiles(absolutePath, root)
        : path.relative(root, absolutePath).replaceAll("\\", "/");
    })
  );

  return files.flat();
}

function injectServiceWorkerPrecache() {
  return {
    name: "farm-connect-service-worker-precache",
    apply: "build",
    async closeBundle() {
      const outputDirectory = path.resolve("dist");
      const serviceWorkerPath = path.join(outputDirectory, "sw.js");
      const files = await listBuildFiles(outputDirectory);
      const precacheUrls = files
        .filter((file) => file !== "sw.js")
        .map((file) => `/${file}`);
      const source = await readFile(serviceWorkerPath, "utf8");

      await writeFile(
        serviceWorkerPath,
        source
          .replace("__BUILD_ID__", Date.now().toString(36))
          .replace(
            '["__PRECACHE_URLS__"]',
            JSON.stringify(precacheUrls)
          ),
        "utf8"
      );
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), injectServiceWorkerPrecache()],
  server: {
    port: 5173
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true
  }
});
