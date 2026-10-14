# Implementation Plan: Penyelarasan Pajak PPh 1% pada Pabrik Non-Grobogan (SI Tuban, SI Rembang, & SBI Tuban)

Dokumen perencanaan teknis berbasis Test-Driven Development (TDD) untuk menyelaraskan kebijakan Pajak PPh 1% pada seluruh rute pabrik semen (*Semen Indonesia (SI) - Tuban*, *Semen Indonesia (SI) - Rembang*, dan *Solusi Bangun Indonesia (SBI) - Tuban*) serta mempertahankan pembebasan pajak 1% khusus untuk rute *Indocement - Grobogan* (yang menerapkan formula 7% Pilihan A: 2% LJU + 5% Saving Armada).

---

## Ringkasan Eksekutif & Keputusan Mas Hafidz

Berdasarkan hasil diskusi lanjutan dengan Mas Hafidz:
1. **Pajak PPh 1%**: Berlaku pada seluruh rute pabrik semen, **KECUALI Indocement - Grobogan**:
   - **Semen Indonesia (SI) - Tuban**: Dikenakan Pajak PPh 1% dari Omset Bruto (`omset * 0.01`).
   - **Semen Indonesia (SI) - Rembang**: Dikenakan Pajak PPh 1% dari Omset Bruto (`omset * 0.01`).
   - **Solusi Bangun Indonesia (SBI) - Tuban**: Dikenakan Pajak PPh 1% dari Omset Bruto (`omset * 0.01`).
   - **Pabrik non-Grobogan lainnya**: Default 1% dari Omset Bruto.
2. **Pengecualian Indocement - Grobogan**:
   - Pajak PPh 1%: **Rp 0 (0% / Bebas Pajak 1%)**.
   - Tetap menggunakan Formula Resmi Pilihan A Mas Hafidz (Total 7%):
     - **Potongan Operasional LJU**: 2% dari Omset Bruto (`omset * 0.02`).
     - **Tabungan Kas Armada (Saving)**: 5% dari Omset Bruto (`omset * 0.05`).
3. **Dampak pada Laba Bersih Surat Jalan**:
   - Pada rute non-Grobogan, Pajak PPh 1% memotong laba operasional tunai perusahaan/armada (bukan memotong sangu supir).
   - $\text{Laba Bersih} = \text{Omset} - \text{Sangu} - \text{Biaya DO} - \text{Pajak PPh 1\%} - \text{Insentif} - \text{Uang Makan} - \text{Klaim Susut}$.

---

## Ruang Lingkup & Analisis Gap (Gap Analysis)

| Item | Noun / Verb | Status | Lokasi Target |
| :--- | :--- | :--- | :--- |
| **A** | Default Kalkulasi `tax1Pct` pada Pure Calculator | Selesai | `domain/calculators/trip-profit.ts`, `domain/calculators/__tests__/trip-profit.test.ts` |
| **B** | Live Calculation & Auto-fill Form Ritase | Selesai | `features/trips/trip-form-dialog.tsx`, `features/trips/__tests__/trip-form-calculations.test.ts` |
| **C** | Tampilan Rincian Card Live & Detail Ritase | Selesai | `features/trips/trip-form-dialog.tsx`, `features/trips/trip-detail-sheet.tsx` |
| **D** | Sinkronisasi Referensi Tarif & Ekspor | Selesai | `features/rates/rates.export.ts`, `features/rates/rate-detail-sheet.tsx` |
| **E** | Pembaruan Context Memory Project | Selesai | `.agents/rules/project-context.md` |
| **F** | Penyelarasan & Refinement Temuan Audit | Selesai | `features/trips/trips.export.ts`, `features/rates/rates-table.tsx`, `features/profit-sharing/` |

---

## Rangkaian Tugas Atomik TDD (Atomic Tasks) - Status: 100% Selesai

### Task 1: [SELESAI] [Domain] Refactor `calculateTripProfit` untuk Pajak 1% pada Pabrik Non-Grobogan

