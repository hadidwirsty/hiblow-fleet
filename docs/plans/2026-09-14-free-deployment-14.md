# Implementation Plan: Free Tier Production Deployment (Vercel + Neon Postgres)

**Dokumen:** `docs/plans/2026-09-14-free-deployment-14.md`  
**Spesifikasi:** `docs/specs/2026-09-14-free-deployment-design.md`  
**Sequence:** 14  
**Tanggal:** 2026-09-14  
**Status:** Ready for Execution  

---

## Ringkasan Eksekutif

Rencana ini menjabarkan tugas teknis atomik untuk mempersiapkan dan mempublikasikan aplikasi `hiblow-fleet` ke infrastruktur produksi **100% Gratis (Zero Cost)** menggunakan **Vercel (Hobby Tier)** dan **Neon Serverless PostgreSQL 17 (Free Tier 0.5 GB)**. Seluruh langkah menerapkan disiplin **Testability-First Architecture** dan **TDD (Red-Green-Refactor)** sesuai *Technical Constitution*.

---

## GAP ANALYSIS (Mandatory)

### Nouns (Data Fields & Config Entities)
- `DATABASE_URL`: Connection string PostgreSQL Neon dengan mode pooled -> *Task 1 & Task 2*
- `ssl`: Konfigurasi TLS driver `pg` (`rejectUnauthorized: false`) -> *Task 1*
- `max`, `idleTimeoutMillis`, `connectionTimeoutMillis`: Parameter resilience serverless pool -> *Task 1*
- `BETTER_AUTH_SECRET`: Kunci enkripsi sesi otentikasi minimal 32 karakter -> *Task 2*
- `BETTER_AUTH_URL`: URL produksi aplikasi dengan HTTPS -> *Task 2*
- `NEXT_PUBLIC_APP_URL`: URL publik aplikasi untuk frontend -> *Task 2*
- `seed-users`: Script pembuatan akun awal Admin & Partner -> *Task 3*
- `DEPLOYMENT_GUIDE.md`: Panduan runbook operasional langkah-demi-langkah -> *Task 4*

### Verbs (Actions)
- Resolve SSL pool configuration dynamically -> *Task 1*
- Validate environment variables at system boundary -> *Task 2*
- Execute Drizzle schema migration on remote cloud -> *Task 3 & Task 4*
- Seed initial fleet, rates, and authentication users -> *Task 3 & Task 4*
- Verify pre-flight build & test integrity -> *Task 5*

---

## Atomic Implementation Tasks

### Task 1: [x] SSL-Aware Database Pool Configuration (Completed)

**Files:**
- Create: `domain/database/pool-config.ts`
- Test: `domain/__tests__/pool-config.test.ts`
- Modify: `db/index.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. `resolvePoolConfig(connectionString, nodeEnv)` mengembalikan konfigurasi `ssl: { rejectUnauthorized: false }` jika target URL mengandung `neon.tech`, `sslmode=require`, atau jika `nodeEnv === 'production'`.
  2. `resolvePoolConfig(connectionString, nodeEnv)` mengembalikan `ssl: false` jika target URL mengarah ke localhost/docker development tanpa SSL.
  3. Mengatur batas koneksi `max: 10`, `idleTimeoutMillis: 30000`, dan `connectionTimeoutMillis: 5000` untuk mencegah exhaustion pada arsitektur serverless.
- **Functional Requirements:**
  - Fungsi murni tanpa side effect (`pure function`), terisolasi dari network I/O.
- **Non-Functional Requirements:**
  - Eksekusi unit test < 50ms, zero external dependencies.
- **Test Coverage:**
  - `resolvePoolConfig()` untuk Neon connection string (SSL aktif).
  - `resolvePoolConfig()` untuk Local Docker connection string (SSL nonaktif).
  - `resolvePoolConfig()` untuk production environment override.

**Step 1: Write failing test (RED)**
Create `domain/__tests__/pool-config.test.ts`:
```typescript
import { describe, expect, it } from "vitest"
import { resolvePoolConfig } from "../database/pool-config"

