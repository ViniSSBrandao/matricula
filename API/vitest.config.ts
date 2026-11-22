import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["tests/**/*.test.ts", "prisma/**/*.test.ts"],
    globalSetup: ["tests/setup/test-db.global.ts"],
    setupFiles: ["tests/setup/vitest.env.ts"],
    testTimeout: 30000,
    fileParallelism: false,
  },
});
