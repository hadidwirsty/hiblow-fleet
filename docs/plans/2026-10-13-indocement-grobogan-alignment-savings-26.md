# Implementation Plan: Penyelarasan Formula Indocement Grobogan (7%), Breakdown Live Kalkulasi, & Akumulasi Tabungan Saving pada Bagi Hasil

Dokumen perencanaan implementasi teknis berbasis Test-Driven Development (TDD) untuk menyelaraskan formula rute Indocement Grobogan menjadi 7% (Pilihan A hasil konfirmasi Mas Hafidz), menampilkan rincian transparan pada kartu kalkulasi live dan detail ritase, serta mengakumulasikan cadangan tabungan kas armada (saving 5%) ke dalam modul Bagi Hasil (*Profit Sharing*).

---

## Ringkasan Eksekutif & Keputusan Mas Hafidz

Berdasarkan lembar konfirmasi operasional resmi:
1. **Pajak PPh 1%**: **TIDAK ADA** (Dihapus dari potongan rute Indocement Grobogan).
2. **Komponen 5%**: Merupakan **Tabungan Kas Armada (Saving)** milik perusahaan/truk yang disimpan di PT LJU (membedakan tarif kotor dengan OA Driver 93%), **BUKAN biaya hangus**.
3. **Formula Disahkan**: **PILIHAN A** — Total **7%** dari Omset Bruto:
   - **Potongan Operasional LJU**: 2% dari Omset (biaya operasional LJU yang memotong laba tunai).
   - **Tabungan Kas Armada (Saving)**: 5% dari Omset (terakumulasi ke kas tabungan armada/cadangan kas di LJU).
   - **Sangu Supir**: Dihitung dari 50% OA Driver (basis 93% tarif).
   - **Laba Operasional Bersih Ritase**: $\text{Omset} - \text{Sangu} - \text{Biaya DO} - \text{Potongan LJU 2\%} - \text{Insentif} - \text{Uang Makan} - \text{Klaim Susut}$.
   - **Total Nilai Armada**: $\text{Laba Operasional Bersih} + \text{Tabungan Kas Armada (Saving 5\%)}$.

---

## Ruang Lingkup & Analisis Gap (Gap Analysis)

| Item | Noun / Verb | Status | Lokasi Target |
| :--- | :--- | :--- | :--- |
| **A** | Penyelarasan Formula 7% (`calculateTripProfit`, `trip-form-dialog`) | Selesai | `domain/calculators/trip-profit.ts`, `features/trips/trip-form-dialog.tsx` |
| **B** | Rincian Breakdown Card Live & Detail Ritase | Selesai | `features/trips/trip-form-dialog.tsx`, `features/trips/trip-detail-sheet.tsx` |
| **D** | Query & Akumulasi Saving 5% pada Periode Bagi Hasil | Selesai | `features/profit-sharing/profit-sharing.queries.ts`, `features/profit-sharing/profit-sharing.actions.ts`, `db/schema/profit-sharing.ts` |
| **D** | Tampilan KPI Cadangan Tabungan Armada di Wizard & Sheet | Selesai | `features/profit-sharing/period-wizard-dialog.tsx`, `features/profit-sharing/period-detail-sheet.tsx`, `features/profit-sharing/partner-profit-sharing-view.tsx` |

---

## Rangkaian Tugas Atomik TDD (Atomic Tasks) - Status: 100% Selesai

### Task 1: [SELESAI] [Domain] Refactor `calculateTripProfit` untuk Formula Indocement 7% (Pilihan A)

