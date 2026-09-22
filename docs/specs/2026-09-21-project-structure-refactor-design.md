# Project Structure & Architecture Refactoring — Design Document

**Tanggal:** 2026-09-21  
**Status:** Approved by User  
**Topik:** Restrukturisasi Folder, Relokasi Komponen Dasbor & Layout, Purifikasi Domain, Konsolidasi Skrip CLI Database, dan Co-location Test Suite (39 Files).  

---

## 1. Ringkasan Eksekutif

Proyek `hiblow-fleet` telah berkembang dengan 39 file pengujian dan fitur operasional armada yang lengkap. Namun, seiring bertambahnya fitur, beberapa struktur direktori mengalami degradasi kerapian arsitektur:
1. Komponen dasbor (`section-cards.tsx` dan `chart-area-interactive.tsx`) tersesat di root `components/`.
2. Komponen navigasi dan shell layout menumpuk di root `components/` tanpa sub-kategori yang jelas, serta menyisakan folder kosong (`components/global/`).
3. Layer `domain/` tercemar oleh konfigurasi infrastruktur (`pool-config.ts` untuk koneksi PostgreSQL dan `env-validator.ts` untuk verifikasi deployment).
4. Skrip eksekusi database terbelah antara `db/` dan `scripts/`.
5. 35 file test fitur, actions, queries, dan UI mobile card ditumpuk di dalam `domain/__tests__/`.

Dokumen desain ini menetapkan cetak biru restrukturisasi menyeluruh untuk memulihkan prinsip **Domain-Driven Design (DDD)** murni, **Feature-Driven Slices**, **Layout Isolation**, dan **Co-located Testing**.

---

## 2. Tujuan & Kriteria Sukses

### 2.1 Tujuan
- Mengisolasi tata letak navigasi dan shell aplikasi ke dalam `components/layout/`.
- Memindahkan dan menstandarisasi komponen visual dasbor ke `features/dashboard/`.
- Mengembalikan kemurnian `domain/` sebagai pure business logic (zero I/O, zero infra dependencies).
- Menyatukan semua runnable database scripts ke `scripts/db/` dengan penyesuaian di `package.json`.
- Mendistribusikan 39 file test ke folder `__tests__/` pada fitur, domain, dan lib masing-masing (co-location).
- Membersihkan folder kosong dan berkas `.DS_Store`.

### 2.2 Kriteria Sukses
- [ ] Seluruh 39 file test suite (176 tests) tetap lulus (`pnpm test` berstatus 100% PASSED).
- [ ] TypeScript typecheck berjalan bersih tanpa error (`pnpm typecheck` exit code 0).
- [ ] Tidak ada berkas yang tersesat di luar domain fungsinya.
- [ ] Seluruh skrip `pnpm db:*` dan `pnpm verify:deployment` di `package.json` berjalan dengan benar.
- [ ] Aplikasi berjalan normal tanpa regresi visual atau rute yang rusak (`pnpm build` sukses).

---

## 3. Desain Arsitektur Baru

### 3.1 Peta Struktur Direktori Target

