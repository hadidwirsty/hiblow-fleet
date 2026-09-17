export interface ResolvedPoolConfig {
  connectionString: string
  ssl: boolean | { rejectUnauthorized: boolean }
  max: number
  idleTimeoutMillis: number
  connectionTimeoutMillis: number
}

/**
 * Resolves the PostgreSQL connection pool configuration.
 * Enables SSL with rejectUnauthorized: false when connecting to Neon cloud,
 * when sslmode=require is present, or when running in production.
 */
export function resolvePoolConfig(
  connectionString: string,
  nodeEnv: string = process.env.NODE_ENV || "development"
): ResolvedPoolConfig {
  const isCloud =
    nodeEnv === "production" ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("sslmode=require")

  return {
    connectionString,
    ssl: isCloud ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  }
}