**Files:**
- Modify: `domain/calculators/trip-profit.ts:50-74`
- Test: `domain/calculators/__tests__/trip-profit.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. Bila `hasSpecialDeductions === false` dan `input.tax1Pct === undefined`, `tax1Pct` dihitung otomatis sebesar 1% dari omset (`Math.round(omset * 0.01 * 100) / 100`).
  2. Bila `hasSpecialDeductions === true` (Indocement Grobogan), `tax1Pct` tetap bernilai `0` (bebas pajak 1%).
  3. Bila `input.tax1Pct` diberikan secara eksplisit (misal data historis atau penyesuaian khusus), nilai tersebut tetap dihormati (*override*).
  4. Laba operasional (`profit`) pada rute non-Grobogan berkurang sebesar nilai `tax1Pct`.
- **Functional Requirements**
  - Menerapkan pemotongan PPh 1% otomatis untuk rute pabrik Semen Indonesia dan Solusi Bangun Indonesia.
- **Non-Functional Requirements**
  - Pure function, deterministik, presisi matematika 2 desimal.
- **Test Coverage**
  - [Unit] Rute standar non-Grobogan dengan omset Rp 2.400.000 menghasilkan `tax1Pct: 24000` dan profit `1.091.000`.
  - [Unit] Rute Indocement Grobogan tetap menghasilkan `tax1Pct: 0` dan laba utuh sebelum potongan LJU 2%.
  - [Unit] Override eksplisit `tax1Pct` tetap dihormati.

**Step 1: Write failing test (RED)**
Perbarui pengujian di `domain/calculators/__tests__/trip-profit.test.ts`:
```ts
it("calculates 1% tax deduction for standard non-Grobogan cement plant routes (SI Tuban, SI Rembang, SBI Tuban)", () => {
  const result = calculateTripProfit({
    omset: 2400000,
    sangu: 1200000,
    incentivePaid: 35000,
    thirdPartyFee: 50000,
    hasSpecialDeductions: false,
  })

  // Pajak 1% dari omset 2.400.000 = 24.000
  expect(result.tax1Pct).toBe(24000)
  expect(result.deduction2PctLju).toBe(0)
  expect(result.deduction5PctUjGrb).toBe(0)
  // Laba: 2.400.000 - 1.200.000 - 35.000 - 50.000 - 24.000 = 1.091.000
  expect(result.profit).toBe(1091000)
})
```

**Step 2: Verify test fails**
Run: `pnpm test domain/calculators/__tests__/trip-profit.test.ts`
Expected: FAIL karena `result.tax1Pct` masih `0`.

**Step 3: Write minimal implementation (GREEN)**
Perbarui percabangan di `domain/calculators/trip-profit.ts`:
```ts
  if (hasSpecialDeductions) {
    if (input.tax1Pct === undefined) {
      tax1Pct = 0
    }
    if (input.deduction2PctLju === undefined) {
      deduction2PctLju = Math.round(omset * 0.02 * 100) / 100
    }
    if (input.deduction5PctUjGrb === undefined) {
      deduction5PctUjGrb = 0
    }
    if (input.savings === undefined) {
      savings = Math.round(omset * 0.05 * 100) / 100
    }
  } else {
    // Pabrik selain Indocement Grobogan (SI Tuban, SI Rembang, SBI Tuban):
    // Dikenakan Pajak PPh 1% dari Omset
    if (input.tax1Pct === undefined) {
      tax1Pct = Math.round(omset * 0.01 * 100) / 100
    }
    if (input.deduction2PctLju === undefined) deduction2PctLju = 0
    if (input.deduction5PctUjGrb === undefined) deduction5PctUjGrb = 0
  }
```

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/calculators/__tests__/trip-profit.test.ts`
Expected: PASS dengan exit code 0.

---

### Task 2: [SELESAI] [UI/Feature] Sinkronisasi `liveCalc` & Transparansi Pajak 1% pada Form Ritase (`trip-form-dialog.tsx`)

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx:490-550` & `features/trips/trip-form-dialog.tsx:1760-1825`
- Test: `features/trips/__tests__/trip-form-calculations.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. Pada `liveCalc` di `trip-form-dialog.tsx`:
     - Jika `!hasSpecialDeductions && omset > 0`, `tax1Pct` dihitung otomatis sebesar `Math.round(0.01 * omset)`.
     - Jika `hasSpecialDeductions && omset > 0`, `tax1Pct` diset ke `0`.
  2. Efek sinkronisasi form `setValue("tax1Pct", liveCalc.tax1Pct.toFixed(2))` menyimpan nilai pajak 1% ke form state saat input ritase rute non-Grobogan.
  3. Pada Baris 9: Card Kalkulasi Otomatis (Live):
     - Jika `hasSpecialDeductions` aktif: Menampilkan breakdown formula 7% Indocement Grobogan (2% LJU + 5% Saving armada).
     - Jika `!hasSpecialDeductions` dan `liveCalc.tax1Pct > 0` (SI Tuban, SI Rembang, SBI Tuban):
       - Tampilkan baris rincian:
         - `• Pajak PPh (1% dari Omset)`: `formatCurrency(liveCalc.tax1Pct)` (Warna teks lembut).
         - Keterangan informatif: *"Beban PPh pabrik dipotong langsung dari laba operasional armada."*