```text
hiblow-fleet/
├── app/                                # Next.js 16 App Router (tetap)
├── components/
│   ├── layout/                         # [RESTRUCTURED] Shell navigasi & layout
│   │   ├── app-sidebar.tsx             # Sidebar navigasi utama
│   │   ├── site-header.tsx             # Header dasbor & breadcrumb
│   │   ├── sidebar-nav-main.tsx        # Sub-item menu utama
│   │   ├── sidebar-nav-documents.tsx   # Sub-item menu dokumen
│   │   ├── sidebar-nav-secondary.tsx   # Sub-item menu sekunder
│   │   ├── sidebar-nav-user.tsx        # Sub-item profil user & logout
│   │   ├── dashboard-navigation-loading.tsx # Loading transisi navigasi
│   │   ├── global-loading-overlay.tsx  # Overlay spinner global
│   │   ├── mode-toggle.tsx             # Theme toggle
│   │   └── theme-provider.tsx          # Wrapper next-themes
│   ├── ui/                             # shadcn atomic UI primitives
│   │   └── __tests__/
│   │       └── responsive-dialog.test.ts # [CO-LOCATED TEST]
│   └── data-table.tsx                  # Shared reusable TanStack table
├── db/
│   ├── schema/                         # Skema tabel Drizzle ORM
│   ├── migrations/                     # SQL migration files
│   ├── data/                           # Data JSON acuan rates & history
│   ├── __tests__/
│   │   └── pool-config.test.ts         # [CO-LOCATED TEST]
│   ├── index.ts                        # Drizzle instance & pooled connection
│   └── pool-config.ts                  # [MOVED FROM domain/database]
├── domain/                             # [PURIFIED] Pure business logic (Zero I/O)
│   ├── calculators/
│   │   ├── omset.ts
│   │   ├── sangu.ts
│   │   ├── trip-profit.ts
│   │   ├── profit-sharing.ts
│   │   ├── index.ts
│   │   └── __tests__/                  # [CO-LOCATED CALCULATOR TESTS]
│   │       ├── omset.test.ts
│   │       ├── sangu.test.ts
│   │       ├── trip-profit.test.ts
│   │       └── profit-sharing.test.ts
│   ├── __tests__/                      # [CO-LOCATED DOMAIN MODEL TESTS]
│   │   ├── expense-category.test.ts
│   │   ├── investor-personalization.test.ts
│   │   ├── maintenance.test.ts
│   │   └── route-trend.test.ts
│   ├── expense-category.ts
│   ├── investor-personalization.ts
│   ├── maintenance.ts
│   └── route-trend.ts
├── features/                           # Vertical Feature Slices
│   ├── auth/
│   │   ├── __tests__/
│   │   │   └── auth-login.test.ts      # [CO-LOCATED TEST]
│   │   ├── login-form.tsx
│   │   └── login-welcome-dialog.tsx
│   ├── dashboard/
│   │   ├── __tests__/
│   │   │   └── dashboard-queries.test.ts # [CO-LOCATED TEST]
│   │   ├── dashboard-kpi-cards.tsx     # [MOVED & RENAMED from components/section-cards.tsx]
│   │   ├── dashboard-trip-chart.tsx    # [MOVED & RENAMED from components/chart-area-interactive.tsx]
│   │   ├── dashboard-route-chart.tsx
│   │   └── dashboard.queries.ts
│   ├── expenses/
│   │   ├── __tests__/                  # [CO-LOCATED TESTS]
│   │   │   ├── expenses-actions.test.ts
│   │   │   ├── expenses-queries.test.ts
│   │   │   ├── expenses-schema.test.ts
│   │   │   ├── expenses-export.test.ts
│   │   │   ├── expenses-summary.test.ts
│   │   │   └── expense-mobile-card.test.ts
│   │   ├── expense-form-dialog.tsx
│   │   ├── expense-mobile-card.tsx
│   │   ├── expenses-category-chart.tsx
│   │   ├── expenses-export-button.tsx
│   │   ├── expenses-summary.tsx
│   │   ├── expenses-table.tsx
│   │   ├── expenses.actions.ts
│   │   ├── expenses.export.ts
│   │   ├── expenses.queries.ts
│   │   └── expenses.schema.ts
│   ├── maintenance/
│   │   ├── __tests__/
│   │   │   └── maintenance-actions.test.ts # [CO-LOCATED TEST]
│   │   ├── maintenance-reminders-widget.tsx
│   │   ├── maintenance.actions.ts
│   │   ├── maintenance.queries.ts
│   │   └── maintenance.schema.ts
│   ├── profit-sharing/
│   │   ├── __tests__/                  # [CO-LOCATED TESTS]
│   │   │   ├── profit-sharing-actions.test.ts
│   │   │   ├── profit-sharing-queries.test.ts
│   │   │   ├── profit-sharing-schema.test.ts
│   │   │   └── profit-sharing-export.test.ts
│   │   ├── partner-profit-sharing-view.tsx
│   │   ├── period-card.tsx
│   │   ├── period-detail-sheet.tsx
│   │   ├── period-wizard-dialog.tsx
│   │   ├── profit-sharing-empty-state.tsx
│   │   ├── profit-sharing.actions.ts
│   │   ├── profit-sharing.export.ts
│   │   ├── profit-sharing.queries.ts
│   │   └── profit-sharing.schema.ts
│   ├── rates/
│   │   ├── __tests__/                  # [CO-LOCATED TESTS]
│   │   │   ├── rates-actions.test.ts
│   │   │   ├── rates-queries.test.ts
│   │   │   ├── rates-schema.test.ts
│   │   │   └── rate-mobile-card.test.ts
│   │   ├── rate-form-dialog.tsx
│   │   ├── rate-mobile-card.tsx
│   │   ├── rates-summary.tsx
│   │   ├── rates-table.tsx
│   │   ├── rates.actions.ts
│   │   ├── rates.queries.ts
│   │   └── rates.schema.ts
│   └── trips/
│       ├── __tests__/                  # [CO-LOCATED TESTS]
│       │   ├── trips-actions.test.ts
│       │   ├── trips-queries.test.ts
│       │   ├── trips-schema.test.ts
│       │   ├── trips-export.test.ts
│       │   ├── trips-fee-actions.test.ts
│       │   ├── trip-mobile-card.test.ts
│       │   └── trip-form-calculations.test.ts
│       ├── trip-destination-combobox.tsx
│       ├── trip-fee-status-dialog.tsx
│       ├── trip-form-dialog.tsx
│       ├── trip-mobile-card.tsx
│       ├── trips-export-button.tsx
│       ├── trips-summary.tsx
│       ├── trips-table.tsx
│       ├── trips.actions.ts
│       ├── trips.export.ts
│       ├── trips.queries.ts
│       └── trips.schema.ts
├── lib/
│   ├── deployment/                     # Utilitas kesiapan deployment
│   │   ├── __tests__/
│   │   │   └── env-validator.test.ts   # [CO-LOCATED TEST]
│   │   └── env-validator.ts            # [MOVED FROM domain/deployment]
│   ├── export/
│   │   ├── csv-builder.ts
│   │   ├── download.ts
│   │   └── excel-builder.ts
│   ├── __tests__/                      # [CO-LOCATED LIB TESTS]
│   │   ├── csv-builder.test.ts
│   │   ├── excel-builder.test.ts
│   │   ├── rbac.test.ts
│   │   ├── rbac-redirect.test.ts       # [MOVED & RENAMED from domain/__tests__/auth-rbac.test.ts]
│   │   └── utils.test.ts
│   ├── auth-client.ts
│   ├── auth.ts
│   ├── rbac.ts
│   ├── session.ts
│   └── utils.ts
├── scripts/                            # [CONSOLIDATED] Runnable CLI Scripts
│   ├── db/                             # Skrip pemeliharaan database
│   │   ├── clear-all.ts                # [MOVED & RENAMED from scripts/clear-all-data.ts]
│   │   ├── clear-rates.ts              # [MOVED from scripts/clear-rates.ts]
│   │   ├── import-history.ts           # [MOVED from db/import-history.ts]
│   │   ├── seed-users.ts               # [MOVED from db/seed-users.ts]
│   │   ├── seed.ts                     # [MOVED from db/seed.ts]
│   │   └── sync-csv.ts                 # [MOVED & RENAMED from scripts/sync-csv-to-database.ts]
│   └── verify-deployment.ts            # Verifikasi env deployment
├── docs/                               # Dokumentasi proyek (tetap)
├── vitest.config.ts                    # Konfigurasi include test baru
└── package.json                        # Runner scripts baru
```

