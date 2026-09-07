import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://hiblow:hiblow_secret@localhost:5433/hiblow_db"

// Create global pool instance to prevent connection leaks during Next.js hot reload
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })
export type Database = typeof db