**Files:**
- Modify: `domain/calculators/trip-profit.ts:40-88`
- Test: `domain/calculators/__tests__/trip-profit.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. Bila `hasSpecialDeductions === true`, default `tax1Pct` menjadi 0 (bukan 1% omset).
  2. Default `deduction2PctLju` tetap 2% omset.
  3. Default `deduction5PctUjGrb` menjadi 0 (karena 5% dialihkan ke `savings`).
  4. Default `savings` dihitung otomatis sebagai 5% omset (`Math.round(omset * 0.05 * 100) / 100`) jika belum dispesifikasikan.
  5. Nilai `profit` adalah laba operasional tunai bersih: `omset - sangu - thirdPartyFee - deduction2PctLju - incentivePaid - mealAllowance - claim - claimDriver`.
  6. Kembalikan `savings` dalam `TripProfitResult` agar komponen tabungan kas armada dapat dibaca langsung oleh consumer.
  7. Sediakan `totalArmadaValue = profit + savings` pada hasil kalkulasi.
- **Functional Requirements**
  - Mencegah *double deduction* pada laba operasional rute Indocement Grobogan.
- **Non-Functional Requirements**
  - Pure function, 100% deterministik, zero side effects.
- **Test Coverage**
  - [Unit] `calculateTripProfit` dengan `hasSpecialDeductions: true` dan omset Rp 5.250.000 menghasilkan `tax1Pct: 0`, `deduction2PctLju: 105000`, `deduction5PctUjGrb: 0`, `savings: 262500`, dan laba operasional yang tidak terpotong dua kali.

**Step 1: Write failing test (RED)**
Tambahkan pengujian di `domain/calculators/__tests__/trip-profit.test.ts`:
```ts
it("aligns Indocement Grobogan formula with Option A (7% total: 2% LJU expense + 5% fleet savings, 0% tax)", () => {
  const omset = 5250000
  const sangu = 2441250
  const thirdPartyFee = 100000

  const res = calculateTripProfit({
    omset,
    sangu,
    thirdPartyFee,
    hasSpecialDeductions: true,
  })

  expect(res.tax1Pct).toBe(0)
  expect(res.deduction2PctLju).toBe(105000)
  expect(res.deduction5PctUjGrb).toBe(0)
  expect(res.savings).toBe(262500)
  // Laba operasional: 5.250.000 - 2.441.250 - 100.000 - 105.000 = 2.603.750
  expect(res.profit).toBe(5250000 - 2441250 - 100000 - 105000)
  expect(res.totalArmadaValue).toBe(res.profit + res.savings)
})
```

**Step 2: Verify test fails**
Run: `pnpm test domain/calculators/__tests__/trip-profit.test.ts`
Expected: FAIL (karena `res.savings` atau `tax1Pct` masih berlogika lama).

**Step 3: Write minimal implementation (GREEN)**
Perbarui interface dan implementasi di `domain/calculators/trip-profit.ts`:
- Tambahkan `savings: number` dan `totalArmadaValue: number` pada `TripProfitResult`.
- Saat `hasSpecialDeductions === true`, set `tax1Pct = 0`, `deduction2PctLju = Math.round(omset * 0.02 * 100) / 100`, `deduction5PctUjGrb = 0`, dan `savings = input.savings ?? Math.round(omset * 0.05 * 100) / 100`.
- Pastikan `directExpenses` operasional hanya memotong biaya riil (`tax1Pct + deduction2PctLju + deduction5PctUjGrb` di mana tax & ded5 adalah 0).

**Step 4: Verify test passes & Refactor**
Run: `pnpm test domain/calculators/__tests__/trip-profit.test.ts`
Expected: PASS dengan exit code 0.

---

### Task 2: [SELESAI] [UI/Feature] Sinkronisasi Live Calculation Form Ritase & Breakdown Card (7%)

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx:475-545` & `features/trips/trip-form-dialog.tsx:1740-1775`
- Test: `features/trips/__tests__/trip-form-calculations.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. Pada `liveCalc` di `trip-form-dialog.tsx`, saat `hasSpecialDeductions` aktif:
     - `tax1Pct` diset ke 0.
     - `deduction2PctLju` diset ke 2% omset.
     - `deduction5PctUjGrb` diset ke 0.
     - `savings` diset ke 5% omset.
  2. Input hidden / form state `savings` otomatis tersimpan dengan nilai 5% omset tersebut.
  3. Pada Baris 9: Card Kalkulasi Otomatis (Live):
     - Ubah teks label menjadi `Potongan Khusus Grobogan/LJU (7% dari Omset)` dengan badge transparan.
     - Tampilkan accordion / rincian breakdown elegan:
       - `Potongan Operasional LJU (2%)`: `Rp 105.000` (Beban Operasional).
       - `Tabungan Kas Armada (Saving 5%)`: `Rp 262.500` (Masuk Kas Tabungan Armada, warna `text-emerald-600 dark:text-emerald-400`).
       - `Total Nilai Armada`: `formatCurrency(liveCalc.profit + liveCalc.savings)`.
  4. Laba Ritase di kartu live menampilkan laba operasional bersih yang akurat.
- **Functional Requirements**
  - Memberikan visualisasi transparan kepada admin bahwa komponen 5% adalah tabungan armada, bukan beban hangus.
- **Non-Functional Requirements**
  - Desain antarmuka responsif dan konsisten dengan Tailwind v4 Emerald theme.
- **Test Coverage**
  - [Integration] `trip-form-calculations.test.ts` memverifikasi kalkulasi live form rute Indocement menghasilkan 7% (2% potongan LJU + 5% saving) tanpa pajak 1%.

**Step 1: Write failing test (RED)**
Tambahkan pengujian integrasi di `features/trips/__tests__/trip-form-calculations.test.ts`:
```ts
it("calculates Indocement Grobogan live calculation with Option A (7% total: 2% LJU, 5% fleet savings, 0% tax)", () => {
  const ratePerTon = 169354.84 // Basis 31 ton = 5.250.000
  const unloadedTonnage = 31.0
  const sangu = 2441250 // Sangu 50% dari OA Driver (93%)
  const omset = 5250000

  const profitResult = calculateTripProfit({
    omset,
    sangu,
    thirdPartyFee: 100000,
    hasSpecialDeductions: true,
  })

  expect(profitResult.tax1Pct).toBe(0)
  expect(profitResult.deduction2PctLju).toBe(105000)
  expect(profitResult.savings).toBe(262500)
  expect(profitResult.profit).toBe(5250000 - 2441250 - 100000 - 105000)
  expect(profitResult.totalArmadaValue).toBe(profitResult.profit + profitResult.savings)
})
```

**Step 2: Verify test fails**
Run: `pnpm test features/trips/__tests__/trip-form-calculations.test.ts`
Expected: FAIL jika masih ada dependensi lama.

**Step 3: Write minimal implementation (GREEN)**
Perbarui `features/trips/trip-form-dialog.tsx`:
- Sesuaikan `liveCalc` untuk menerapkan formula 7% (Pilihan A).
- Tambahkan breakdown detail visual pada Card Kalkulasi Otomatis (Live).
- Pastikan `setValue("savings", ...)` terisi otomatis saat `hasSpecialDeductions` aktif.

**Step 4: Verify test passes & Refactor**
Run: `pnpm test features/trips/__tests__/trip-form-calculations.test.ts`
Expected: PASS dengan exit code 0.

---

### Task 3: [SELESAI] [UI/Detail] Penyempurnaan Tampilan Detail Ritase (`trip-detail-sheet.tsx` & `trip-mobile-card.tsx`)

**Files:**
- Modify: `features/trips/trip-detail-sheet.tsx:640-675`
- Modify: `features/trips/trip-mobile-card.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Pada Section 4 (Rincian Potongan Khusus Pabrik) di `trip-detail-sheet.tsx`:
     - Ganti label `Tabungan Supir` menjadi `Tabungan Kas Armada (Saving 5% Indocement)` dengan badge info bahwa dana dicadangkan di PT LJU.
     - Sembunyikan baris `Pajak PPh (1%)` jika bernilai 0.
     - Tampilkan `Potongan Operasional LJU (2%)` secara jelas sebagai beban potongan pihak rekanan.
     - Tampilkan baris rekapitulasi `Total Nilai Ekonomis Ritase` (`Laba + Tabungan Kas`).
  2. Pada `trip-mobile-card.tsx`, pastikan jika ada nilai tabungan kas armada, ditampilkan badge informatif.