---

## 4. Matriks Rincian Perubahan & Migrasi

### 4.1 Modifikasi & Relokasi File

| File Lama | Lokasi / Nama Baru | Perubahan Impor Terkait |
|---|---|---|
| `components/section-cards.tsx` | `features/dashboard/dashboard-kpi-cards.tsx` | `app/(dashboard)/dashboard/page.tsx` |
| `components/chart-area-interactive.tsx` | `features/dashboard/dashboard-trip-chart.tsx` | `app/(dashboard)/dashboard/page.tsx` |
| `components/app-sidebar.tsx` | `components/layout/app-sidebar.tsx` | `app/(dashboard)/layout.tsx` |
| `components/site-header.tsx` | `components/layout/site-header.tsx` | `app/(dashboard)/layout.tsx` |
| `components/nav-main.tsx` | `components/layout/sidebar-nav-main.tsx` | `components/layout/app-sidebar.tsx` |
| `components/nav-documents.tsx` | `components/layout/sidebar-nav-documents.tsx` | `components/layout/app-sidebar.tsx` |
| `components/nav-secondary.tsx` | `components/layout/sidebar-nav-secondary.tsx` | `components/layout/app-sidebar.tsx` |
| `components/nav-user.tsx` | `components/layout/sidebar-nav-user.tsx` | `components/layout/app-sidebar.tsx` |
| `components/dashboard-navigation-loading.tsx` | `components/layout/dashboard-navigation-loading.tsx` | `app/(dashboard)/layout.tsx` |
| `components/global-loading-overlay.tsx` | `components/layout/global-loading-overlay.tsx` | `app/layout.tsx` |
| `components/mode-toggle.tsx` | `components/layout/mode-toggle.tsx` | `components/layout/site-header.tsx` |
| `components/theme-provider.tsx` | `components/layout/theme-provider.tsx` | `app/layout.tsx` |
| `domain/database/pool-config.ts` | `db/pool-config.ts` | `db/index.ts`, `db/__tests__/pool-config.test.ts` |
| `domain/deployment/env-validator.ts` | `lib/deployment/env-validator.ts` | `scripts/verify-deployment.ts`, `lib/deployment/__tests__/env-validator.test.ts` |
| `db/seed.ts` | `scripts/db/seed.ts` | `package.json` |
| `db/seed-users.ts` | `scripts/db/seed-users.ts` | `package.json` |
| `db/import-history.ts` | `scripts/db/import-history.ts` | `package.json` |
| `scripts/sync-csv-to-database.ts` | `scripts/db/sync-csv.ts` | `package.json` |
| `scripts/clear-rates.ts` | `scripts/db/clear-rates.ts` | `package.json` |
| `scripts/clear-all-data.ts` | `scripts/db/clear-all.ts` | `package.json` |

