---
title: "Penyempurnaan Kalkulasi Otomatis Pencatatan Ritase (Tonase, Insentif, UM, DO Indocement, & Klaim Susut)"
date: "2026-10-13"
description: "Rencana implementasi otomasi tonase muatan, kalkulasi insentif lebih tonase bertingkat (threshold 0.85), input uang makan supir (UM), penyesuaian biaya DO Indocement (Mas Wawan 100k + 5%/modal sendiri), dan kalkulasi otomatis klaim susut muatan minus toleransi 0.3% (50:50)"
---

# Technical Plan: Penyempurnaan Kalkulasi Otomatis Pencatatan Ritase

## 1. Ringkasan & Kebutuhan Bisnis

### 1.1 Konteks Masalah
Pada menu Pencatatan Ritase (`/trips`), beberapa nilai transaksi operasional masih harus diinput manual atau memerlukan penyesuaian logika bisnis logistik semen curah riil:
1. **Tonase Muatan Awal (`loadedTonnage`)**: Belum terisi otomatis saat user memilih rute acuan, padahal master data rute telah memiliki atribut `standardTonnage` (biasanya 31 ton).
2. **Kelebihan Tonase & Insentif Supir (`incentivePaid`)**: Belum terhitung otomatis berdasarkan selisih tonase riil bongkar terhadap muat, serta belum menerapkan aturan batas ambang desimal kelipatan 1 ton (threshold $0.85$ ton).
3. **Uang Makan Supir Menginap (`mealAllowance`)**: Sudah tersedia di skema database namun belum memiliki kontrol antarmuka input dan preset default (Rp 50.000/hari) pada form dialog.
4. **Biaya DO / Pihak Ketiga Indocement Grobogan (`thirdPartyFee`)**: Sebelumnya opsi DO Indocement terpisah antara Mas Wawan (Rp 100.000) atau 5% Omset. Aturan riil operasional menetapkan fee Mas Wawan Rp 100.000 **tetap selalu dibayar**, ditambah pilihan talangan 5% atau modal sendiri.
5. **Klaim Susut Muatan Minus (`claim` & `claimDriver`)**: Belum ada otomasi perhitungan batas toleransi susut semen ($0.3\%$ dari muatan awal) dan pembagian klaim kelebihan susut secara adil ($50\%$ kantor dan $50\%$ supir) berdasarkan Tarif OA/Ton.

### 1.2 Persyaratan Bisnis & Rumus Terkonfirmasi
1. **Otomasi Tonase Muatan**:
   - Memilih rute pabrik $\rightarrow$ otomatis mengisi `loadedTonnage` dengan `standardTonnage` rute acuan (default $31.00$ ton). Tetap bisa diedit manual.
2. **Insentif Lebih Tonase Bertingkat**:
   - $\Delta T = \text{Tonase Bongkar} - \text{Tonase Muatan}$.
   - Jika $\Delta T \le 0.85$ ton $\rightarrow$ kelebihan dihitung $0$ ton (belum dibayarkan).
   - Jika $\Delta T > 0.85$ ton $\rightarrow$ kelebihan bertingkat dihitung: $\text{Ton Kelebihan} = \text{Math.ceil}(\Delta T - 0.85)$.
     - $0.86 - 1.85$ ton $\rightarrow 1$ ton.
     - $1.86 - 2.85$ ton $\rightarrow 2$ ton.
     - $2.86 - 3.85$ ton $\rightarrow 3$ ton, dst.
   - $\text{Insentif Dibayarkan} = \text{Ton Kelebihan} \times \text{Tarif Lebih Tonase}$.
3. **Uang Makan Supir (UM)**:
   - Field `mealAllowance` dapat diinput manual dengan opsi cepat: Menginap (Rp 50.000/hari), +1 Hari, atau Tidak Menginap (Rp 0).
4. **Biaya Pihak Ketiga Indocement Grobogan**:
   - Komponen dasar Mas Wawan (Rp 100.000) selalu dibayar, dengan opsi:
     - *Mas Wawan + Biaya 5%*: $\text{Rp 100.000} + (5\% \times \text{Omset})$.
     - *Mas Wawan + Modal Sendiri*: $\text{Rp 100.000} + \text{Rp 0} = \text{Rp 100.000}$.
     - Tetap mendukung input manual jika ada penyesuaian khusus.