- **Functional Requirements**
  - Mengeliminasi kesalahpahaman label "Tabungan Supir" menjadi "Tabungan Kas Armada".
- **Non-Functional Requirements**
  - Typography rapi dan aksesibilitas ramah pembaca.

**Step 1: Write failing test (RED)**
Verifikasi snapshot atau render test di `features/trips/__tests__/trip-detail-sheet.test.ts` (jika ada) atau pastikan type-safety.

**Step 2: Write minimal implementation (GREEN)**
Perbarui teks dan badge pada `features/trips/trip-detail-sheet.tsx` dan `features/trips/trip-mobile-card.tsx`.

**Step 3: Verify test passes & Refactor**
Run: `pnpm test`
Expected: PASS dengan exit code 0.

---

### Task 4: [SELESAI] [Database/Schema] Penambahan Kolom `totalSavings` pada Tabel `profit_sharing_periods`

**Files:**
- Modify: `db/schema/profit-sharing.ts:35-50`
- Consult: `.agents/skills/database-design/SKILL.md`

**Requirements:**
- **Acceptance Criteria**
  1. Tambahkan kolom `totalSavings: numeric("total_savings", { precision: 15, scale: 2 }).default("0.00").notNull()` pada tabel `profitSharingPeriods`.
  2. Ekspor tipe `ProfitSharingPeriod` yang mencakup field `totalSavings`.
