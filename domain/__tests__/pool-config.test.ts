import { describe, expect, it } from "vitest"

import { resolvePoolConfig } from "../database/pool-config"

describe("resolvePoolConfig", () => {
  it("enables SSL with rejectUnauthorized: false when connecting to Neon cloud", () => {
    const neonUrl =
      "postgresql://user:secret@ep-cool-lake-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    const config = resolvePoolConfig(neonUrl, "development")

    expect(config.ssl).toEqual({ rejectUnauthorized: false })
    expect(config.max).toBe(10)
    expect(config.idleTimeoutMillis).toBe(30000)
    expect(config.connectionTimeoutMillis).toBe(5000)
  })

  it("disables SSL for local development database", () => {
    const localUrl = "postgres://hiblow:hiblow_secret@localhost:5433/hiblow_db"
    const config = resolvePoolConfig(localUrl, "development")

    expect(config.ssl).toBe(false)
    expect(config.max).toBe(10)
    expect(config.idleTimeoutMillis).toBe(30000)
    expect(config.connectionTimeoutMillis).toBe(5000)
  })

  it("enables SSL in production environment even without explicit neon.tech domain", () => {
    const genericUrl = "postgres://user:secret@db.internal:5432/prod_db"
    const config = resolvePoolConfig(genericUrl, "production")

    expect(config.ssl).toEqual({ rejectUnauthorized: false })
  })

  it("enables SSL if connection string has sslmode=require even in non-production", () => {
    const sslUrl =
      "postgres://user:secret@custom-host:5432/prod_db?sslmode=require"
    const config = resolvePoolConfig(sslUrl, "test")

    expect(config.ssl).toEqual({ rejectUnauthorized: false })
  })
})
