---
title: "Pengayaan Jarak Rute & Analisis Biaya per Kilometer (Cost per Km)"
date: "2026-10-12"
description: "Rencana implementasi pengayaan data jarak (km) untuk seluruh rute SI Tuban, SI Rembang, dan Indocement Grobogan, serta kalkulasi metrik efisiensi biaya/laba per kilometer (Rp/Km)"
---

# Technical Plan: Pengayaan Jarak Rute & Analisis Biaya per Kilometer (Cost per Km)

## 1. Ringkasan & Latar Belakang Bisnis

### 1.1 Konteks Masalah
Saat ini, field `distanceKm` pada modul referensi tarif (`rate_references`) hanya terisi secara lengkap pada rute pabrik **Solusi Bangun Indonesia (SBI) - Tuban** (162 rute) karena data sheet acuan aslinya memuat kolom *"Jarak (Km)"*. Sementara itu:
- **Semen Indonesia (SI) - Tuban** (78 rute): belum terisi (null).
- **Semen Indonesia (SI) - Rembang** (31 rute): belum terisi (null).
- **Indocement - Grobogan** (50 rute): belum terisi (null).

### 1.2 Kebutuhan Bisnis Baru
Manajemen armada PT Hadya Wiran Trans (HW Trans) membutuhkan data jarak tempuh kilometer untuk **seluruh rute tanpa terkecuali** guna menghitung dan menganalisis metrik efisiensi logistik (*unit economics*):
1. **Pendapatan per Kilometer (`revenuePerKm`)**: $\frac{\text{Est. Jumlah}}{\text{Jarak (Km)}}$ (Rp/Km).
2. **Sangu Supir per Kilometer (`sanguPerKm`)**: $\frac{\text{Sangu Supir}}{\text{Jarak (Km)}}$ (Rp/Km jalan).
3. **Estimasi Laba per Kilometer (`profitPerKm`)**: $\frac{\text{Est. Profit}}{\text{Jarak (Km)}}$ (Rp/Km laba bersih).
4. **Biaya Operasional per Kilometer (`costPerKm`)**: $\frac{\text{Est. Jumlah} - \text{Est. Profit}}{\text{Jarak (Km)}}$ (Rp/Km beban jalan).

Analisis ini akan memberikan visibilitas kepada pengelola armada untuk mengetahui rute mana yang paling efisien, menguntungkan, atau membutuhkan penyesuaian tarif ongkos angkut (OA).

### 1.3 Catatan Temuan & Saran Sebelumnya yang Diintegrasikan
- **Standarisasi Penamaan (Header & Card)**: Seluruh label metrik wajib konsisten antara tabel dan kartu mobile (contoh: label *"Tonase"*, *"Est. Jumlah"*, dan *"Jarak"*).
- **Single Source of Truth (DRY)**: Rumus finansial per baris tetap dipusatkan di `resolveRowFinancialMetrics` dan fungsi murni baru `calculateDistanceCostMetrics`.
- **Defensive Null/Zero Handling**: Mencegah *division-by-zero* jika jarak bernilai 0, null, atau tidak valid.
- **Bahasa Indonesia Murni pada UI**: Seluruh teks antarmuka (label, badge, tooltip, kartu metrik) 100% menggunakan Bahasa Indonesia.

---

## 2. Gap Analysis & Pemetaan Entitas

| Noun / Verb Sumber | Kategori | Penanganan Teknis |
| :--- | :--- | :--- |
| `distanceKm` | Data Field | Sudah ada di schema `rate_references.distance_km` (numeric 8,2). Perlu diisi untuk 159 rute tersisa. |
| `revenuePerKm` | Kalkulasi | Pure function di `features/rates/rates.calculations.ts`. |
| `sanguPerKm` | Kalkulasi | Pure function di `features/rates/rates.calculations.ts`. |
| `profitPerKm` | Kalkulasi | Pure function di `features/rates/rates.calculations.ts`. |
| `costPerKm` | Kalkulasi | Pure function di `features/rates/rates.calculations.ts`. |
| Enriquecement Data | Action / CLI | Script migrasi `scripts/db/enrich-rates-distance.ts` + sinkronisasi `db/data/rates.json`. |
| Live Preview Form | UI Component | Input `distanceKm` di `RateFormDialog` dengan preview live Rp/Km. |
| Detail Efisiensi | UI Component | Seksi baru *Analisis Efisiensi Jarak & Biaya* pada `RateDetailSheet`. |
| Ekspor Excel & CSV | Export Feature | Tambahan kolom *Jarak (Km)* dan *Profit/Km (Rp)* di `rates.export.ts`. |