- **Functional Requirements**
  - Menyimpan akumulasi tabungan kas armada (cadangan kas) saat tutup buku periode.
- **Non-Functional Requirements**
  - Zero-downtime, expand-contract pattern: default value `0.00` memastikan data historis yang sudah ada tetap valid tanpa error nullability.

**Step 1: Write schema update**
Perbarui `db/schema/profit-sharing.ts`:
```ts
  totalSavings: numeric("total_savings", { precision: 15, scale: 2 })
    .default("0.00")
    .notNull(),
```

**Step 2: Generate migration**
Run: `pnpm db:generate`
Expected: File migrasi SQL baru tercipta di `db/migrations/` menambahkan kolom `total_savings`.

**Step 3: Apply migration & verify typecheck**
Run: `pnpm typecheck`
Expected: PASS dengan exit code 0.

---

### Task 5: [SELESAI] [Backend/Queries] Query Akumulasi `getSavingsForPeriod` pada Modul Bagi Hasil

**Files:**
- Create/Modify: `features/profit-sharing/profit-sharing.queries.ts:25-50`
- Test: `features/profit-sharing/__tests__/profit-sharing-queries.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. Fungsi `getSavingsForPeriod(startDate: string, endDate: string): Promise<number>` menghitung total `trips.savings` dalam rentang `unloadingDate`.
  2. Mengembalikan nilai `0` jika tidak ada trip dengan saving atau tidak ada trip sama sekali.
- **Functional Requirements**
  - Mengambil data tabungan riil dari transaksi surat jalan.
- **Test Coverage**
  - [Unit] `getSavingsForPeriod` mengagregasi nilai saving pada rentang tanggal yang benar.

**Step 1: Write failing test (RED)**
Tambahkan test case di `features/profit-sharing/__tests__/profit-sharing-queries.test.ts`:
```ts
it("calculates total fleet savings (5% Indocement) for the given unloading date period", async () => {
  // Test query logic
})
```

**Step 2: Write minimal implementation (GREEN)**
Implementasikan `getSavingsForPeriod` di `features/profit-sharing/profit-sharing.queries.ts`.

**Step 3: Verify test passes**
Run: `pnpm test features/profit-sharing/__tests__/profit-sharing-queries.test.ts`
Expected: PASS dengan exit code 0.

---

### Task 6: [SELESAI] [Server Actions] Integrasi `totalSavings` pada `previewPeriodCalculation` & `createProfitSharingPeriod`

**Files:**
- Modify: `features/profit-sharing/profit-sharing.actions.ts:25-130`
- Modify: `features/profit-sharing/profit-sharing.schema.ts`
- Test: `features/profit-sharing/__tests__/profit-sharing-actions.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. `previewPeriodCalculation` memanggil `getSavingsForPeriod(startDate, endDate)` dan menyertakan `totalSavings` dalam kembalian response.
  2. `createPeriodSchema` menerima `totalSavings: z.number().nonnegative().default(0)`.
  3. `createProfitSharingPeriod` menyimpan `totalSavings` ke record `profitSharingPeriods`.
