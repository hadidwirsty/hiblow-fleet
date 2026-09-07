# Plan: Modul Pengeluaran Truk (`/expenses`) — Sequence 3

**Tanggal:** 2026-09-07  
**Fitur:** Modul Pencatatan Pengeluaran / Beban Operasional per Truk  
**Status:** DRAFT — Menunggu persetujuan

---

## Ringkasan

Modul `/expenses` adalah layar kedua dalam aplikasi setelah `/trips`. Mencatat seluruh pengeluaran operasional dan perawatan (servis, onderdil, BBM, GPS, cicilan truk, admin bank) per truk. Data ini digunakan oleh modul Bagi Hasil untuk menghitung `totalExpenses` dalam periode tutup buku.

Database sudah memiliki skema `expenses` dan tabel sudah berisi **927 record historis** dari import Excel. Pekerjaan di plan ini membangun lapisan UI dan data-fetching di atasnya **tanpa migrasi schema baru**.

---

## Scope

### In-Scope
- Halaman `/expenses` RSC dengan tabel data, filter, dan KPI summary
- Form dialog tambah/edit pengeluaran (`createExpense` & `updateExpense` Server Actions)
- Delete dengan konfirmasi (`deleteExpense` Server Action)
- Zod schema validasi form
- Query functions (list + summary) dengan filter truckId, bulan, tahun

### Out-of-Scope
- Migrasi database (skema expenses sudah final)
- Export PDF/Excel (modul laporan terpisah)

---

## Task Breakdown

- [x] **Task 1: Zod Schema & Types**
  - Create: `features/expenses/expenses.schema.ts`
  - Test: `domain/__tests__/expenses-schema.test.ts`
  - Status: `completed`

- [x] **Task 2: Query Layer**
  - Create: `features/expenses/expenses.queries.ts`
  - Test: `domain/__tests__/expenses-queries.test.ts`
  - Status: `completed`

- [x] **Task 3: Server Actions (Create / Update / Delete)**
  - Create: `features/expenses/expenses.actions.ts`
  - Test: `domain/__tests__/expenses-actions.test.ts`
  - Status: `completed`

- [x] **Task 4: KPI Summary Cards & Tabel Interaktif**
  - Create: `features/expenses/expenses-summary.tsx`
  - Create: `features/expenses/expenses-table.tsx`
  - Status: `completed`

- [x] **Task 5: Form Dialog Tambah & Edit**
  - Create: `features/expenses/expense-form-dialog.tsx`
  - Status: `completed`

- [x] **Task 6: Halaman RSC `/expenses`**
  - Create: `app/(dashboard)/expenses/page.tsx`
  - Status: `completed`

---

## Verification Plan

```bash
pnpm test        # Semua test lulus (36+ existing + test baru)
pnpm typecheck   # Zero TypeScript error
pnpm build       # Build berhasil
```
