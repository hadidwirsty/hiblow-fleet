# Rencana Implementasi: Restrukturisasi Proyek & Co-location Test Suite

**Dokumen Rencana:** `docs/plans/2026-09-21-project-structure-refactor-16.md`  
**Fitur / Scope:** Reorganisasi Struktur Folder, Relokasi Layout Shell & Komponen Dasbor, Purifikasi Domain Bisnis, Konsolidasi Skrip CLI Database, dan Co-location 39 File Test Suite  
**Tanggal:** 21 September 2026  
**Status:** Draf untuk Tinjauan Pengguna  

---

## 1. Konteks & Ringkasan Perubahan

Berdasarkan dokumen spesifikasi desain `docs/specs/2026-09-21-project-structure-refactor-design.md`, implementasi ini akan melakukan restrukturisasi arsitektur komprehensif pada proyek `hiblow-fleet`:
1. **Layout & Shell Isolation:** Memindahkan dan mengelompokkan komponen shell aplikasi (`app-sidebar`, `site-header`, `sidebar-nav-*`, `dashboard-navigation-loading`, `global-loading-overlay`, `mode-toggle`, `theme-provider`) ke dalam `components/layout/`.
2. **Dashboard Slices:** Memindahkan komponen visual dasbor (`section-cards.tsx` $\to$ `dashboard-kpi-cards.tsx`, `chart-area-interactive.tsx` $\to$ `dashboard-trip-chart.tsx`) ke `features/dashboard/`.
3. **Domain Purity:** Memindahkan konfigurasi infrastruktur database (`pool-config.ts` ke `db/`) dan validasi environment deployment (`env-validator.ts` ke `lib/deployment/`).
4. **Runnable Database Scripts:** Menyatukan seluruh skrip CLI database ke `scripts/db/` dan memperbarui `package.json`.
5. **Co-location Test Suites (39 File):** Mendistribusikan seluruh file pengujian ke folder `__tests__/` pada fitur dan layer masing-masing dengan tetap menjamin 100% test parity (176 tests lulus).

---

## 2. Kriteria Penerimaan & Gap Analysis

### Acceptance Criteria (AC):
1. **AC-1:** Seluruh komponen navigasi, sidebar, header, dan loading overlay terpusat di `components/layout/`. Folder kosong `components/global/` terhapus.
2. **AC-2:** Komponen visual dasbor berada di `features/dashboard/` dengan nama `dashboard-kpi-cards.tsx` dan `dashboard-trip-chart.tsx`.
3. **AC-3:** Layer `domain/` murni berisi logika bisnis dan kalkulasi matematika finansial tanpa I/O atau dependensi koneksi DB/deployment.
4. **AC-4:** Seluruh skrip eksekusi terminal database terpusat di `scripts/db/`, dan seluruh script `pnpm db:*` di `package.json` berfungsi normal.
5. **AC-5:** 39 file pengujian terdistribusi secara co-location di slice fiturnya masing-masing dan `vitest.config.ts` mendeteksi seluruh tes secara otomatis.
6. **AC-6:** `pnpm test` (39 file, 176 tests), `pnpm typecheck`, `pnpm lint`, dan `pnpm build` berstatus 100% PASSED / CLEAN.
7. **AC-7:** File `.agents/rules/project-context.md` diperbarui mencerminkan arsitektur folder baru.

---

## 3. Rincian Tugas Atomik (Berdasar TDD)

### Task 1: Pembaruan Konfigurasi Vitest Runner (`vitest.config.ts`)
**Files:**
- Modify: `vitest.config.ts`

**Requirements:**
- Konfigurasi `test.include` harus mencakup seluruh file berekstensi `**/*.test.ts` dan `**/*.test.tsx`.
- Tambahkan `test.exclude` untuk mengecualikan `node_modules`, `.next`, dan `dist`.

**Step 1: Write failing test (RED)**
Saat ini `vitest.config.ts` hanya mencari di `["domain/**/*.test.ts", "lib/**/*.test.ts", "tests/**/*.test.ts"]`. Pengujian di `features/**` belum terdeteksi.

**Step 2: Minimal implementation (GREEN)**
Perbarui `vitest.config.ts`:
```typescript
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "dist"],
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
```

**Step 3: Verify test passes**
Jalankan: `pnpm test`  
Ekspektasi: 39 test files tetap terdeteksi dan lulus.

---

