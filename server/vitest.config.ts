import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 30000,
    globalSetup: ["./src/test/globalSetup.ts"],
    env: {
      DATABASE_URL: "file:./test.db",
      NODE_ENV: "test",
      VITEST: "true",
    },
    fileParallelism: false,
  },
});
