# Hiblow-Fleet — Implementation Plan: Foundation Layer

**Tanggal:** 2026-09-03  
**Status:** Completed  
**Spec Referensi:** [2026-09-03-hiblow-fleet-design.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/specs/2026-09-03-hiblow-fleet-design.md)

---

## Task Progress Checklist

### Batch 1: Infrastruktur, Dependencies & Konfigurasi Dasar
- [x] **Task 1.1**: Install dependencies (`drizzle-orm`, `pg`, `better-auth`, `zod`, `react-hook-form`, `@hookform/resolvers`, `zustand`) & devDependencies (`drizzle-kit`, `@types/pg`, `vitest`, `@vitest/coverage-v8`, `dotenv`, `tsx`).
- [x] **Task 1.2**: Setup konfigurasi Vitest (`vitest.config.ts`) dan update test script di `package.json`.
- [x] **Task 1.3**: Setup `docker-compose.yml`, update `.env.example` & siapkan `.env.local` untuk development.
- [x] **Task 1.4**: Setup `drizzle.config.ts`.

### Batch 2: Pure Domain Engine (TDD 100% Formula Parity)
- [x] **Task 2.1**: Calculator `omset.ts` (TDD: RED ➔ GREEN ➔ REFACTOR).
- [x] **Task 2.2**: Calculator `sangu.ts` dengan aturan cap 31 ton & pembulatan ribuan (TDD: RED ➔ GREEN ➔ REFACTOR).
- [x] **Task 2.3**: Calculator `trip-profit.ts` dengan potongan khusus Grobogan/LJU (TDD: RED ➔ GREEN ➔ REFACTOR).
- [x] **Task 2.4**: Calculator `profit-sharing.ts` periodik & pembagian investor (TDD: RED ➔ GREEN ➔ REFACTOR).
- [x] **Task 2.5**: Barrel export `src/domain/calculators/index.ts` & verifikasi suite test lulus 100%.

### Batch 3: Database Schema & Client (Drizzle ORM)
- [x] **Task 3.1**: Schema `src/db/schema/trucks.ts` & `src/db/schema/rate-references.ts`.
- [x] **Task 3.2**: Schema `src/db/schema/trips.ts` & `src/db/schema/expenses.ts`.
- [x] **Task 3.3**: Schema `src/db/schema/profit-sharing.ts` & `src/db/schema/auth.ts`.
- [x] **Task 3.4**: Barrel export `src/db/schema/index.ts` & Singleton Drizzle Client `src/db/index.ts`.
- [x] **Task 3.5**: Drizzle migration generation (`pnpm dlx drizzle-kit generate`) & script seed data `src/db/seed.ts`.

### Batch 4: Autentikasi & RBAC
- [x] **Task 4.1**: Better Auth server config (`src/lib/auth.ts`) & client (`src/lib/auth-client.ts`).
- [x] **Task 4.2**: Better Auth API Route Handler (`app/api/auth/[...all]/route.ts`).
- [x] **Task 4.3**: Session helper (`src/lib/session.ts`) & RBAC guards (`src/lib/rbac.ts`).

### Batch 5: Shared Types, Utilities & Final Verification
- [x] **Task 5.1**: Shared types (`src/types/index.ts`).
- [x] **Task 5.2**: Currency & Date utilities (`src/lib/utils.ts`).
- [x] **Task 5.3**: Verifikasi menyeluruh (`pnpm test`, `pnpm typecheck`, `pnpm build`).

### Batch 6: Historical Excel Data Importer
- [x] **Task 6.1**: Parse and extract historical trips, expenses, and profit sharing data (`src/db/data/history.json`).
- [x] **Task 6.2**: Script import transaksional (`src/db/import-history.ts`) dan script npm `db:import-history`.
- [x] **Task 6.3**: Eksekusi import & verifikasi kueri langsung ke database (201 trips, 927 expenses, 2 periods).
