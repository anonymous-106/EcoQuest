import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: "ecoquest",
          include: ["artifacts/ecoquest/src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          globals: true,
          setupFiles: [path.resolve(__dirname, "test-setup.ts")],
        },
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "artifacts/ecoquest/src"),
          },
        },
      },
      {
        test: {
          name: "api-server",
          include: ["artifacts/api-server/src/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
      },
    ],
  },
});
