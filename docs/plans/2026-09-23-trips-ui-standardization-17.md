# Rencana Implementasi: Standarisasi Desain Antarmuka Menu Manajemen Ritase

**Dokumen Rencana:** `docs/plans/2026-09-23-trips-ui-standardization-17.md`  
**Fitur / Scope:** Penyelarasan Desain Menu Manajemen Ritase (`/trips`) mengacu pada Standar Referensi Tarif (`/rates`): Header Halaman, KPI Summary Cards, Search Bar Instan, Kapsul Filter Terpadu, Empty State Komponen `@/components/ui/empty`, Paginasi Mandiri, dan Mobile Cards  
**Tanggal:** 23 September 2026  
**Referensi Desain:** `docs/specs/2026-09-23-trips-ui-standardization-design.md`  
**Status:** Selesai & Terverifikasi (Completed & Verified)  

---

## 1. Konteks & Ringkasan Perubahan

Berdasarkan dokumen spesifikasi desain `docs/specs/2026-09-23-trips-ui-standardization-design.md`, implementasi ini merombak antarmuka pengguna pada modul Manajemen Ritase (`/trips`) agar memenuhi tolok ukur estetika, ergonomi, dan fungsionalitas yang telah diterapkan pada modul Referensi Tarif (`/rates`).

Perubahan utama meliputi:
1. **Header Halaman:** Menambahkan ikon container tema truk (`RiTruckLine` dalam `bg-primary/10`), badge jumlah surat jalan dinamis, menghapus teks tanggal statis ("Juni 2026"), serta menempatkan tombol Ekspor Data berdampingan dengan tombol Tambah Ritase di kanan atas.
2. **KPI Summary Cards (`TripsSummary`):** Mengganti kontainer `<Card>` dasar menjadi kartu metrik modern `rounded-2xl` dengan ring ikon tematik, angka besar tabular, badge pill metrik, dan footer bergaris pemisah tipis.
3. **Pelepasan Card Pembungkus & Search Bar Instan:** Menghilangkan kontainer `<Card>` raksasa yang membungkus tabel dan menggantinya dengan layout terbuka, dilengkapi *Search Bar* instan di sisi kiri untuk mencari nomor order, kota tujuan, proyek, armada/supir, dan fee DO.
4. **Kapsul Filter Terpadu:** Menyatukan filter Armada, Bulan, Tahun, Status Fee DO, opsi pilihan jumlah baris (*Page Size*: 10, 25, 50 baris), dan tombol Reset ke dalam satu kapsul ramping `bg-muted/40 rounded-xl`.
5. **Empty State Standar:** Mengintegrasikan komponen `@/components/ui/empty` untuk kartu mobile dan tabel desktop (`colSpan={10}`) dengan pembedaan kondisi filter nihil vs database kosong.
6. **Paginasi Mandiri:** Footer paginasi diletakkan di luar tabel dalam kontainer mandiri `rounded-xl border bg-card p-3 shadow-xs`.
7. **Penyelarasan Kartu Mobile & Copywriting:** Merapikan `TripMobileCard` dan memastikan seluruh UI copywriting menggunakan Bahasa Indonesia murni (misal: "Ekspor Data" bukan "Export Data").

---

## 2. Kriteria Penerimaan & Gap Analysis

### Acceptance Criteria (AC):
1. **AC-1:** Header `app/(dashboard)/trips/page.tsx` memiliki ikon tema truk `RiTruckLine` (`bg-primary/10 text-primary`), badge counter jumlah dinamis, subjudul yang informatif, serta tombol Ekspor (`TripsExportButton`) berdampingan dengan tombol Tambah Ritase. Teks tanggal statis terhapus.
2. **AC-2:** Kartu `TripsSummary` memiliki styling `rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xs hover:shadow-md` dengan ring ikon tematik, angka besar tabular, badge pill persentase/status, dan footer garis tipis.
3. **AC-3:** Tabel ritase tidak lagi terbungkus `<Card>` kaku, melainkan menggunakan layout terbuka dengan section heading "Daftar Surat Jalan & Ritase".
4. **AC-4:** Search bar instan di sisi kiri toolbar menyaring data secara real-time berdasarkan nomor order, kota tujuan, tujuan bongkar/proyek, armada/supir, dan pihak ketiga DO.
5. **AC-5:** Seluruh filter (Armada, Bulan, Tahun, Status DO, Page Size 10/25/50) bersatu dalam satu kontainer kapsul ramping dengan tombol Reset yang responsif.
6. **AC-6:** Komponen `@/components/ui/empty` terpasang di mobile cards dan desktop table, dengan pembedaan pesan dan tombol aksi antara filter nihil vs database kosong.
7. **AC-7:** Paginasi berada di kontainer terpisah di bawah tabel dengan navigasi "Sebelumnya", "Selanjutnya", dan penunjuk halaman aktif.
8. **AC-8:** `TripMobileCard` selaras dengan `RateMobileCard` dan `TripsExportButton` menggunakan copywriting Bahasa Indonesia murni.
9. **AC-9:** Seluruh test suite (39+ files) berstatus PASSED, `pnpm typecheck` bersih tanpa error, dan kode mematuhi konvensi clean code.