describe("resolvePoolConfig", () => {
  it("enables SSL with rejectUnauthorized: false when connecting to Neon cloud", () => {
    const neonUrl = "postgresql://user:secret@ep-cool-lake-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
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
  })

  it("enables SSL in production environment even without explicit neon.tech domain", () => {
    const genericUrl = "postgres://user:secret@db.internal:5432/prod_db"
    const config = resolvePoolConfig(genericUrl, "production")

    expect(config.ssl).toEqual({ rejectUnauthorized: false })
  })
})
```

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/pool-config.test.ts`  
Expected: FAIL with "Cannot find module '../database/pool-config'"

**Step 3: Write minimal implementation (GREEN)**
Create `domain/database/pool-config.ts`:
```typescript
export interface ResolvedPoolConfig {
  connectionString: string
  ssl: boolean | { rejectUnauthorized: boolean }
  max: number
  idleTimeoutMillis: number
  connectionTimeoutMillis: number
}

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
```

Update `db/index.ts`:
```typescript
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { resolvePoolConfig } from "@/domain/database/pool-config"
import * as schema from "./schema"

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://hiblow:hiblow_secret@localhost:5433/hiblow_db"

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

export const pool =
  globalForDb.pool ??
  new Pool(resolvePoolConfig(connectionString))

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })
export type Database = typeof db
```

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/pool-config.test.ts`  
Expected: PASS with exit code 0

---

### Task 2: [x] Production Environment Variables Validator (Completed)

**Files:**
- Create: `domain/deployment/env-validator.ts`
- Test: `domain/__tests__/env-validator.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. `validateDeploymentEnv(env)` memvalidasi keberadaan `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, dan `NEXT_PUBLIC_APP_URL`.
  2. Menghasilkan error jika `BETTER_AUTH_SECRET` kurang dari 32 karakter.
  3. Menghasilkan error jika `DATABASE_URL` tidak diawali `postgres://` atau `postgresql://`.
  4. Mengembalikan `{ isValid: true, errors: [] }` jika seluruh variabel valid.
- **Functional Requirements:**
  - Pure validator fungsi, dapat dipakai oleh script pre-flight CI/CD.
- **Non-Functional Requirements:**
  - Zero dependencies, pesan error yang informatif dalam Bahasa Indonesia/Inggris.
- **Test Coverage:**
  - Valid environment dictionary.
  - Missing variables detection.
  - Short secret validation.
  - Invalid URL validation.