- **Functional Requirements**
  - Tutup buku resmi mencatat nilai tabungan cadangan armada yang terkumpul pada periode tersebut.
- **Test Coverage**
  - [Integration] `previewPeriodCalculation` dan `createProfitSharingPeriod` memproses `totalSavings` dengan benar.

**Step 1: Write failing test (RED)**
Perbarui pengujian di `features/profit-sharing/__tests__/profit-sharing-actions.test.ts`.

**Step 2: Write minimal implementation (GREEN)**
Perbarui `features/profit-sharing/profit-sharing.actions.ts` dan schema validator-nya.

**Step 3: Verify test passes**
Run: `pnpm test features/profit-sharing/__tests__/profit-sharing-actions.test.ts`
Expected: PASS dengan exit code 0.

---

### Task 7: [SELESAI] [UI/Wizard & Sheet] Tampilan KPI Cadangan Tabungan Armada di Wizard & Detail Bagi Hasil

**Files:**
- Modify: `features/profit-sharing/period-wizard-dialog.tsx:350-450`
- Modify: `features/profit-sharing/period-detail-sheet.tsx:230-280`
- Modify: `features/profit-sharing/partner-profit-sharing-view.tsx:90-140`

**Requirements:**
- **Acceptance Criteria**
  1. Pada `period-wizard-dialog.tsx` (Step 2 Preview):
     - Tampilkan kartu ringkasan baru: `Cadangan Tabungan Armada (Saving 5% Indocement)` dengan nominal `formatCurrency(totalSavings)`.
     - Keterangan edukatif: *"Tabungan kas armada yang terkumpul di PT LJU selama periode ini dan dicadangkan terpisah dari laba operasional."*
  2. Pada `period-detail-sheet.tsx` (Section 1: Rekapitulasi Operasional):
     - Tampilkan kartu KPI `Dana Tabungan Cadangan Armada` berdampingan dengan Omset, Beban, dan Laba Kotor.
  3. Pada `partner-profit-sharing-view.tsx`:
     - Tampilkan metrik cadangan tabungan armada bagi investor untuk transparansi aset cadangan pemeliharaan truk.
- **Functional Requirements**
  - Memberikan visibilitas penuh terhadap akumulasi tabungan kas armada tanpa mencampuradukkannya ke dividen yang dibagikan.

**Step 1: Implement UI updates**
Terapkan penambahan kartu KPI di ketiga komponen antarmuka tersebut.

**Step 2: Manual / Component Verification**
Jalankan verifikasi lint dan typecheck untuk memastikan kelayakan tampilan.

---

### Task 8: [SELESAI] [Verifikasi Komprehensif] Full Regression Suite, Typecheck, Lint, & Formatting

**Files:**
- All modified files

**Verification Commands:**
```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm run format
```

**Acceptance Criteria:**
- 100% test lulus tanpa kegagalan.
- 0 lint error dan 0 type error.
- Seluruh copywriting antarmuka 100% Bahasa Indonesia baku.

---

## Rangkuman Deliverables & Next Step

Setelah dokumen perencanaan ini disahkan oleh Anda, kita dapat langsung mengeksekusi rencana di atas secara bertahap menggunakan slash command:
`/scaffold-execute`