- **Functional Requirements**
  - Memberikan kepastian angka kepada admin bahwa ritase rute SI dan SBI sudah otomatis diperhitungkan pajak 1%-nya.
- **Test Coverage**
  - [Integration] `trip-form-calculations.test.ts` memvalidasi rute SI Tuban default terpotong pajak 1% dan Grobogan bebas pajak 1%.

**Step 1: Write failing test (RED)**
Tambahkan skenario pengujian di `features/trips/__tests__/trip-form-calculations.test.ts`:
```ts
it("automatically applies 1% PPh tax deduction for SI Tuban and SBI Tuban in live calculations", () => {
  const ratePerTon = 95000
  const unloadedTonnage = 31.0
  const sangu = 1531000
  const omset = 2945000

  const res = calculateTripProfit({
    omset,
    sangu,
    hasSpecialDeductions: false,
  })

  // Pajak 1% = 29.450
  expect(res.tax1Pct).toBe(29450)
  // Laba = 2.945.000 - 1.531.000 - 29.450 = 1.384.550
  expect(res.profit).toBe(2945000 - 1531000 - 29450)
})
```

**Step 2: Verify test fails**
Run: `pnpm test features/trips/__tests__/trip-form-calculations.test.ts`
Expected: FAIL karena test rute SI Tuban lama masih mengasumsikan `tax1Pct: 0`.

