import { defineConfig } from "@rstest/core";

export default defineConfig({
  globals: true,
  testEnvironment: "node",
  include: ["tests/**/*.spec.ts"],
  exclude: ["**/node_modules/**", "**/dist/**"],
});