---

## 3. Rincian Tugas Atomik (Berdasar TDD)

### Task 1: Logika Pemfilteran & Pencarian Teks Instan (`trips.filter.ts`)
**Files:**
- Create: `features/trips/trips.filter.ts`
- Test: `features/trips/__tests__/trips-filter.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. Fungsi `filterTrips(trips, options)` mampu menyaring array ritase berdasarkan kata kunci pencarian teks (`search`), armada (`truckId`), bulan (`month`), tahun (`year`), dan status DO (`feeFilter`).
  2. Pencarian teks bersifat *case-insensitive* dan memeriksa: `orderNumber`, `destinationCity`, `destinationName`, `truckId`, supir ("Triyono" untuk W8187UA, "Khoirul" untuk H8133OF), dan `thirdPartyName`.
  3. Filter fee DO mendukung: `"ALL"`, `"PENDING"` (memiliki fee DO dan belum lunas), dan `"PAID"` (memiliki fee DO dan sudah lunas).
- **Functional Requirements:**
  - Fungsi murni (*pure function*) tanpa side-effect, deterministik, dan dapat diuji secara mandiri tanpa mock database.
- **Non-Functional Requirements:**
  - Eksekusi instan (< 5ms untuk 1.000 records).
- **Test Coverage:**
  - [Unit] `filterTrips` dengan query nomor surat jalan
  - [Unit] `filterTrips` dengan query kota dan nama proyek
  - [Unit] `filterTrips` dengan kombinasi armada, bulan, tahun, dan status fee DO
  - [Unit] `filterTrips` dengan query kosong dan filter reset

**Step 1: Write failing test (RED)**
Buat file `features/trips/__tests__/trips-filter.test.ts`:
```typescript
import { describe, expect, it } from "vitest"
import type { Trip } from "@/db/schema"
import { filterTrips, type TripFilterOptions } from "../trips.filter"