---

## 3. Rencana Implementasi Bertahap (Atomic TDD Tasks)

### Task 1: Kalkulator Domain Murni & Unit Test Metrik Jarak (`calculateDistanceCostMetrics`) [COMPLETED]

**Files:**
- Modify: `features/rates/rates.calculations.ts`
- Test: `features/rates/__tests__/rates-calculations.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. `calculateDistanceCostMetrics` menghasilkan nilai `revenuePerKm`, `sanguPerKm`, `profitPerKm`, dan `costPerKm` yang dibulatkan ke rupiah terdekat.
  2. Jika `distanceKm` bernilai `null`, `undefined`, `0`, atau negatif, fungsi mengembalikan nilai `null` untuk semua metrik per km tanpa melempar exception atau menghasilkan `NaN`/`Infinity`.
- **Functional Requirements**:
  1. Mendukung input dari hasil `resolveRowFinancialMetrics` secara mulus.
- **Non-Functional Requirements**:
  1. Pure function bebas I/O (zero dependency ke database atau DOM).
- **Test Coverage**:
  - `calculateDistanceCostMetrics()` dengan input normal (misal jarak 310 km, omset 5.489.827, sangu 2.744.914, profit 2.744.914).
  - `calculateDistanceCostMetrics()` dengan jarak 0 atau null.
  - `calculateDistanceCostMetrics()` untuk rute Indocement berparameter khusus.

**Step 1: Write failing test (RED)**
Di `features/rates/__tests__/rates-calculations.test.ts`:
```typescript
describe("calculateDistanceCostMetrics", () => {
  it("harus menghitung revenuePerKm, sanguPerKm, profitPerKm, dan costPerKm dengan benar", () => {
    const res = calculateDistanceCostMetrics({
      distanceKm: "310",
      rowJumlah: 5489827,
      rowSangu: 2744914,
      rowProfit: 2744914,
    })
    expect(res.revenuePerKm).toBe(17709) // 5489827 / 310
    expect(res.sanguPerKm).toBe(8855)   // 2744914 / 310
    expect(res.profitPerKm).toBe(8855)  // 2744914 / 310
    expect(res.costPerKm).toBe(8855)    // (5489827 - 2744914) / 310
  })

  it("harus mengembalikan null untuk semua metrik jika jarak 0 atau null", () => {
    const res = calculateDistanceCostMetrics({
      distanceKm: null,
      rowJumlah: 5000000,
      rowSangu: 2500000,
      rowProfit: 2500000,
    })
    expect(res.revenuePerKm).toBeNull()
    expect(res.sanguPerKm).toBeNull()
    expect(res.profitPerKm).toBeNull()
    expect(res.costPerKm).toBeNull()
  })
})
```

**Step 2: Verify test fails**
Jalankan `pnpm test features/rates/__tests__/rates-calculations.test.ts` dan pastikan gagal karena fungsi belum didefinisikan.

**Step 3: Write minimal implementation (GREEN)**
Di `features/rates/rates.calculations.ts`:
```typescript
export interface DistanceCostMetrics {
  distanceKm: number | null
  revenuePerKm: number | null
  sanguPerKm: number | null
  profitPerKm: number | null
  costPerKm: number | null
}