### Task 2: Restrukturisasi Komponen Tata Letak & Shell (`components/layout/`)
**Files:**
- Create / Move: `components/layout/app-sidebar.tsx` (dari `components/app-sidebar.tsx`)
- Create / Move: `components/layout/site-header.tsx` (dari `components/site-header.tsx`)
- Create / Move: `components/layout/sidebar-nav-main.tsx` (dari `components/nav-main.tsx`)
- Create / Move: `components/layout/sidebar-nav-documents.tsx` (dari `components/nav-documents.tsx`)
- Create / Move: `components/layout/sidebar-nav-secondary.tsx` (dari `components/nav-secondary.tsx`)
- Create / Move: `components/layout/sidebar-nav-user.tsx` (dari `components/nav-user.tsx`)
- Create / Move: `components/layout/dashboard-navigation-loading.tsx` (dari `components/dashboard-navigation-loading.tsx`)
- Create / Move: `components/layout/global-loading-overlay.tsx` (dari `components/global-loading-overlay.tsx`)
- Create / Move: `components/layout/mode-toggle.tsx` (dari `components/mode-toggle.tsx`)
- Create / Move: `components/layout/theme-provider.tsx` (dari `components/theme-provider.tsx`)
- Delete: Folder kosong `components/global/`
- Modify: `app/layout.tsx` (update path impor layout)
- Modify: `app/(dashboard)/layout.tsx` (update path impor layout)
- Modify: `components/layout/app-sidebar.tsx` (update impor `sidebar-nav-*`)
- Modify: `components/layout/site-header.tsx` (update impor `mode-toggle`)

**Requirements:**
- Seluruh shell navigasi dan layout berada di dalam `components/layout/`.
- Perbarui seluruh path import tanpa ada tipe yang hilang.

**Step 1: Write verification check (RED)**
Sebelum update import, pemindahan file akan memicu import error di `pnpm typecheck`.

**Step 2: Minimal implementation (GREEN)**
1. Pindahkan berkas-berkas layout ke `components/layout/`.
2. Perbarui impor di `app/layout.tsx`, `app/(dashboard)/layout.tsx`, `components/layout/app-sidebar.tsx`, dan `components/layout/site-header.tsx`.
3. Hapus `components/global/`.

**Step 3: Verify test passes**
Jalankan: `pnpm typecheck`  
Ekspektasi: Bersih tanpa error.

---

### Task 3: Konsolidasi & Relokasi Komponen Dasbor (`features/dashboard/`)
**Files:**
- Create / Move: `features/dashboard/dashboard-kpi-cards.tsx` (dari `components/section-cards.tsx`)
- Create / Move: `features/dashboard/dashboard-trip-chart.tsx` (dari `components/chart-area-interactive.tsx`)
- Modify: `app/(dashboard)/dashboard/page.tsx`

**Requirements:**
- Ubah ekspor nama komponen menjadi `DashboardKpiCards` dan `DashboardTripChart`.
- Perbarui impor di `app/(dashboard)/dashboard/page.tsx`.

**Step 1: Write verification check (RED)**
Periksa error import saat `section-cards.tsx` dan `chart-area-interactive.tsx` dipindahkan.

**Step 2: Minimal implementation (GREEN)**
1. Pindahkan dan rename file ke `features/dashboard/`.
2. Perbarui ekspor fungsi & impor di `app/(dashboard)/dashboard/page.tsx`.

**Step 3: Verify test passes**
Jalankan: `pnpm typecheck`  
Ekspektasi: Bersih tanpa error.

---

### Task 4: Purifikasi Layer Domain (`domain/` $\to$ `db/` & `lib/`)
**Files:**
- Create / Move: `db/pool-config.ts` (dari `domain/database/pool-config.ts`)
- Create / Move: `lib/deployment/env-validator.ts` (dari `domain/deployment/env-validator.ts`)
- Modify: `db/index.ts`
- Modify: `scripts/verify-deployment.ts`
- Delete: Folder kosong `domain/database/` dan `domain/deployment/`

**Requirements:**
- `domain/` bebas dari infrastruktur database dan validasi environment deployment.
- `db/index.ts` mengimpor `resolvePoolConfig` dari `@/db/pool-config`.
- `scripts/verify-deployment.ts` mengimpor `validateDeploymentEnv` dari `@/lib/deployment/env-validator`.

**Step 1: Write verification check (RED)**
Pemindahan file menyebabkan error impor sementara.

**Step 2: Minimal implementation (GREEN)**
1. Pindahkan file dan perbarui impor di `db/index.ts` dan `scripts/verify-deployment.ts`.
2. Hapus direktori kosong `domain/database/` dan `domain/deployment/`.

**Step 3: Verify test passes**
Jalankan: `pnpm typecheck`  
Ekspektasi: Bersih tanpa error.

---

