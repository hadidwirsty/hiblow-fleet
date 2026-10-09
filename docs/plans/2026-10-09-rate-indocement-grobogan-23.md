---
title: "Implementasi Parameter Khusus Indocement Grobogan"
date: "2026-10-09"
description: "Menambahkan field dan kalkulasi khusus untuk pabrik Indocement - Grobogan pada modul Tarif"
---

# Technical Plan: Implementasi Parameter Khusus Indocement Grobogan

## 1. Analisis Kebutuhan

**Pabrik Asal:** `Indocement - Grobogan`

**Kebutuhan Field Baru (Tampilan & Database):**
1. **Zone Kode**: Input teks (menyimpan kode zona).
2. **Destinasi Kode**: Input teks (bisa menggunakan field `cityCode` yang sudah ada untuk SBI).
3. **Saving 5%**: 5% × Tarif OA per Ton.
4. **Potongan 2%**: 2% × Tarif OA per Ton.
5. **Potongan LJU**: Tonase Standar × Potongan 2%.
6. **OA Driver**: Tarif OA per Ton - Saving 5% - Potongan 2%.
7. **Pendapatan (Estimasi Jumlah)**: OA Driver × Tonase Standar.
8. **UJ 31 Ton (Sangu Supir)**: Pendapatan × Persentase Sangu.
9. **Keuntungan (Estimasi Profit Base)**: Pendapatan - UJ 31 Ton.
10. **Saving (Total Saving)**: Saving 5% × Tonase Standar.
11. **Profit (Estimasi Profit Total)**: Keuntungan + Saving.

**Aturan Bisnis:**
- Semua field kalkulasi di atas **dihitung secara otomatis** berdasarkan input hulu (Tarif OA, Tonase, Persentase), **TETAPI** tetap bisa di-edit secara manual oleh pengguna (override).
- Jika pengguna mengubah input hulu, nilai kalkulasi akan terhitung ulang.
- Karena bisa di-edit manual dan harus disimpan, kita perlu menambahkan kolom-kolom ini ke tabel `rate_references`.

---

## 2. Rencana Implementasi (Atomic Tasks)

### Task 1: Update Skema Database & Migrasi [COMPLETED]
Menambahkan kolom baru di tabel `rate_references` untuk menyimpan parameter Indocement.

**Files:**
- Modify: `db/schema/rate-references.ts`
- Create: `db/migrations/0005_burly_sebastian_shaw.sql` (via `drizzle-kit generate`)

**Requirements:**
- **FR:** Menyediakan tempat penyimpanan permanen untuk parameter khusus Indocement.
- Tambahkan kolom berikut (tipe `numeric` agar mendukung desimal):
  - `zoneCode` (varchar 50)
  - `saving5Percent` (numeric 12,2)
  - `deduction2Percent` (numeric 12,2)
  - `ljuDeduction` (numeric 12,2)
  - `oaDriver` (numeric 12,2)
  - `estimatedRevenue` (numeric 14,2)
  - `estimatedProfitBase` (numeric 14,2)
  - `totalSaving` (numeric 14,2)
  - `estimatedProfitTotal` (numeric 14,2)

**Step 1:** Tulis failing test di `features/rates/__tests__/rates-schema.test.ts` (opsional jika hanya schema DB, langsung eksekusi `drizzle-kit`).
**Step 2:** Update `db/schema/rate-references.ts`.
**Step 3:** Jalankan `pnpm run db:generate`.
**Status:** [x] Selesai - Migrasi `0005_burly_sebastian_shaw.sql` telah di-generate dan diaplikasikan.

---

### Task 2: Update Zod Schema & Types [COMPLETED]
Memperbarui kontrak data untuk validasi form dan request API.

**Files:**
- Modify: `features/rates/rates.schema.ts`
- Test: `features/rates/__tests__/rates-schema.test.ts`

**Requirements:**
- **FR:** Memvalidasi payload pembuatan dan pembaruan tarif agar menerima field baru.
- Tambahkan properti opsional (string yang divalidasi sebagai angka non-negatif) ke:
  - `createRateReferenceSchema`
  - `updateRateReferenceSchema`
  - `rateFormSchema`

**Step 1:** Tambahkan test case di `rates-schema.test.ts` untuk memvalidasi payload Indocement dengan field baru.
**Step 2:** Jalankan test (RED).
**Step 3:** Implementasikan perubahan di `rates.schema.ts`.
**Step 4:** Verifikasi test (GREEN).
**Status:** [x] Selesai - Skema Zod berhasil diupdate dan seluruh test lulus.