**Step 3: Write minimal implementation (GREEN)**
1. Perbarui `liveCalc` di `features/trips/trip-form-dialog.tsx`:
```ts
    if (hasSpecialDeductions && omset > 0) {
      tax1Pct = 0
      deduction2PctLju = Math.round(0.02 * omset)
      deduction5PctUjGrb = 0
      savings = Math.round(0.05 * omset)
    } else if (omset > 0) {
      tax1Pct = Math.round(0.01 * omset)
      deduction2PctLju = 0
      deduction5PctUjGrb = 0
    }
```
2. Tambahkan tampilan baris rincian Pajak PPh 1% pada Card Kalkulasi Live saat `!hasSpecialDeductions && liveCalc.tax1Pct > 0`.
3. Sesuaikan baseline pengujian di `trip-form-calculations.test.ts` agar menyertakan pajak 1% pada rute SI Tuban standar.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test features/trips/__tests__/trip-form-calculations.test.ts`
Expected: PASS dengan exit code 0.

---

### Task 3: [SELESAI] [UI/Detail & Export] Penyempurnaan Tampilan Pajak 1% pada Detail Ritase & Master Tarif

**Files:**
- Modify: `features/trips/trip-detail-sheet.tsx:595-610`
- Modify: `features/rates/rates.export.ts:55-58`
- Modify: `features/rates/rate-detail-sheet.tsx:680-705`

**Requirements:**
- **Acceptance Criteria**
  1. Pada `trip-detail-sheet.tsx` Section 4:
     - Tampilkan baris `Pajak PPh (1%): formatCurrency(tax1)` saat `tax1 > 0`.
     - Sertakan keterangan: *"Dipotong dari omset kotor untuk pabrik non-Grobogan."*
  2. Pada `rates.export.ts`:
     - Kolom potongan khusus menampilkan `"LJU (2% Operasional + 5% Saving)"` jika `rate.hasSpecialDeductions`, dan `"PPh 1%"` jika bukan Grobogan.
  3. Pada `rate-detail-sheet.tsx`:
     - Rincian potongan khusus memperjelas status: rute Indocement Grobogan menggunakan skema LJU 7%, sedangkan rute pabrik SI/SBI menggunakan skema PPh 1%.
- **Functional Requirements**
  - Menghilangkan label kadaluarsa `"LJU (1%, 2%, 5%)"` di seluruh sistem.
- **Non-Functional Requirements**
  - UI Copywriting 100% Bahasa Indonesia baku.

**Step 1: Write minimal implementation**
Perbarui teks dan badge pada `trip-detail-sheet.tsx`, `rates.export.ts`, dan `rate-detail-sheet.tsx`.

**Step 2: Verify component tests**
Run: `pnpm test features/rates/__tests__/rates-export.test.ts features/rates/__tests__/rate-detail-sheet.test.ts`
Expected: PASS dengan exit code 0.

---

### Task 4: [SELESAI] [Dokumentasi Context] Pembaruan Rule Context Memory & Formula Finansial

**Files:**
- Modify: `.agents/rules/project-context.md:250-265`

**Requirements:**
- **Acceptance Criteria**
  1. Dokumentasikan secara eksplisit di Seksi 4.2:
     - Rute Pabrik Semen Indonesia (Tuban & Rembang) dan Solusi Bangun Indonesia (Tuban): Dikenakan Pajak PPh 1% dari omset kotor (`tax1Pct = omset * 0.01`).
     - Rute Indocement Grobogan: Bebas Pajak PPh 1% (`tax1Pct = 0`), dikenakan potongan 7% (2% Operasional LJU + 5% Tabungan Kas Armada).
- **Functional Requirements**
  - Menjaga single source of truth arsitektur dan finansial proyek tetap mutakhir.

**Step 1: Write updates**
Perbarui deskripsi aturan bisnis di `.agents/rules/project-context.md`.

---

### Task 5: [SELESAI] [Verifikasi Komprehensif] Full Regression Suite, Typecheck, & Lint

**Files:**
- All touched files

**Verification Commands:**
```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm run format
```

**Acceptance Criteria:**
- 100% test lulus (seluruh 49 test suite, 260/260 tests).
- 0 lint error dan 0 type error.
- UI Copywriting 100% Bahasa Indonesia baku.

---

### Task 6: [SELESAI] [Penyelarasan & Refinement Temuan Audit]
1. **Ekspor Rekap Ritase**: Header `trips.export.ts` menyertakan `"Tabungan Kas Armada 5% (Rp)"` dan `"Total Nilai Armada (Rp)"` menggantikan label usang `"Pot 5% UJ GRB (Rp)"`. Unit test `trips-export.test.ts` diverifikasi lulus.
2. **Visual Master Tarif**: Tabel `rates-table.tsx` dan kartu mobile `rate-mobile-card.tsx` menampilkan badge konsisten `"LJU (7%)"` untuk Grobogan dan `"PPh 1%"` untuk non-Grobogan (menggantikan tanda hubung `-`).
3. **Form Ritase**: Sinkronisasi `setValue("savings", ...)` dijalankan secara *unconditional* untuk mencegah *lingering state* saat berpindah rute, serta penambahan *defensive fallback* deteksi rute Grobogan saat mengedit ritase tanpa `rateReferenceId`.
4. **Detail Sheet Ritase**: Render Section 4 rincian potongan/tabungan diperbarui menjadi `(totalDeductions > 0 || savings > 0)` dan pemotongan operasional 2% LJU diformat dengan tanda minus merah.
5. **Kepatuhan UI Copywriting**: Standarisasi istilah bahasa Inggris `"Draft"` dan `"Finalized"` menjadi `"Draf"` dan `"Resmi"` pada `period-card.tsx`, `period-detail-sheet.tsx`, dan `profit-sharing.export.ts`.
6. **Unit Test Refactoring**: Perbarui pengujian lama di `trip-form-calculations.test.ts` agar mencerminkan spesifikasi resmi Pilihan A.

---

## Rangkuman Deliverables & Next Step

Seluruh rangkaian tugas implementasi dan penyelarasan temuan audit telah selesai 100% dan terverifikasi penuh:
- Typecheck: 0 error
- Lint: 0 error
- Tests: 49/49 file test suite (260/260 tests lulus)

Langkah selanjutnya yang direkomendasikan:
- Jalankan `/scaffold-review` untuk audit menyeluruh sebelum commit, atau
- Jalankan `/scaffold-commit` untuk membuat commit atomik Conventional Commits.