### Task 5: Konsolidasi Skrip Database ke `scripts/db/` & Update `package.json`
**Files:**
- Create / Move: `scripts/db/seed.ts` (dari `db/seed.ts`)
- Create / Move: `scripts/db/seed-users.ts` (dari `db/seed-users.ts`)
- Create / Move: `scripts/db/import-history.ts` (dari `db/import-history.ts`)
- Create / Move: `scripts/db/sync-csv.ts` (dari `scripts/sync-csv-to-database.ts`)
- Create / Move: `scripts/db/clear-rates.ts` (dari `scripts/clear-rates.ts`)
- Create / Move: `scripts/db/clear-all.ts` (dari `scripts/clear-all-data.ts`)
- Modify: `package.json`
- Periksa path import relatif (seperti `../db` atau `../data`) di dalam skrip agar tetap valid.

**Requirements:**
- Seluruh runnable CLI scripts database terpusat di `scripts/db/`.
- Perintah `pnpm db:*` di `package.json` diselaraskan ke path baru.

**Step 1: Write verification check (RED)**
Verifikasi script path di `package.json` sebelum diubah.

**Step 2: Minimal implementation (GREEN)**
1. Pindahkan berkas ke `scripts/db/`.
2. Sesuaikan impor jika ada path relatif ke data JSON (`../db/data` $\to$ `../../db/data`).
3. Perbarui `package.json`:
   - `"db:seed": "tsx --env-file=.env.local scripts/db/seed.ts"`
   - `"db:seed-users": "tsx --env-file=.env.local scripts/db/seed-users.ts"`
   - `"db:import-history": "tsx --env-file=.env.local scripts/db/import-history.ts"`
   - `"db:sync-csv": "tsx --env-file=.env.local scripts/db/sync-csv.ts"`
   - `"db:clear-rates": "tsx --env-file=.env.local scripts/db/clear-rates.ts"`
   - `"db:clear-all": "tsx --env-file=.env.local scripts/db/clear-all.ts"`

**Step 3: Verify test passes**
Jalankan: `pnpm typecheck`  
Ekspektasi: Bersih tanpa error.

---

### Task 6: Migrasi Co-location Seluruh 39 File Test Suite
**Files:**
- **Trips (7 file):**
  - Pindahkan `domain/__tests__/trips-actions.test.ts` $\to$ `features/trips/__tests__/trips-actions.test.ts`
  - Pindahkan `domain/__tests__/trips-queries.test.ts` $\to$ `features/trips/__tests__/trips-queries.test.ts`
  - Pindahkan `domain/__tests__/trips-schema.test.ts` $\to$ `features/trips/__tests__/trips-schema.test.ts`
  - Pindahkan `domain/__tests__/trips-export.test.ts` $\to$ `features/trips/__tests__/trips-export.test.ts`
  - Pindahkan `domain/__tests__/trips-fee-actions.test.ts` $\to$ `features/trips/__tests__/trips-fee-actions.test.ts`
  - Pindahkan `domain/__tests__/trip-mobile-card.test.ts` $\to$ `features/trips/__tests__/trip-mobile-card.test.ts`
  - Pindahkan `domain/__tests__/trip-form-calculations.test.ts` $\to$ `features/trips/__tests__/trip-form-calculations.test.ts`
- **Expenses (6 file):**
  - Pindahkan `domain/__tests__/expenses-actions.test.ts` $\to$ `features/expenses/__tests__/expenses-actions.test.ts`
  - Pindahkan `domain/__tests__/expenses-queries.test.ts` $\to$ `features/expenses/__tests__/expenses-queries.test.ts`
  - Pindahkan `domain/__tests__/expenses-schema.test.ts` $\to$ `features/expenses/__tests__/expenses-schema.test.ts`
  - Pindahkan `domain/__tests__/expenses-export.test.ts` $\to$ `features/expenses/__tests__/expenses-export.test.ts`
  - Pindahkan `domain/__tests__/expenses-summary.test.ts` $\to$ `features/expenses/__tests__/expenses-summary.test.ts`
  - Pindahkan `domain/__tests__/expense-mobile-card.test.ts` $\to$ `features/expenses/__tests__/expense-mobile-card.test.ts`
- **Rates (4 file):**
  - Pindahkan `domain/__tests__/rates-actions.test.ts` $\to$ `features/rates/__tests__/rates-actions.test.ts`
  - Pindahkan `domain/__tests__/rates-queries.test.ts` $\to$ `features/rates/__tests__/rates-queries.test.ts`
  - Pindahkan `domain/__tests__/rates-schema.test.ts` $\to$ `features/rates/__tests__/rates-schema.test.ts`
  - Pindahkan `domain/__tests__/rate-mobile-card.test.ts` $\to$ `features/rates/__tests__/rate-mobile-card.test.ts`