---

### 4.2 Matriks Relokasi Pengujian (39 File Test)

| File Test Asal | Lokasi Baru | Target Testing |
|---|---|---|
| `domain/__tests__/trips-actions.test.ts` | `features/trips/__tests__/trips-actions.test.ts` | Server actions ritase |
| `domain/__tests__/trips-queries.test.ts` | `features/trips/__tests__/trips-queries.test.ts` | Query ritase |
| `domain/__tests__/trips-schema.test.ts` | `features/trips/__tests__/trips-schema.test.ts` | Schema Zod ritase |
| `domain/__tests__/trips-export.test.ts` | `features/trips/__tests__/trips-export.test.ts` | Export ritase |
| `domain/__tests__/trips-fee-actions.test.ts` | `features/trips/__tests__/trips-fee-actions.test.ts` | Status fee pihak ketiga |
| `domain/__tests__/trip-mobile-card.test.ts` | `features/trips/__tests__/trip-mobile-card.test.ts` | UI kartu mobile ritase |
| `domain/__tests__/trip-form-calculations.test.ts` | `features/trips/__tests__/trip-form-calculations.test.ts` | Dynamic calculation form ritase |
| `domain/__tests__/expenses-actions.test.ts` | `features/expenses/__tests__/expenses-actions.test.ts` | Server actions pengeluaran |
| `domain/__tests__/expenses-queries.test.ts` | `features/expenses/__tests__/expenses-queries.test.ts` | Query pengeluaran |
| `domain/__tests__/expenses-schema.test.ts` | `features/expenses/__tests__/expenses-schema.test.ts` | Schema Zod pengeluaran |
| `domain/__tests__/expenses-export.test.ts` | `features/expenses/__tests__/expenses-export.test.ts` | Export pengeluaran |
| `domain/__tests__/expenses-summary.test.ts` | `features/expenses/__tests__/expenses-summary.test.ts` | Card ringkasan pengeluaran |
| `domain/__tests__/expense-mobile-card.test.ts` | `features/expenses/__tests__/expense-mobile-card.test.ts` | UI kartu mobile pengeluaran |
| `domain/__tests__/rates-actions.test.ts` | `features/rates/__tests__/rates-actions.test.ts` | Server actions tarif |
| `domain/__tests__/rates-queries.test.ts` | `features/rates/__tests__/rates-queries.test.ts` | Query tarif |
| `domain/__tests__/rates-schema.test.ts` | `features/rates/__tests__/rates-schema.test.ts` | Schema Zod tarif |
| `domain/__tests__/rate-mobile-card.test.ts` | `features/rates/__tests__/rate-mobile-card.test.ts` | UI kartu mobile tarif |
| `domain/__tests__/profit-sharing-actions.test.ts` | `features/profit-sharing/__tests__/profit-sharing-actions.test.ts` | Actions tutup buku |
| `domain/__tests__/profit-sharing-queries.test.ts` | `features/profit-sharing/__tests__/profit-sharing-queries.test.ts` | Query bagi hasil |
| `domain/__tests__/profit-sharing-schema.test.ts` | `features/profit-sharing/__tests__/profit-sharing-schema.test.ts` | Schema periode |
| `domain/__tests__/profit-sharing-export.test.ts` | `features/profit-sharing/__tests__/profit-sharing-export.test.ts` | Export bagi hasil |
| `domain/__tests__/maintenance-actions.test.ts` | `features/maintenance/__tests__/maintenance-actions.test.ts` | Actions pemeliharaan |
| `domain/__tests__/dashboard-queries.test.ts` | `features/dashboard/__tests__/dashboard-queries.test.ts` | Query dasbor |
| `domain/__tests__/auth-login.test.ts` | `features/auth/__tests__/auth-login.test.ts` | Schema login Better Auth |
| `domain/__tests__/omset.test.ts` | `domain/calculators/__tests__/omset.test.ts` | Formula omset |
| `domain/__tests__/sangu.test.ts` | `domain/calculators/__tests__/sangu.test.ts` | Formula sangu Excel |
| `domain/__tests__/trip-profit.test.ts` | `domain/calculators/__tests__/trip-profit.test.ts` | Formula laba trip |
| `domain/__tests__/profit-sharing.test.ts` | `domain/calculators/__tests__/profit-sharing.test.ts` | Formula bagi hasil |
| `domain/__tests__/expense-category.test.ts` | `domain/__tests__/expense-category.test.ts` | Kategori pengeluaran |
| `domain/__tests__/investor-personalization.test.ts` | `domain/__tests__/investor-personalization.test.ts` | Personalization dividen |
| `domain/__tests__/maintenance.test.ts` | `domain/__tests__/maintenance.test.ts` | Status jatuh tempo servis |
| `domain/__tests__/route-trend.test.ts` | `domain/__tests__/route-trend.test.ts` | Tren rute armada |
| `domain/__tests__/pool-config.test.ts` | `db/__tests__/pool-config.test.ts` | Connection pool resolver |
| `domain/__tests__/env-validator.test.ts` | `lib/deployment/__tests__/env-validator.test.ts` | Validasi env deploy |
| `domain/__tests__/responsive-dialog.test.ts` | `components/ui/__tests__/responsive-dialog.test.ts` | Dialog/Drawer adaptif |
| `domain/__tests__/auth-rbac.test.ts` | `lib/__tests__/rbac-redirect.test.ts` | RBAC redirect path resolver |
| `lib/__tests__/csv-builder.test.ts` | `lib/__tests__/csv-builder.test.ts` | *Tetap* di lib |
| `lib/__tests__/excel-builder.test.ts` | `lib/__tests__/excel-builder.test.ts` | *Tetap* di lib |
| `lib/__tests__/rbac.test.ts` | `lib/__tests__/rbac.test.ts` | *Tetap* di lib |
| `lib/__tests__/utils.test.ts` | `lib/__tests__/utils.test.ts` | *Tetap* di lib |

