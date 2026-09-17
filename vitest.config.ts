import path from "node:path"
import dotenv from "dotenv"
import { defineConfig } from "vitest/config"

dotenv.config({ path: ".env.local" })

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["domain/**/*.test.ts", "lib/**/*.test.ts", "tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
})