**Step 1: Write failing test (RED)**
Create `domain/__tests__/env-validator.test.ts`:
```typescript
import { describe, expect, it } from "vitest"
import { validateDeploymentEnv } from "../deployment/env-validator"

describe("validateDeploymentEnv", () => {
  const validEnv = {
    DATABASE_URL: "postgresql://user:pass@ep-cool-12345-pooler.neon.tech/neondb?sslmode=require",
    BETTER_AUTH_SECRET: "a_very_long_secure_secret_key_with_at_least_32_characters",
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
```

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/env-validator.test.ts`  
Expected: FAIL with "Cannot find module '../deployment/env-validator'"

**Step 3: Write minimal implementation (GREEN)**
Create `domain/deployment/env-validator.ts`:
```typescript
export interface EnvValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateDeploymentEnv(
  env: Record<string, string | undefined>
): EnvValidationResult {
  const errors: string[] = []

  // 1. DATABASE_URL
  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === "") {
    errors.push("DATABASE_URL is required")
  } else if (
    !env.DATABASE_URL.startsWith("postgres://") &&
    !env.DATABASE_URL.startsWith("postgresql://")
  ) {
    errors.push("DATABASE_URL must start with postgres:// or postgresql://")
  }

  // 2. BETTER_AUTH_SECRET
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.trim() === "") {
    errors.push("BETTER_AUTH_SECRET is required")
  } else if (env.BETTER_AUTH_SECRET.length < 32) {
    errors.push("BETTER_AUTH_SECRET must be at least 32 characters for security")
  }

  // 3. BETTER_AUTH_URL
  if (!env.BETTER_AUTH_URL || env.BETTER_AUTH_URL.trim() === "") {
    errors.push("BETTER_AUTH_URL is required")
  }

  // 4. NEXT_PUBLIC_APP_URL
  if (!env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL.trim() === "") {
    errors.push("NEXT_PUBLIC_APP_URL is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
```

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/env-validator.test.ts`  
Expected: PASS with exit code 0

---

### Task 3: [x] Pre-flight Verification Script & NPM Helper Script (Completed)

**Files:**
- Modify: `package.json`
- Create: `scripts/verify-deployment.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. `package.json` memiliki script `"db:seed-users": "tsx db/seed-users.ts"` dan `"verify:deployment": "tsx scripts/verify-deployment.ts"`.
  2. `scripts/verify-deployment.ts` membaca variabel lingkungan yang aktif atau file target, lalu memanggil `validateDeploymentEnv()` dan mencetak laporan status di terminal dengan exit code 0 jika valid atau exit code 1 jika tidak lengkap.

**Step 1: Write minimal implementation**
Create `scripts/verify-deployment.ts`:
```typescript
import dotenv from "dotenv"
import { validateDeploymentEnv } from "../domain/deployment/env-validator"

dotenv.config({ path: ".env.local" })

console.log("🔍 Checking deployment environment variables readiness...")

const result = validateDeploymentEnv(process.env)

if (!result.isValid) {
  console.error("❌ Environment configuration incomplete:")
  result.errors.forEach((err) => console.error(`  - ${err}`))
  console.error("\n💡 Make sure to set these variables in your Vercel Project Settings.")
  process.exit(1)
} else {
  console.log("✅ All required deployment environment variables are valid!")
  process.exit(0)
}
```

Tambahkan script ke `package.json`:
```json
"db:seed-users": "tsx db/seed-users.ts",
"verify:deployment": "tsx scripts/verify-deployment.ts"
```

**Step 2: Verify execution**
Run: `pnpm run verify:deployment`  
Expected: Output valid atau daftar variabel yang perlu disiapkan.

---

### Task 4: [x] Complete Step-by-Step Production Deployment Runbook (Completed)

**Files:**
- Create: `docs/DEPLOYMENT_GUIDE.md`

**Requirements:**
- **Acceptance Criteria:**
  1. Berisi panduan ringkas, visual, dan presisi mengenai setup akun Neon.tech gratis.
  2. Menjelaskan command migrasi skema tabel Drizzle ke Neon (`DATABASE_URL=... pnpm db:migrate`).
  3. Menjelaskan command pengisian master data dan akun Admin/Partner (`pnpm db:seed` & `pnpm run db:seed-users`).
  4. Menjelaskan langkah integrasi Vercel: import repo GitHub, input 4 environment variables, dan klik Deploy.
  5. Menjelaskan pengujian verifikasi pasca-deploy.

**Step 1: Write Documentation**
Buat panduan komprehensif di `docs/DEPLOYMENT_GUIDE.md`.

---

### Task 5: [x] End-to-End Build & Test Integrity Verification (Completed)

**Files:**
- Command Execution & Verification

**Requirements:**
- **Acceptance Criteria:**
  1. `pnpm test` menjalankan seluruh test suite (sekarang 6 test file, 12+ tests) dengan exit code 0.
  2. `pnpm lint` menghasilkan 0 error dan 0 warning.
  3. `pnpm run build` Next.js 16 (Turbopack) sukses menghasilkan production bundle tanpa kegagalan kompilasi.

---

## Plan Completion Review Checklist
- [x] All tasks have AC/FR/NFR/Test Coverage sections.
- [x] Plan saved directly to `docs/plans/2026-09-14-free-deployment-14.md`.
- [x] Enforces Testability-First, Pure Domain Logic, and OWASP-aligned configuration standards.
- [x] Sequence 14 continues seamlessly from Sequence 13.
