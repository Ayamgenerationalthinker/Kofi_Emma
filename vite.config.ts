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
        name: "Kofi Emma (Abele Drums Coach)",
        short_name: "Abele Drums Coach",
        description:
          "Premium Ghanaian gospel drum practice coach. 100% client-side — your practice data never leaves this device.",
        theme_color: "#0B0B0C",
        background_color: "#0B0B0C",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml" },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
      workbox: {
        // There is no backend to talk to — everything the app needs (the
        // curriculum content and the app shell) is bundled at build time,
        // so a plain cache-first precache of the build output is all that
        // is required for full offline use.
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
  },
});