---

### 4.3 Pembersihan Folder & File Sampah

1. **Hapus Folder Kosong:**
   - `components/global/`
   - `domain/database/`
   - `domain/deployment/`
2. **Hapus Berkas Metadata Sistem:**
   - Hapus seluruh berkas `.DS_Store` dari repositori.

---

## 5. Konfigurasi Sistem & Perkakas

### 5.1 `vitest.config.ts`
```typescript
import path from "node:path"
import dotenv from "dotenv"
import { defineConfig } from "vitest/config"

dotenv.config({ path: ".env.local" })

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

### 5.2 `package.json` Runner Scripts
```json
{
  "scripts": {
    "db:seed": "tsx --env-file=.env.local scripts/db/seed.ts",
    "db:seed-users": "tsx --env-file=.env.local scripts/db/seed-users.ts",
    "db:import-history": "tsx --env-file=.env.local scripts/db/import-history.ts",
    "db:sync-csv": "tsx --env-file=.env.local scripts/db/sync-csv.ts",
    "db:clear-rates": "tsx --env-file=.env.local scripts/db/clear-rates.ts",
    "db:clear-all": "tsx --env-file=.env.local scripts/db/clear-all.ts",
    "verify:deployment": "tsx scripts/verify-deployment.ts"
  }
}
```

---

## 6. Rencana Verifikasi & Uji Mutu

1. **Test Runner Verifikasi:**
   - Jalankan `pnpm test`.
   - Wajib meluluskan seluruh **39 file test** (176 tests).
2. **Type Safety Verifikasi:**
   - Jalankan `pnpm typecheck`.
   - Tidak boleh ada *dangling import* atau tipe yang hilang.
3. **Linter & Formatting:**
   - Jalankan `pnpm lint`.
4. **Build Production Verification:**
   - Jalankan `pnpm build` untuk memastikan kompilasi Next.js 16 berhasil tanpa error SSR/SSG.
5. **Pembaruan Context Memory:**
   - Perbarui `.agents/rules/project-context.md` agar mencerminkan struktur direktori yang baru.

---

## 7. Out of Scope (Tidak Dikerjakan pada Iterasi Ini)
- Tidak ada perubahan formula kalkulasi finansial (omset, sangu, profit, bagi hasil tetap 100% identik dengan Excel ground truth).
- Tidak ada penambahan fitur baru atau perubahan UI visual pengguna.
