# Implementation Plan: Modul Export Laporan Excel (.xlsx) & CSV

**Tanggal Dokumen:** 2026-09-08  
**Target Proyek:** `hiblow-fleet`  
**Nomor Sequence:** `2026-09-08-export-excel-csv-7.md`  
**Status:** Ready for Execution (`/scaffold-execute`)  
**Referensi Spesifikasi:**  
- [docs/specs/2026-09-03-hiblow-fleet-design.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/specs/2026-09-03-hiblow-fleet-design.md) (Bagian 2.1 Butir 4, Bagian 4 Tabel No. 7)  
- [docs/02-feature-list-prioritas.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/02-feature-list-prioritas.md) (Fitur 2.3 — Should Have / Wajib Ada)  
- [.agents/rules/project-context.md](file:///Users/hadidwirsty/Project/hiblow-fleet/.agents/rules/project-context.md)

---

## 1. Ringkasan Eksekutif & Ruang Lingkup

Fitur ini menyediakan kapabilitas ekspor data laporan operasional dan keuangan HW Trans ke format file **Microsoft Excel (.xlsx)** dan **Universal Spreadsheet (.csv)**. Fitur ini memungkinkan Mas Hafidz (Pengelola) dan para Investor mengunduh rekapitulasi data riil untuk keperluan:
1. Arsip fisik offline dan pencatatan komparatif.
2. Pengiriman laporan resmi bulanan via WhatsApp grup investor.
3. Analisis lanjutan pada spreadsheet pihak ketiga (Google Sheets, Microsoft Excel, Apple Numbers).

### Cakupan Halaman & Data yang Diekspor:
1. **Laporan Ritase (`/trips`)**: Data surat jalan/ritase sesuai filter aktif (Armada, Bulan, Tahun).
2. **Laporan Pengeluaran Kas Truk (`/expenses`)**: Data buku kas beban operasional/servis sesuai filter aktif (Armada, Kategori, Bulan, Tahun).
3. **Lembar Rekapitulasi Bagi Hasil Bulanan (`/profit-sharing`)**: Data periode tutup buku resmi, ringkasan laba bersih, dan tabel pembagian dividen masing-masing investor.

---

## 2. Gap Analysis (Mandatory Specification Extraction)

| Noun / Data Field | Verb / Action | Mapping ke Task | Rationale / Detail |
|---|---|---|---|
| `trips` data (OrderNo, Dates, Rates, Tonnage, Omset, Sangu, Deductions, Profit) | Export ke .xlsx & .csv | Task 2, Task 4 | Data ritase yang sedang difilter diubah menjadi baris spreadsheet terformat rapi. |
| `expenses` data (Date, Truck, Category, Description, Location, Notes, Amount, AdminFee) | Export ke .xlsx & .csv | Task 2, Task 5 | Data beban operasional diubah menjadi baris kas keluar. |
| `profit_sharing` & `profit_shares` data (Totals, Commission, Distributable, Shares) | Export ke .xlsx & .csv | Task 3, Task 6 | Rincian lembar tutup buku dan hak pembagian modal investor. |
| Browser download trigger (`Blob`, `FileSaver`) | Download file ke komputer / smartphone | Task 1 | Helper client-side untuk memicu unduhan file tanpa reload halaman. |

---

## 3. Rencana Tugas Atomik (TDD 4-Step Mandatory)

### [x] Task 1: Core Export Builders & Download Helper (`csv-builder`, `excel-builder`, `download`)

**Files:**
- Create: `lib/export/csv-builder.ts`
- Create: `lib/export/excel-builder.ts`
- Create: `lib/export/download.ts`
- Test: `lib/__tests__/csv-builder.test.ts`
- Test: `lib/__tests__/excel-builder.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `buildCsvString({ headers, rows })` menghasilkan string CSV berstandar RFC-4180 dengan prefix UTF-8 BOM (`\uFEFF`) agar dibuka di Microsoft Excel tanpa karakter rusak.
  2. Karakter khusus (koma, tanda kutip ganda `""`, newline `\n`) di-escape dengan benar.
  3. `buildExcelWorkbookBlob({ sheets })` menghasilkan objek `Blob` bervalidasi format `.xlsx` menggunakan SheetJS `xlsx`.
  4. `triggerBlobDownload(blob, filename)` membuat elemen anchor virtual dan memicu unduhan di browser.
- **Functional Requirements**
  - Menyediakan pure functions yang menerima data tabular generik (`headers: string[]`, `rows: (string | number | null | undefined)[][]`).
- **Non-Functional Requirements**
  - Zero memory leaks: `URL.revokeObjectURL()` dipanggil setelah pemicu unduhan selesai.
- **Test Coverage**
  - [Unit] `buildCsvString` dengan data normal, tanda kutip, koma, angka.
  - [Unit] `buildExcelWorkbookBlob` menghasilkan valid ArrayBuffer/Blob dengan MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

**Step 1: Write failing test (RED)**
Tulis test di `lib/__tests__/csv-builder.test.ts` dan `lib/__tests__/excel-builder.test.ts`.

**Step 2: Verify test fails**
Run: `pnpm test lib/__tests__/csv-builder.test.ts`  
Expected: FAIL (Cannot find module `lib/export/csv-builder`).

**Step 3: Write minimal implementation (GREEN)**
Implementasikan `lib/export/csv-builder.ts`, `lib/export/excel-builder.ts`, dan `lib/export/download.ts`.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test lib/__tests__/csv-builder.test.ts lib/__tests__/excel-builder.test.ts`  
Expected: PASS with exit code 0.

---

### [x] Task 2: Domain Serializer Data Ritase & Pengeluaran (`trips.export` & `expenses.export`)

**Files:**
- Create: `features/trips/trips.export.ts`
- Create: `features/expenses/expenses.export.ts`
- Test: `domain/__tests__/trips-export.test.ts`
- Test: `domain/__tests__/expenses-export.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `formatTripsForExport(trips)` memetakan entitas ritase menjadi baris tabular: No Surat Jalan, Armada (W 8187 UA / H 8133 OF), Tgl Order, Tgl Bongkar, Kota Tujuan, Pabrik Tujuan, Tarif/Ton, Tonase Muat, Tonase Bongkar, Omset, Sangu Supir, Insentif, Fee Pihak Ketiga, Potongan Khusus, dan Laba Ritase.
  2. `formatExpensesForExport(expenses)` memetakan transaksi kas keluar: No, Tanggal, Armada, Kategori Beban, Keterangan/Uraian, Lokasi, Catatan Perbaikan, Nominal, Biaya Admin Bank, dan Total Beban.
  3. Menyediakan generator nama file deskriptif berdasarkan filter (misal: `rekap-ritase-W8187UA-2025-09.xlsx` atau `rekap-pengeluaran-semua-2025-09.xlsx`).
- **Functional Requirements**
  - Pure transformer function tanpa I/O atau panggilan database langsung.
- **Test Coverage**
  - [Unit] `formatTripsForExport` dengan array trips riil.
  - [Unit] `formatExpensesForExport` dengan array expenses riil.

**Step 1: Write failing test (RED)**
Tulis test di `domain/__tests__/trips-export.test.ts` dan `domain/__tests__/expenses-export.test.ts`.

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/trips-export.test.ts`  
Expected: FAIL (Cannot find module).

**Step 3: Write minimal implementation (GREEN)**
Implementasikan fungsi serialisasi di `features/trips/trips.export.ts` dan `features/expenses/expenses.export.ts`.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/trips-export.test.ts domain/__tests__/expenses-export.test.ts`  
Expected: PASS with exit code 0.

---

### [x] Task 3: Domain Serializer Data Bagi Hasil & Rincian Pemodal (`profit-sharing.export`)

**Files:**
- Create: `features/profit-sharing/profit-sharing.export.ts`
- Test: `domain/__tests__/profit-sharing-export.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `formatProfitSharingForExport(period)` menghasilkan 2 sheet atau struktur rekapitulasi lengkap:
     - **Sheet 1 (Ringkasan Keuangan)**: Judul Periode, Rentang Tanggal Bongkar, Status, Total Omset Ritase, Total Beban Operasional, Laba Kotor (Gross), Komisi Pengelola 5%, Laba Bersih Siap Dibagi (Distributable Profit), Valuasi Armada, Laba Bersih Pengelola, dan Total Take-Home Pengelola.
     - **Sheet 2 (Rincian Dividen Pemodal)**: No, Nama Pemodal, Modal Disetor (Rp), Porsi Kepemilikan (%), Hak Pembagian (Rp), Catatan.
  2. Menghasilkan nama file formal: `laporan-bagi-hasil-september-2025.xlsx`.
- **Functional Requirements**
  - Mendukung ekspor format `.xlsx` (multi-sheet) dan format `.csv` (single-sheet rekap gabungan).
- **Test Coverage**
  - [Unit] `formatProfitSharingForExport` memvalidasi kalkulasi row total pembagian identik dengan data periode.

**Step 1: Write failing test (RED)**
Tulis test di `domain/__tests__/profit-sharing-export.test.ts`.

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/profit-sharing-export.test.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation (GREEN)**
Implementasikan `features/profit-sharing/profit-sharing.export.ts`.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/profit-sharing-export.test.ts`  
Expected: PASS with exit code 0.

---

### [x] Task 4: Integrasi Tombol Export pada Tabel Ritase (`/trips`)

**Files:**
- Create: `features/trips/trips-export-button.tsx`
- Modify: `features/trips/trips-table.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Terdapat tombol dropdown "Export Laporan" di bilah kontrol filter tabel ritase.
  2. Klik opsi "Download Excel (.xlsx)" memicu unduhan file `.xlsx` berisi seluruh data ritase yang sedang difilter.
  3. Klik opsi "Download CSV (.csv)" memicu unduhan file `.csv` dengan UTF-8 BOM.
  4. Muncul toast feedback (Sonner): "Berhasil mengunduh laporan ritase [nama file]".
  5. Tombol disabled secara anggun jika data ritase kosong (0 baris).
- **Non-Functional Requirements**
  - Desain tombol mengikuti tema shadcn/ui dan responsive pada mobile viewport.

**Step 1: Write failing test / Component Test**
Verifikasi integrasi tombol ekspor.

**Step 2: Implementasi komponen `TripsExportButton` & hubungkan ke `TripsTable`**

**Step 3: Verifikasi Lint & Typecheck**
Run: `pnpm exec tsc --noEmit && pnpm lint`

---

### [x] Task 5: Integrasi Tombol Export pada Tabel Pengeluaran (`/expenses`)

**Files:**
- Create: `features/expenses/expenses-export-button.tsx`
- Modify: `features/expenses/expenses-table.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Terdapat tombol dropdown "Export Kas" di samping filter buku pengeluaran truk.
  2. Mendukung opsi unduh file `.xlsx` dan `.csv` sesuai filter aktif (Armada, Kategori, Periode Bulan/Tahun).
  3. Toast notifikasi konfirmasi unduhan file.

**Step 1: Implementasi komponen `ExpensesExportButton` & hubungkan ke `ExpensesTable`**

**Step 2: Verifikasi Lint & Typecheck**
Run: `pnpm exec tsc --noEmit && pnpm lint`

---

### [x] Task 6: Integrasi Tombol Export pada Lembar Bagi Hasil (`/profit-sharing`)

**Files:**
- Modify: `features/profit-sharing/period-detail-sheet.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Pada sheet rincian periode (`PeriodDetailSheet`), di samping tombol "Cetak Lembar" (`RiPrinterLine`), ditambahkan tombol dropdown atau tombol aksi "Export Excel" (`RiFileExcelLine`) dan "Export CSV".
  2. Saat diklik, file rekapitulasi tutup buku dan dividen investor langsung terunduh ke perangkat pengguna.
  3. Tombol ini juga dapat diakses oleh akun Partner/Investor (read-only mode) untuk mengunduh arsip laporan mereka.

**Step 1: Tambahkan tombol export & handler unduhan di `PeriodDetailSheet`**

**Step 2: Verifikasi Lint & Typecheck**
Run: `pnpm exec tsc --noEmit && pnpm lint`

---

### [x] Task 7: Full Test Suite, Typecheck & Production Build Verification

**Files:**
- Verify all files across the repository

**Requirements:**
- **Acceptance Criteria**
  1. Seluruh unit test Vitest (`pnpm test`) lulus 100%.
  2. TypeScript compiler (`pnpm exec tsc --noEmit`) 0 error.
  3. ESLint (`pnpm lint`) 0 error / warning.
  4. Next.js 16 Production Build (`pnpm build`) berhasil dibangun tanpa isu runtime / bundling.

---

## 4. Standar Kepatuhan Teknis (Technical Constitution & Clean Code)

1. **Import Ordering:** Mengikuti 6 blok hirarki ketat: React/Next.js $\to$ Third-party (`xlsx`, `@remixicon/react`) $\to$ UI components $\to$ Feature components $\to$ Hooks/Utils $\to$ Types (`import type`).
2. **I/O Isolation (Testability-First):** Logika formatting dan penyusunan baris/kolom spreadsheet diisolasi murni di fungsi pure TypeScript, tidak bercampur dengan state React atau database queries.
3. **Bahasa:** Seluruh kode, nama file, nama fungsi dalam Bahasa Inggris; nama label kolom file ekspor dalam Bahasa Indonesia yang komunikatif sesuai istilah operasional (misal: "No. Surat Jalan", "Tonase Bongkar (Ton)", "Omset Bruto (Rp)", "Sangu Supir (Rp)").