describe("trips.filter", () => {
  const sampleTrips: Trip[] = [
    {
      id: "t1",
      truckId: "W8187UA",
      orderNumber: 105,
      orderDate: "2025-06-10",
      unloadingDate: "2025-06-11",
      rateReferenceId: null,
      destinationCity: "REMBANG",
      destinationName: "ARIES PUTRA BETON",
      ratePerTon: "95000.00",
      loadedTonnage: "31.50",
      unloadedTonnage: "31.20",
      omset: "2964000.00",
      sangu: "1532000.00",
      incentiveRate: "35000.00",
      incentivePaid: "35000.00",
      incentiveStatus: "Lunas",
      thirdPartyFee: "50000.00",
      thirdPartyName: "Mas Mawan",
      thirdPartyStatus: "Lunas",
      tax1Pct: "0.00",
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      profit: "1347000.00",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "t2",
      truckId: "H8133OF",
      orderNumber: 106,
      orderDate: "2025-07-01",
      unloadingDate: "2025-07-02",
      rateReferenceId: null,
      destinationCity: "SEMARANG",
      destinationName: "PT JAYA BETON",
      ratePerTon: "80000.00",
      loadedTonnage: "30.00",
      unloadedTonnage: "30.00",
      omset: "2400000.00",
      sangu: "1200000.00",
      incentiveRate: "35000.00",
      incentivePaid: "0.00",
      incentiveStatus: null,
      thirdPartyFee: "75000.00",
      thirdPartyName: "Mbah Man",
      thirdPartyStatus: "Belum Dibayar",
      tax1Pct: "0.00",
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      profit: "1125000.00",
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  it("filters trips by search term across orderNumber, city, destination, and driver", () => {
    expect(filterTrips(sampleTrips, { search: "105" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { search: "rembang" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { search: "jaya beton" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { search: "triyono" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { search: "mbah man" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { search: "surabaya" })).toHaveLength(0)
  })

  it("filters trips by truckId, month, year, and DO fee status", () => {
    expect(filterTrips(sampleTrips, { truckId: "W8187UA" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { month: "6" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { year: "2025" })).toHaveLength(2)
    expect(filterTrips(sampleTrips, { feeFilter: "PENDING" })).toHaveLength(1)
    expect(filterTrips(sampleTrips, { feeFilter: "PAID" })).toHaveLength(1)
  })
})
```

**Step 2: Verify test fails**
Jalankan: `pnpm test features/trips/__tests__/trips-filter.test.ts`  
Ekspektasi: FAIL (module `../trips.filter` belum ada).

**Step 3: Write minimal implementation (GREEN)**
Buat file `features/trips/trips.filter.ts` dengan implementasi murni penyaringan.

**Step 4: Verify test passes & Refactor**
Jalankan: `pnpm test features/trips/__tests__/trips-filter.test.ts`  
Ekspektasi: PASS (2 tests pass).

---

### Task 2: Modernisasi Kartu Ringkasan Metrik (`TripsSummary`)
**Files:**
- Modify: `features/trips/trips-summary.tsx`
- Modify / Create: `features/trips/__tests__/trips-summary.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. Kontainer kartu menggunakan `rounded-2xl border border-border/80 bg-card/75 p-4.5 shadow-xs backdrop-blur-xs transition-all duration-200 hover:shadow-md sm:p-5`.
  2. Ikon metrik berada di wadah `ring-1 ring-.../25 bg-.../10` di sebelah kiri atas, dan badge pill di kanan atas.
  3. Angka besar tabular dengan pemisah ribuan standar Indonesia.
  4. Footer kartu memiliki garis pemisah tipis `border-t border-border/50 pt-3` dengan teks status dan subdeskripsi.
- **Functional Requirements:**
  - Menghitung margin laba dan rasio sangu supir secara akurat.
- **Non-Functional Requirements:**
  - Mendukung mode gelap dan terang tanpa kontras pecah.
- **Test Coverage:**
  - [Unit] Verifikasi format metrik dan perhitungan rasio di `trips-summary.test.ts`.

**Step 1: Write failing test (RED)**
Perbarui pengujian di `features/trips/__tests__/trips-summary.test.ts` untuk memastikan fungsi kalkulasi ringkasan metrik bekerja dengan tepat.

**Step 2: Verify test fails**
Jalankan: `pnpm test features/trips/__tests__/trips-summary.test.ts`  
Ekspektasi: FAIL / PASS sesuai assert awal.

**Step 3: Write minimal implementation (GREEN)**
Perbarui `features/trips/trips-summary.tsx` dengan struktur visual `rounded-2xl` 3 tingkat yang identik dengan `RatesSummary`.

**Step 4: Verify test passes & Refactor**
Jalankan: `pnpm test features/trips/__tests__/trips-summary.test.ts`  
Ekspektasi: PASS.

---

### Task 3: Perombakan `TripsTable` (Toolbar Terpadu, Search Bar, Empty State, & Paginasi)
**Files:**
- Modify: `features/trips/trips-table.tsx`
- Reference: `@/components/ui/empty` (`Empty`, `EmptyMedia`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription`, `EmptyContent`)

**Requirements:**
- **Acceptance Criteria:**
  1. Pembungkus `<Card>` utama dihapus, diganti section terbuka berjarak `space-y-4` dengan judul section "Daftar Surat Jalan & Ritase".
  2. Sisi kiri memuat Search Bar instan dengan ikon `RiSearchLine`.
  3. Sisi kanan memuat Kapsul Filter terpadu (`bg-muted/40 rounded-xl border border-border/80 p-1`) berisi filter Armada, Bulan, Tahun, Status DO, Page Size (10, 25, 50 baris), dan tombol Reset.
  4. Komponen `@/components/ui/empty` menangani kondisi saat data kosong di Mobile dan Desktop:
     - Jika difilter: Ikon `RiSearchLine`, judul "Tidak Ada Ritase yang Cocok", dan tombol "Reset Filter".
     - Jika kosong: Ikon `RiTruckLine`, judul "Belum Ada Surat Jalan", dan tombol "Tambah Ritase Baru".
  5. Paginasi mandiri di bawah tabel menampilkan informasi rentang dan tombol navigasi halaman.
- **Functional Requirements:**
  - Pencarian dan filter berjalan instan via `useMemo` menggunakan fungsi `filterTrips`.
- **Non-Functional Requirements:**
  - Responsif di mobile (<768px kartu) dan desktop (>=768px tabel 10 kolom).

**Step 1: Write failing test (RED)**
Tambahkan pengujian di `features/trips/__tests__/trips-filter.test.ts` untuk memastikan pemotongan halaman (*pagination slice*) menghasilkan rentang yang benar.

**Step 2: Verify test fails**
Jalankan: `pnpm test features/trips/__tests__/trips-filter.test.ts`  
Ekspektasi: FAIL.

**Step 3: Write minimal implementation (GREEN)**
Perbarui `features/trips/trips-table.tsx` dengan arsitektur toolbar terpadu, search bar, empty state `@/components/ui/empty`, dan paginasi mandiri.

**Step 4: Verify test passes & Refactor**
Jalankan: `pnpm test features/trips/__tests__/trips-filter.test.ts`  
Ekspektasi: PASS.

---

### Task 4: Penyelarasan Kartu Mobile (`TripMobileCard`) & Copywriting `TripsExportButton`
**Files:**
- Modify: `features/trips/trip-mobile-card.tsx`
- Modify: `features/trips/trips-export-button.tsx`
- Test: `features/trips/__tests__/trip-mobile-card.test.ts`

**Requirements:**
- **Acceptance Criteria:**
  1. `TripMobileCard` memiliki proporsi visual harmonis dengan `RateMobileCard`: badge plat armada dengan warna khas, baris tujuan berikon lokasi, grid finansial 2x2 rapi, highlight estimasi laba, dan tombol fee status interaktif.
  2. `TripsExportButton` menggunakan copywriting 100% Bahasa Indonesia: "Ekspor Data", "Unduh Excel (.xlsx)", "Unduh CSV (.csv)".
- **Functional Requirements:**
  - Klik tombol status fee tetap memicu dialog `TripFeeStatusDialog`.
- **Non-Functional Requirements:**
  - Sesuai dengan aturan wajib `user_global` (UI Copywriting Bahasa Indonesia murni).

**Step 1: Write failing test (RED)**
Tambahkan pengujian validasi status fee dan plat nomor di `features/trips/__tests__/trip-mobile-card.test.ts`.

**Step 2: Verify test fails**
Jalankan: `pnpm test features/trips/__tests__/trip-mobile-card.test.ts`  
Ekspektasi: FAIL jika ada perubahan format baru.

**Step 3: Write minimal implementation (GREEN)**
Perbarui `TripMobileCard` dan `TripsExportButton`.

**Step 4: Verify test passes & Refactor**
Jalankan: `pnpm test features/trips/__tests__/trip-mobile-card.test.ts`  
Ekspektasi: PASS.

---

### Task 5: Perakitan Halaman `TripsPage` & Verifikasi Sistem Menyeluruh
**Files:**
- Modify: `app/(dashboard)/trips/page.tsx`

**Requirements:**
- **Acceptance Criteria:**
  1. Header halaman memuat icon container `RiTruckLine` di samping judul `h1` "Pencatatan Ritase".
  2. Badge counter menampilkan `{tripsData.length} Surat Jalan`.
  3. Teks tanggal statis terhapus.
  4. `TripsExportButton` diletakkan di header kanan berdampingan dengan `TripFormDialog`.
  5. Layout container rapi dengan `space-y-6 px-4 lg:px-6`.
- **Functional Requirements:**
  - Halaman memuat data ritase, data referensi tarif, dan summary secara paralel via `Promise.all`.
- **Non-Functional Requirements:**
  - `pnpm test` (39+ files, seluruh tests) lulus 100%.
  - `pnpm typecheck` dan `pnpm lint` bersih.

**Step 1: Write verification check (RED)**
Jalankan `pnpm typecheck` dan periksa kesesuaian prop `TripsPage`.

**Step 2: Minimal implementation (GREEN)**
Perbarui `app/(dashboard)/trips/page.tsx`.

**Step 3: Final System Verification**
Jalankan perintah verifikasi menyeluruh:
```bash
pnpm test
pnpm typecheck
pnpm lint
```
Ekspektasi: Seluruh test pass, 0 error typecheck, 0 lint warning.

---

## 4. Rangkuman & Rekomendasi Eksekusi
Rencana kerja ini telah didekomposisi menjadi 5 tugas teknis atomik yang saling independen dan mematuhi siklus TDD. Setelah rencana ini disetujui, eksekusi dapat dimulai secara terkontrol melalui perintah `/scaffold-execute`.
