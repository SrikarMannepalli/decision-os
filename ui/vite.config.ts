import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const apiTarget = process.env.DECISIONOS_API_URL ?? "http://localhost:8000";

export default defineConfig({
  // The app is served from /decision-os/ (dev server, preview and GitHub Pages). Set VITE_BASE=/ to serve from the root.
  base: process.env.VITE_BASE ?? "/decision-os/",
  server: {
    // The FastAPI app has no CORS middleware, so the dev server proxies /api to it.
    proxy: { "/api": { target: apiTarget, changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, "") } },
  },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "node" },
});
