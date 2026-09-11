import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "Gospel Drum Coach — The Kofi Emma Method",
        short_name: "Drum Coach",
        description: "A disciplined, local-first gospel drum practice coach.",
        theme_color: "#0B0B0C",
        background_color: "#0B0B0C",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml" },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        // The dashboard, curriculum, metronome, and shell are cached for
        // offline use (section 33). Mutable API GETs use a short-lived
        // network-first strategy instead of an indefinite cache-first one
        // (section 109) so stale curriculum/progress data self-heals as
        // soon as connectivity returns.
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: /\/api\/(curriculum|exercises)/,
            handler: "NetworkFirst",
            options: { cacheName: "api-curriculum", networkTimeoutSeconds: 3, expiration: { maxAgeSeconds: 3600 } },
          },
          {
            urlPattern: /\/api\/(profile|progress|practice\/today)/,
            handler: "NetworkFirst",
            options: { cacheName: "api-state", networkTimeoutSeconds: 3, expiration: { maxAgeSeconds: 300 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
  },
});