5. **Klaim Susut Muatan (Kondisi Minus)**:
   - Jika $\Delta T < 0$ (bongkar susut):
     - $\text{Susut Riil} = |\Delta T|$.
     - $\text{Toleransi Susut (0,3%)} = \text{Tonase Muatan} \times 0.003$.
     - Jika $\text{Susut Riil} \le \text{Toleransi Susut} \rightarrow$ Klaim $= 0$ (dalam batas wajar).
     - Jika $\text{Susut Riil} > \text{Toleransi Susut}$:
       - $\text{Susut Diklaim (Ton)} = \text{Susut Riil} - \text{Toleransi Susut}$.
       - $\text{Total Klaim (Rp)} = \text{Susut Diklaim} \times \text{Tarif OA / Ton}$.
       - $\text{Klaim Kantor (claim)} = 50\% \times \text{Total Klaim}$.
       - $\text{Klaim Supir (claimDriver)} = 50\% \times \text{Total Klaim}$.
   - Jika $\Delta T > 0$ (muatan plus): Tidak ada klaim ganti rugi, hanya tercatat statusnya.

---

## 2. Gap Analysis & Pemetaan Entitas

| Noun / Verb Kebutuhan | Kategori | Penanganan Teknis |
| :--- | :--- | :--- |
| `loadedTonnage` auto-fill | Form Event | Handler `handleRouteSelect` di `trip-form-dialog.tsx` mengisi nilai dari `rateRef.standardTonnage`. |
| `calculateTripIncentive` | Domain Logic | Fungsi murni baru di `domain/calculators/trip-incentive.ts` untuk kalkulasi bertingkat threshold 0.85. |
| `calculateTripClaim` | Domain Logic | Fungsi murni baru di `domain/calculators/trip-claim.ts` untuk batas toleransi 0.3% dan alokasi 50:50. |
| `mealAllowance` UI input | Form UI Component | Tambahan field input Uang Makan (UM) dengan preset Menginap Rp 50.000 di `trip-form-dialog.tsx`. |
| DO Indocement preset | Form Logic & UI | Update tombol cepat DO Indocement: Rp 100.000 + 5% omset atau Rp 100.000 modal sendiri. |
| Klaim live preview & sync | Form Reactive Calc | Hook `liveCalc` di `trip-form-dialog.tsx` menampilkan breakdown toleransi dan otomatis mengisi `claim` & `claimDriver`. |
| Detail Ritase Breakdown | UI Presentation | `trip-detail-sheet.tsx` menampilkan rincian UM, insentif lebih tonase, dan analisis klaim susut muatan. |

---

## 3. Rencana Implementasi Bertahap (Atomic TDD Tasks)

### Task 1: Domain Calculator Kelebihan Tonase & Insentif (`calculateTripIncentive`) [COMPLETED]

**Files:**
- Create: `domain/calculators/trip-incentive.ts`
- Modify: `domain/calculators/index.ts`
- Test: `domain/calculators/__tests__/trip-incentive.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Jika selisih bongkar - muat $\le 0.85$ ton, menghasilkan `excessTonnage = 0` dan `incentivePaid = 0`.
  2. Jika selisih $0.86$ s.d. $1.85$ ton, menghasilkan `excessTonnage = 1`.
  3. Jika selisih $1.86$ s.d. $2.85$ ton, menghasilkan `excessTonnage = 2`.
  4. `incentivePaid` adalah hasil kali `excessTonnage` dengan `additionalTonnageRate` yang dibulatkan ke rupiah terdekat.
- **Status**: SELESAI (Test passed 5/5).

---

### Task 2: Domain Calculator Toleransi Susut & Klaim Muatan Minus (`calculateTripClaim`) [COMPLETED]

**Files:**
- Create: `domain/calculators/trip-claim.ts`
- Modify: `domain/calculators/index.ts`
- Test: `domain/calculators/__tests__/trip-claim.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Jika tonase bongkar $\ge$ tonase muat (kondisi pas atau plus), menghasilkan `isMinus = false` dan klaim Rp 0.
  2. Batas toleransi susut dihitung $0.3\%$ dari tonase muat awal ($T_{\text{muat}} \times 0.003$).
  3. Jika susut aktual $\le$ toleransi susut, tidak ada klaim yang ditagihkan (`claimableTonnage = 0`, `totalClaimAmount = 0`).
  4. Jika susut aktual $>$ toleransi susut, selisih melebihi toleransi dikalikan dengan Tarif OA/Ton dan dibagi rata $50\%$ perusahaan (`companyClaim`) dan $50\%$ supir (`driverClaim`).
