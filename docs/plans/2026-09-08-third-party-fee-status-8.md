# Implementation Plan: Pelacakan Status Pembayaran Fee DO Pihak Ketiga & Insentif Supir

**Tanggal Dokumen:** 2026-09-08  
**Target Proyek:** `hiblow-fleet`  
**Nomor Sequence:** `2026-09-08-third-party-fee-status-8.md`  
**Status:** Ready for Execution (`/scaffold-execute`)  
**Referensi Spesifikasi:**  
- [docs/specs/2026-09-03-hiblow-fleet-design.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/specs/2026-09-03-hiblow-fleet-design.md) (Bagian 5.3 Skema Relasional `trips`)  
- [docs/02-feature-list-prioritas.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/02-feature-list-prioritas.md) (Fitur 2.6 — Should Have: "Pencatatan Status Pembayaran DO Pihak Ketiga")  
- [.agents/rules/project-context.md](file:///Users/hadidwirsty/Project/hiblow-fleet/.agents/rules/project-context.md)

---

## 1. Ringkasan Eksekutif & Ruang Lingkup

Pada operasional pengiriman semen curah HW Trans, sebagian order surat jalan menggunakan DO dari pihak ketiga seperti **Mas Mawan / CV Satria Perwira** atau **SILOG**. Untuk setiap ritase tersebut, terdapat kewajiban `third_party_fee` (misal Rp 50.000 s/d Rp 100.000 per rit) yang harus dibayarkan secara berkala. Selain itu, supir berhak menerima insentif ritase standar (Rp 35.000 per rit).

Data historis spreadsheet mencatat status pembayaran ini dalam format seperti *"Sudah dibayar 25 Jun 25 5rit"*, *"Sudah dibayar 12 Sep 25 10rit"*, dsb.

Fitur ini menyediakan:
1. Kemampuan mencatat dan memperbarui status pelunasan fee pihak ketiga dan insentif supir.
2. Indikator visual (badge status) pada tabel ritase untuk mengetahui surat jalan mana yang fee pihak ketiganya belum lunas vs sudah lunas.
3. Dialog *Quick Update* langsung dari baris tabel ritase tanpa harus mengubah seluruh data surat jalan.
4. Filter cepat pada tabel ritase untuk memantau utang-piutang DO pihak ketiga yang masih pending.

---

## 2. Gap Analysis (Mandatory Specification Extraction)

| Noun / Data Field | Verb / Action | Mapping ke Task | Rationale / Detail |
|---|---|---|---|
| `thirdPartyStatus` (varchar 100) | Update status pelunasan fee DO pihak ketiga | Task 1, Task 2, Task 3 | Kolom di database sudah ada, perlu Server Action dan UI dialog input. |
| `incentiveStatus` (varchar 100) | Update status pelunasan insentif supir | Task 1, Task 2, Task 3 | Kolom di database sudah ada, perlu form input dan toggle status. |
| `thirdPartyName` & `thirdPartyFee` | Visualisasi & filter pending | Task 4 | Menampilkan badge status lunas/belum pada baris yang memiliki fee pihak ketiga. |
| Quick update action | Update status DO secara instan dari tabel | Task 3, Task 4 | Pengelola dapat menandai pelunasan fee banyak ritase dengan cepat. |

---

## 3. Rencana Tugas Atomik (TDD 4-Step Mandatory)

### [x] Task 1: Server Actions & Zod Schema untuk Update Status Fee DO & Insentif

**Files:**
- Modify: `features/trips/trips.schema.ts`
- Modify: `features/trips/trips.actions.ts`
- Test: `domain/__tests__/trips-fee-actions.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `updateTripFeeStatusSchema` memvalidasi `tripId` (UUID), `thirdPartyStatus` (string opsional), `incentiveStatus` (string opsional), `thirdPartyFee` (string desimal opsional), dan `thirdPartyName` (string opsional).
  2. Server Action `updateTripFeeStatus(input)` memperbarui record trip di database PostgreSQL dan memanggil `revalidatePath("/trips")`.
  3. Memvalidasi hak akses admin (`assertAdmin`).
- **Test Coverage**
  - [Unit] `updateTripFeeStatusSchema` memvalidasi input yang valid dan menolak UUID invalid.
  - [Integration] Server action memperbarui field status di database dan mengembalikan `{ success: true, trip }`.

**Step 1: Write failing test (RED)**
Tulis test di `domain/__tests__/trips-fee-actions.test.ts`.

**Step 2: Verify test fails**
Run: `pnpm test domain/__tests__/trips-fee-actions.test.ts`  
Expected: FAIL.

**Step 3: Write minimal implementation (GREEN)**
Tambahkan skema di `trips.schema.ts` dan fungsi action `updateTripFeeStatus` di `trips.actions.ts`.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/__tests__/trips-fee-actions.test.ts`  
Expected: PASS with exit code 0.

---

### [x] Task 2: Integrasi Field Status DO & Insentif pada Form Dialog Ritase

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Pada form dialog input ritase baru, di bawah input Fee Pihak Ketiga & Nama Pihak Ketiga, ditambahkan input:
     - **Status Pembayaran Fee DO**: Input teks dengan saran status cepat (misal: "Belum Dibayar" / "Lunas" / catatan tanggal pembayaran).
     - **Status Insentif Supir**: Opsi pilihan ("Belum Dibayar" / "Lunas").
  2. Nilai terkirim dan tersimpan saat form di-submit.
- **Non-Functional Requirements**
  - Tampilan responsive pada mobile.

**Step 1: Modifikasi `trip-form-dialog.tsx` untuk menyertakan input status**

**Step 2: Verifikasi Typecheck & Lint**
Run: `pnpm exec tsc --noEmit && pnpm lint`

---

### [x] Task 3: Komponen Modal Quick Update Status DO (`TripFeeStatusDialog`)

**Files:**
- Create: `features/trips/trip-fee-status-dialog.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Dialog ringkas yang menerima `trip: TripRecord`.
  2. Menampilkan informasi ringkas: No Surat Jalan, Armada, Tanggal Bongkar, Tujuan, dan Nominal Fee Pihak Ketiga.
  3. Field input untuk mengubah:
     - Status Fee Pihak Ketiga (misal: *"Sudah dibayar 15 Jul 25 3rit"* atau *"Lunas"*).
     - Status Insentif Supir (misal: *"Lunas"* atau *"Pending"*).
  4. Tombol preset cepat: "Tandai Lunas Hari Ini" (otomatis mengisi format *"Sudah dibayar [Tanggal Hari Ini]"*).
  5. Memanggil `updateTripFeeStatus` dan menampilkan toast notifikasi sukses.

**Step 1: Implementasi komponen `TripFeeStatusDialog`**

**Step 2: Verifikasi Typecheck & Lint**
Run: `pnpm exec tsc --noEmit && pnpm lint`

---

### [x] Task 4: Tampilan Badge Status DO & Filter di Tabel Ritase (`TripsTable`)

**Files:**
- Modify: `features/trips/trips-table.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Pada tabel ritase, tambahkan kolom **Fee DO & Status**:
     - Jika `thirdPartyFee > 0` atau ada `thirdPartyName`:
       - Tampilkan nama pihak ketiga dan nominal fee (Rp).
       - Badge status:
         - Hijau (`bg-emerald-500/10 text-emerald-600 border-emerald-500/20`): jika status mengandung "Lunas" atau "Sudah dibayar".
         - Amber (`bg-amber-500/10 text-amber-600 border-amber-500/20`): jika fee ada tetapi status kosong atau "Belum Dibayar".
       - Tombol klik / edit untuk membuka `TripFeeStatusDialog`.
     - Jika tidak ada fee pihak ketiga: tampilkan tanda strip (`-`).
  2. Toolbar filter dilengkapi opsi filter status fee:
     - "Semua Status DO"
     - "Perlu Dibayar (Pending)"
     - "Sudah Lunas"
  3. Indikator counter total fee pending jika filter aktif.

**Step 1: Modifikasi `trips-table.tsx` dengan kolom badge status DO dan kontrol filter**

**Step 2: Verifikasi Typecheck & Lint**
Run: `pnpm exec tsc --noEmit && pnpm lint`

---

### [x] Task 5: Full Test Suite, Typecheck & Production Build Verification

**Files:**
- Verify all files across the repository

**Requirements:**
- **Acceptance Criteria**
  1. Seluruh unit test Vitest (`pnpm test`) lulus 100%.
  2. TypeScript compiler (`pnpm exec tsc --noEmit`) 0 error.
  3. ESLint (`pnpm lint`) 0 error / warning.
  4. Next.js 16 Production Build (`pnpm build`) sukses tanpa komplain SSR / Turbopack.
