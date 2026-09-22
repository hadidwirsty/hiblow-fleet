import { describe, expect, it } from "vitest"

import { validateDeploymentEnv } from "@/lib/deployment/env-validator"

describe("validateDeploymentEnv", () => {
  const validEnv = {
    DATABASE_URL:
      "postgresql://user:pass@ep-cool-12345-pooler.neon.tech/neondb?sslmode=require",
    BETTER_AUTH_SECRET:
      "a_very_long_secure_secret_key_with_at_least_32_characters",
    BETTER_AUTH_URL: "https://hiblow-fleet.vercel.app",
    NEXT_PUBLIC_APP_URL: "https://hiblow-fleet.vercel.app",
  }

  it("returns isValid: true when all production variables are properly configured", () => {
    const result = validateDeploymentEnv(validEnv)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("detects missing required environment variables", () => {
    const result = validateDeploymentEnv({
      DATABASE_URL: "postgresql://localhost:5432/db",
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain("BETTER_AUTH_SECRET is required")
    expect(result.errors).toContain("BETTER_AUTH_URL is required")
    expect(result.errors).toContain("NEXT_PUBLIC_APP_URL is required")
  })

  it("enforces minimum 32 characters for BETTER_AUTH_SECRET", () => {
    const result = validateDeploymentEnv({
      ...validEnv,
      BETTER_AUTH_SECRET: "short_secret",
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      "BETTER_AUTH_SECRET must be at least 32 characters for security"
    )
  })

  it("validates postgres database connection protocol", () => {
    const result = validateDeploymentEnv({
      ...validEnv,
      DATABASE_URL: "mysql://user:pass@localhost/db",
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain(
      "DATABASE_URL must start with postgres:// or postgresql://"
    )
  })
})
