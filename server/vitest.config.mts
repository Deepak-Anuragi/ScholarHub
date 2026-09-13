import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // An in-memory MongoDB is started once and shared, and each file resets
    // the collections it uses, so the files must not interleave.
    fileParallelism: false,
    setupFiles: ["src/test/setup.ts"],
    globalSetup: ["src/test/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000, // first run downloads the mongod binary
  },
});