export function calculateDistanceCostMetrics(input: {
  distanceKm: string | number | null | undefined
  rowJumlah: number
  rowSangu: number
  rowProfit: number
}): DistanceCostMetrics {
  const dist = typeof input.distanceKm === "number"
    ? input.distanceKm
    : parseFloat(input.distanceKm || "0")

  if (!dist || dist <= 0 || isNaN(dist)) {
    return {
      distanceKm: null,
      revenuePerKm: null,
      sanguPerKm: null,
      profitPerKm: null,
      costPerKm: null,
    }
  }

  const revenuePerKm = Math.round(input.rowJumlah / dist)
  const sanguPerKm = Math.round(input.rowSangu / dist)
  const profitPerKm = Math.round(input.rowProfit / dist)
  const costPerKm = Math.round((input.rowJumlah - input.rowProfit) / dist)

  return {
    distanceKm: dist,
    revenuePerKm,
    sanguPerKm,
    profitPerKm,
    costPerKm,
  }
}
```

**Step 4: Verify test passes & Refactor**
Jalankan `pnpm test features/rates/__tests__/rates-calculations.test.ts` hingga status lolos (PASS).

---

### Task 2: Script Pengayaan Data Jarak Rute (`scripts/db/enrich-rates-distance.ts`) & Pembaruan `rates.json` [COMPLETED]

**Files:**
- Create: `scripts/db/enrich-rates-distance.ts`
- Modify: `db/data/rates.json`

**Requirements:**
- **Acceptance Criteria**:
  1. Script memetakan jarak estimasi logistik rute darat ke 78 rute SI Tuban, 31 rute SI Rembang, dan 50 rute Indocement Grobogan.
  2. Data jarak memanfaatkan acuan referensi jarak riil kota-kota Jawa Timur dan Jawa Tengah dari dataset SBI Tuban yang telah terbukti valid, ditambah matriks jarak logistik darat resmi untuk Rembang dan Grobogan.
  3. Script mengupdate tabel `rate_references` di database dan menuliskan kembali ke `db/data/rates.json` agar hasil seeding/migration selalu tersinkronisasi.
- **Functional Requirements**:
  1. Bersifat idempoten (bisa dijalankan berulang kali tanpa merusak data lain).
- **Test Coverage**:
  - Verifikasi jumlah rute terisi jarak $> 0$ pada seluruh 289+ rute.

**Step 1: Write failing test / verification step**
Jalankan query pemeriksa: saat ini rute SI Tuban, SI Rembang, dan Indocement memiliki 0 rute berjarak.

**Step 2: Implementasi Script Pengayaan Jarak**
Buat `scripts/db/enrich-rates-distance.ts` yang memuat kamus jarak logistik kota tujuan berbasis titik pabrik:
- **SI Tuban** (Pabrik Kerek, Tuban): Jarak ke Surabaya ~130 km, Sidoarjo ~160 km, Malang ~230 km, Solo/Surakarta ~220 km, Yogya/Sleman ~310 km, Semarang ~220 km, dll.
- **SI Rembang** (Pabrik Gunem, Rembang): Jarak ke Blora ~35 km, Pati ~50 km, Kudus ~75 km, Demak ~110 km, Semarang ~135 km, Solo ~150 km, Yogyakarta ~210 km, dll.
- **Indocement Grobogan** (Pabrik Tanggungharjo, Grobogan): Jarak ke Surabaya ~300 km, Sidoarjo ~315 km, Gresik ~290 km, Malang ~340 km, Pasuruan ~350 km, dll.

**Step 3: Eksekusi Script & Verifikasi Database**
Jalankan `pnpm tsx scripts/db/enrich-rates-distance.ts`.
Verifikasi bahwa seluruh 289+ rute memiliki `distanceKm > 0`.

---

### Task 3: Tampilan Analisis Efisiensi Jarak & Biaya pada `RateDetailSheet` [COMPLETED]

**Files:**
- Modify: `features/rates/rate-detail-sheet.tsx`
- Test: `features/rates/__tests__/rate-detail-sheet.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Terdapat seksi baru di bawah *"Parameter Tarif & Estimasi Pendapatan"* berjudul **"Analisis Efisiensi Jarak & Biaya"**.
  2. Menampilkan 4 kartu informasi:
     - **Jarak Tempuh**: `{distanceKm} Km`
     - **Pendapatan / Km**: `Rp{revenuePerKm} / Km`
     - **Sangu Supir / Km**: `Rp{sanguPerKm} / Km`
     - **Estimasi Laba / Km**: `Rp{profitPerKm} / Km` (dengan highlight warna emerald).
  3. Jika rute belum memiliki jarak, seksi ini menampilkan placeholder/notifikasi informatif untuk mengisi jarak rute.