- **Profit Sharing (4 file):**
  - Pindahkan `domain/__tests__/profit-sharing-actions.test.ts` $\to$ `features/profit-sharing/__tests__/profit-sharing-actions.test.ts`
  - Pindahkan `domain/__tests__/profit-sharing-queries.test.ts` $\to$ `features/profit-sharing/__tests__/profit-sharing-queries.test.ts`
  - Pindahkan `domain/__tests__/profit-sharing-schema.test.ts` $\to$ `features/profit-sharing/__tests__/profit-sharing-schema.test.ts`
  - Pindahkan `domain/__tests__/profit-sharing-export.test.ts` $\to$ `features/profit-sharing/__tests__/profit-sharing-export.test.ts`
- **Maintenance (1 file):**
  - Pindahkan `domain/__tests__/maintenance-actions.test.ts` $\to$ `features/maintenance/__tests__/maintenance-actions.test.ts`
- **Dashboard (1 file):**
  - Pindahkan `domain/__tests__/dashboard-queries.test.ts` $\to$ `features/dashboard/__tests__/dashboard-queries.test.ts`
- **Auth (1 file):**
  - Pindahkan `domain/__tests__/auth-login.test.ts` $\to$ `features/auth/__tests__/auth-login.test.ts`
- **Domain Calculators (4 file):**
  - Pindahkan `domain/__tests__/omset.test.ts` $\to$ `domain/calculators/__tests__/omset.test.ts`
  - Pindahkan `domain/__tests__/sangu.test.ts` $\to$ `domain/calculators/__tests__/sangu.test.ts`
  - Pindahkan `domain/__tests__/trip-profit.test.ts` $\to$ `domain/calculators/__tests__/trip-profit.test.ts`
  - Pindahkan `domain/__tests__/profit-sharing.test.ts` $\to$ `domain/calculators/__tests__/profit-sharing.test.ts`
- **Domain Models (4 file):**
  - Pertahankan `expense-category.test.ts`, `investor-personalization.test.ts`, `maintenance.test.ts`, `route-trend.test.ts` di `domain/__tests__/`.
- **Database (1 file):**
  - Pindahkan `domain/__tests__/pool-config.test.ts` $\to$ `db/__tests__/pool-config.test.ts` (update import ke `@/db/pool-config`).
- **Deployment (1 file):**
  - Pindahkan `domain/__tests__/env-validator.test.ts` $\to$ `lib/deployment/__tests__/env-validator.test.ts` (update import ke `@/lib/deployment/env-validator`).
- **UI Components (1 file):**
  - Pindahkan `domain/__tests__/responsive-dialog.test.ts` $\to$ `components/ui/__tests__/responsive-dialog.test.ts`.
- **Lib Utilities (5 file):**
  - `csv-builder.test.ts`, `excel-builder.test.ts`, `rbac.test.ts`, `utils.test.ts` tetap di `lib/__tests__/`.
  - Pindahkan `domain/__tests__/auth-rbac.test.ts` $\to$ `lib/__tests__/rbac-redirect.test.ts`.

**Requirements:**
- Seluruh 39 file pengujian dipindahkan ke foldernya masing-masing.
- Perbarui path import internal (mengutamakan alias `@/...`).

**Step 1: Write failing verification (RED)**
Pindahkan berkas pengujian secara bertahap dan jalankan `pnpm test`.

**Step 2: Minimal implementation (GREEN)**
Sesuaikan path import di setiap test file yang dipindahkan.

**Step 3: Verify test passes**
Jalankan: `pnpm test`  
Ekspektasi: Tepat 39 test files passed, 176 tests passed.

---

### Task 7: Pembersihan File Sampah & Pembaruan Context Memory
**Files:**
- Modify: `.agents/rules/project-context.md`
- Delete: Seluruh berkas `.DS_Store`

**Requirements:**
- Hapus seluruh `.DS_Store` yang ada di workspace.
- Perbarui pohon arsitektur dan deskripsi direktori pada `.agents/rules/project-context.md`.
- Jalankan verifikasi menyeluruh:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`

**Step 1: Minimal implementation**
1. Eksekusi pembersihan `.DS_Store`.
2. Perbarui `project-context.md`.

**Step 2: Verify all suites**
Jalankan: `pnpm test && pnpm typecheck && pnpm lint && pnpm build`  
Ekspektasi: Seluruh tahap lulus tanpa peringatan atau kegagalan.
