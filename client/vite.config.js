import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      process: "process", // Use the root of the process package, not /browser
      buffer: "buffer", // Map buffer to the polyfill
      global: "globalthis", // Map global to globalthis
      randombytes: "randombytes", // Ensure randombytes is resolved
      util: "util", // Map util to the polyfill
      "readable-stream": "readable-stream", // Ensure readable-stream is resolved
    },
  },
  define: {
    "process.env": {}, // Define process.env for compatibility
    global: "globalThis", // Explicitly define global as globalThis for the browser
  },
  optimizeDeps: {
    include: [
      "buffer",
      "process",
      "simple-peer",
      "globalthis",
      "randombytes",
      "util",
      "readable-stream",
    ],
    force: true, // Force re-optimization of dependencies
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, // Handle mixed ES/CommonJS modules
      include: [/simple-peer/, /readable-stream/, /randombytes/, /util/, /buffer/, /process/], // Ensure all are transformed
    },
    assetsDir: "assets", // Ensure assets (like images) are output to the assets directory
  },
  server: {
    cors: true, // Ensure CORS is enabled for development
  },
  // Explicitly configure asset handling
  assetsInclude: ["**/*.png", "**/*.jpg", "**/*.jpeg", "**/*.gif", "**/*.svg"], // Include common image formats
});