- **Status**: SELESAI (Test passed 5/5).

---

### Task 3: Integrasi Otomasi Tonase Muat & Insentif Lebih Tonase pada `TripFormDialog` [COMPLETED]

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Test: `features/trips/__tests__/trip-form-calculations.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Saat memilih rute di combobox, `loadedTonnage` terisi otomatis dari `rateRef.standardTonnage` rute tersebut.
  2. Input field `loadedTonnage` tetap dapat diubah manual oleh pengguna kapan saja.
  3. Saat `unloadedTonnage` diisi, sistem menghitung kelebihan tonase menggunakan `calculateTripIncentive` dan mengupdate field `incentivePaid`.
  4. Di dekat input insentif ditampilkan hint/badge informatif kelebihan tonase (contoh: `+2 Ton (+Rp 100.000)`).
  5. Pengguna tetap dapat mengedit manual angka pada `incentivePaid`.
- **Status**: SELESAI.

---

### Task 4: Penambahan Input Uang Makan Supir (UM) pada `TripFormDialog` [COMPLETED]

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Modify: `features/trips/trips.schema.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Terdapat field input baru "Uang Makan Supir (UM)" pada form pencatatan ritase.
  2. Menyediakan tombol pintas: `Menginap (Rp 50.000)`, `+1 Hari`, dan `Reset (Rp 0)`.
  3. Nilai uang makan tersambung secara reaktif ke perhitungan laba ritase (`calculateTripProfit`) dan tersimpan ke kolom `mealAllowance`.
  4. Field editable bebas bagi admin untuk menginput nominal berapa pun.
- **Status**: SELESAI.

---

### Task 5: Penyesuaian Biaya Pihak Ketiga / DO Indocement Grobogan [COMPLETED]

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Test: `features/trips/__tests__/trip-form-calculations.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Pada rute Indocement Grobogan, biaya Mas Wawan Rp 100.000 tetap menjadi komponen dasar.
  2. Dua opsi tombol cepat utama:
     - **Mas Wawan + Talangan 5%**: Nilai = $\text{Rp 100.000} + (5\% \times \text{Omset})$. Nama pihak ketiga: `SILOG - Mas Wawan + Talangan 5%`.
     - **Mas Wawan (Modal Sendiri)**: Nilai = $\text{Rp 100.000}$. Nama pihak ketiga: `SILOG - Mas Wawan (Modal Sendiri)`.
  3. Admin tetap dapat mengubah nominal maupun nama pihak ketiga secara manual.
- **Status**: SELESAI.

---

### Task 6: Integrasi Klaim Susut Muatan Minus (Toleransi 0.3% & 50:50) [COMPLETED]

**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Modify: `features/trips/trip-detail-sheet.tsx`
- Test: `features/trips/__tests__/trip-form-calculations.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Jika tonase bongkar minus terhadap tonase muat, sistem secara reaktif mengevaluasi toleransi 0.3%.
  2. Jika susut melebihi 0.3%, sistem menampilkan kalkulasi klaim dan mengisi field `claim` (50%) dan `claimDriver` (50%).
  3. Jika susut masih dalam toleransi 0.3%, badge menampilkan `Susut Wajar (≤ 0.3%)` tanpa klaim.
  4. Jika muatan plus (+), badge menampilkan `+X.XXT (Muatan Bertambah)`.
  5. Lembar rincian `TripDetailSheet` menampilkan uraian lengkap: muatan muat, muatan bongkar, toleransi susut 0.3%, serta porsi klaim kantor dan supir.
- **Status**: SELESAI.

---

### Task 7: Verifikasi Menyeluruh & Uji Regresi Empiris [COMPLETED]

**Commands:**
- `pnpm test` $\rightarrow$ 49 test files passed, 250 tests passed (100%).
- `pnpm typecheck` $\rightarrow$ 0 error TypeScript.
- `pnpm lint` $\rightarrow$ 0 warning / error ESLint.
- `pnpm run build` $\rightarrow$ Build Turbopack sukses (8/8 static routes).

**Status**: SELESAI & TERVERIFIKASI PENUH.

---

## 4. Status Akhir Implementasi
Seluruh kebutuhan bisnis dan spesifikasi teknis telah selesai diimplementasikan dan lolos uji verifikasi menyeluruh. Tidak ada perubahan yang melanggar standar arsitektur atau mengganggu rumus ritase sebelumnya.