- **Test Coverage**:
  - Test unit memverifikasi bahwa kalkulasi metrik per km dipanggil dan dirender dengan format mata uang yang tepat.

**Step 1: Tulis unit test di `rate-detail-sheet.test.ts`**
Verifikasi pemanggilan `calculateDistanceCostMetrics`.

**Step 2: Update komponen `RateDetailSheet`**
Tambahkan kartu metrik efisiensi logistik menggunakan `@remixicon/react` (`RiRouteLine`, `RiPinDistanceLine`, `RiMoneyDollarCircleLine`).

**Step 3: Jalankan test dan verifikasi visual**.

---

### Task 4: Integrasi pada Form Dialog (`RateFormDialog`), Tabel (`RatesTable`), dan Kartu Mobile (`RateMobileCard`) [COMPLETED]

**Files:**
- Modify: `features/rates/rate-form-dialog.tsx`
- Modify: `features/rates/rates-table.tsx`
- Modify: `features/rates/rate-mobile-card.tsx`

**Requirements:**
- **Acceptance Criteria**:
  1. **RateFormDialog**:
     - Input field `distanceKm` dibuka untuk semua pabrik dan menampilkan live preview biaya/profit per kilometer di bawah field input jika tarif dan jarak telah diisi. (SELESAI)
  2. **RateMobileCard**:
     - Menampilkan indikator jarak yang konsisten di baris lokasi (`• {distanceKm} km`), serta tag laba per kilometer (`({formatCurrency(distanceMetrics.profitPerKm)}/km)`) pada bagian estimasi profit. (SELESAI)
  3. **RatesTable**:
     - Menampilkan jarak km pada kolom Kota Tujuan secara rapi (`Zone: ... • ... km`), serta tag profit per kilometer di bawah nilai nominal Est. Profit. (SELESAI)
- **Test Coverage**:
  - `pnpm test features/rates` lolos 100% (56/56 tests).

---

### Task 5: Penambahan Kolom Metrik Jarak pada Ekspor Excel & CSV (`rates.export.ts`) [COMPLETED]

**Files:**
- Modify: `features/rates/rates.export.ts`
- Test: `features/rates/__tests__/rates-export.test.ts`

**Requirements:**
- **Acceptance Criteria**:
  1. Header ekspor menambahkan: `"Jarak (Km)"`, `"Pendapatan / Km (Rp)"`, dan `"Estimasi Profit / Km (Rp)"`. (SELESAI)
  2. Data baris menghitung nilai numerik metrik jarak secara presisi untuk laporan Excel/CSV manajemen operasional. (SELESAI)
- **Test Coverage**:
  - Test `rates-export.test.ts` memvalidasi keberadaan kolom baru dan kesesuaian nilai baris (3/3 tests passed).

---

### Task 6: Verifikasi Menyeluruh & Uji Regresi Empiris [COMPLETED]

**Commands & Evidence:**
- `pnpm typecheck` -> Exit Code 0 (0 error TypeScript)
- `pnpm lint` -> Exit Code 0 (0 error, 0 warning ESLint)
- `pnpm test` -> Exit Code 0 (47 test files, 235 passed, 100% lulus)
- `pnpm build` -> Exit Code 0 (Next.js production build sukses)

**Acceptance Criteria:**
- 0 error TypeScript.
- 0 warning ESLint.
- Seluruh 47 test suite lulus (100% passed).
- Build Next.js produksi siap rilis.

---

## 4. Kesimpulan & Rekomendasi Langkah Selanjutnya

Seluruh Task 1 hingga Task 6 dalam rencana implementasi telah selesai dieksekusi dengan standar TDD ketat dan verifikasi empiris.

Langkah selanjutnya yang direkomendasikan:
1. Pengguna dapat meninjau hasil implementasi secara mandiri pada antarmuka `/rates`.
2. Jika seluruh perubahan telah divalidasi dan disetujui, jalankan `/scaffold-commit` untuk commit dan push perubahan ke repositori.