---

### Task 3: Update Server Actions & Export [COMPLETED]
Menyambungkan payload dari UI ke database, dan menambahkan kolom ke export Excel.

**Files:**
- Modify: `features/rates/rates.actions.ts`
- Modify: `features/rates/rates.export.ts`
- Test: `features/rates/__tests__/rates-actions.test.ts`
- Test: `features/rates/__tests__/rates-export.test.ts`

**Requirements:**
- **FR:** Menyimpan data Indocement ke DB dan menampilkan di Excel.
- Di `createRateReference` dan `updateRateReference`, mapping data dari input ke skema DB.
- Di `rates.export.ts`, tambahkan kolom ke CSV jika ada data Indocement.

**Step 1:** Buat failing test di `rates-actions.test.ts` untuk fungsi simpan data Indocement.
**Step 2:** Jalankan test (RED).
**Step 3:** Update implementasi di `rates.actions.ts` dan `rates.export.ts`.
**Step 4:** Verifikasi test (GREEN).
**Status:** [x] Selesai - Action dan export mendukung field Indocement secara persisten.

---

### Task 4: Modifikasi UI `RateFormDialog` & Kalkulasi Reaktif [COMPLETED]
Menambahkan UI khusus Indocement dan logika kalkulasi otomatis yang bisa di-override.

**Files:**
- Modify: `features/rates/rate-form-dialog.tsx`
- Create: `features/rates/rates.indocement.ts`
- Test: `features/rates/__tests__/rates-indocement.test.ts`
- Test: `features/rates/__tests__/rate-form-dialog-lifecycle.test.ts`

**Requirements:**
- **FR 1:** Tampilkan seksi "Parameter Khusus Indocement Grobogan" jika `originPlant` mengandung "Indocement" atau "Grobogan".
- **FR 2:** Sediakan input untuk Destinasi Kode (`cityCode`) dan Zone Kode (`zoneCode`).
- **FR 3:** Tampilkan grid input untuk `saving5Percent`, `deduction2Percent`, `ljuDeduction`, `oaDriver`, `estimatedRevenue` (Pendapatan), `defaultSangu` (UJ 31 Ton), `estimatedProfitBase` (Keuntungan), `totalSaving` (Saving), `estimatedProfitTotal` (Profit).
- **FR 4:** Gunakan `useEffect` untuk mengkalkulasi ulang secara otomatis JIKA input hulu (`ratePerTon`, `standardTonnage`, `sanguPercentage`) berubah. Karena field bisa diedit manual, kita gunakan `setValue` saat hulu berubah, tetapi biarkan pengguna mengetik manual di input field-nya.
- **FR 5:** Sembunyikan bagian Kalkulasi Otomatis standar jika mode Indocement aktif (karena UI kalkulasinya sudah tergabung di form).

**Step 1:** Buat test rendering dan kalkulasi Indocement di `rates-indocement.test.ts` dan `rate-form-dialog-lifecycle.test.ts`.
**Step 2:** Jalankan test (RED).
**Step 3:** Implementasi logika reaktif dan penambahan elemen form di `rate-form-dialog.tsx`.
**Step 4:** Verifikasi test (GREEN).
**Status:** [x] Selesai - UI dan kalkulasi reaktif Indocement berhasil diimplementasikan dan diuji.

---

### Task 5: Penyesuaian `RateDetailSheet` [COMPLETED]
Menampilkan parameter Indocement di dalam modal detail.

**Files:**
- Modify: `features/rates/rate-detail-sheet.tsx`
- Test: `features/rates/__tests__/rate-detail-sheet.test.ts`

**Requirements:**
- **FR:** Menampilkan informasi lengkap Saving, Potongan, OA Driver, dll jika rute tersebut adalah Indocement Grobogan.

**Step 1:** Buat test di `rate-detail-sheet.test.ts` untuk memastikan field Indocement tampil.
**Step 2:** Jalankan test (RED).
**Step 3:** Tambahkan blok UI kondisional di `rate-detail-sheet.tsx`.
**Step 4:** Verifikasi test (GREEN).
**Status:** [x] Selesai - Parameter Indocement Grobogan tampil secara informatif dan terintegrasi pada lembar detail tarif.
