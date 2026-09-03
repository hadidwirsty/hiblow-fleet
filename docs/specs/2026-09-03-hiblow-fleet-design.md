# HI-Blow Fleet & Finance Management App — Technical Design Document

**Tanggal:** 2026-09-03  
**Target Proyek:** `hiblow-fleet`  
**Status:** Approved by Business Owner (Mas Hafidz & Hadid)  
**Dokumen Terkait:**  
- [01-scope-dan-non-goals.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/01-scope-dan-non-goals.md)
- [02-feature-list-prioritas.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/02-feature-list-prioritas.md)
- [03-pertanyaan-validasi-data.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/03-pertanyaan-validasi-data.md)
- [hiblow-project-summary.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/hiblow-project-summary.md)
- [project-context.md](file:///Users/hadidwirsty/Project/hiblow-fleet/.agents/rules/project-context.md)

---

## 1. Ringkasan Eksekutif

Aplikasi **`hiblow-fleet`** adalah sistem manajemen armada dan keuangan terpadu berbasis web yang dibangun untuk menggantikan sistem pencatatan manual spreadsheet Excel (`PERHITUNGAN HIBLOW HW Trans.xlsx`) pada operasional 2 unit truk tronton tangki semen curah (*HI-Blow Truck*) HW Trans: **W 8187 UA** dan **H 8133 OF**.

Aplikasi ini mengotomatiskan seluruh alur pencatatan surat jalan/order (*trips*), biaya operasional bengkel/lapangan (*expenses*), auto-fill tarif rute dan sangu supir acuan, penarikan data tutup buku akhir bulan berbasis tanggal bongkar, pembagian hasil laba investor periodik, serta penyediaan lembar laporan siap cetak/PDF.

---

## 2. Tujuan & Kriteria Sukses (Versi 1)

### 2.1 Tujuan Bisnis
1. **Mengeliminasi Human-Error:** Menghilangkan salah ketik tarif, salah rumus pembulatan sangu, dan potensi kekeliruan perhitungan bagi hasil antar pemodal.
2. **Kecepatan Akses Real-Time:** Memungkinkan pengelola (Mas Hafidz) menginput transaksi harian dan memantau laba-rugi langsung dari browser smartphone maupun laptop.
3. **Transparansi Pemodal:** Memberikan akses *read-only* bagi investor untuk memeriksa rekapitulasi laba dan lembar pembagian hasil tanpa membuka dapur biaya detail internal.
4. **Kesiapan Dokumen Fisik:** Menyediakan modul cetak langsung (*print-to-paper*) dan download PDF/Excel untuk laporan resmi bulanan.

### 2.2 Kriteria Sukses (Definition of Done)
- [x] Seluruh formula matematis di aplikasi menghasilkan angka yang identik 100% dengan data historis spreadsheet Excel asli.
- [x] Input ritase baru otomatis mengisi tarif dasar per ton dan sangu supir saat kota/pabrik tujuan dipilih.
- [x] Pemotongan pajak & potongan khusus (Pajak 1%, Pot 2% LJU, 5% UJ GRB) hanya muncul/aktif pada rute Grobogan / PT LJU dan memotong profit perusahaan, bukan sangu supir.
- [x] Menu Bagi Hasil secara otomatis menarik seluruh ritase dengan filter **Tanggal Bongkar** dalam bulan berjalan, memotong komisi pengelola 5%, dan menghitung nominal rupiah hak masing-masing investor.
- [x] Tersedia tombol cetak / export PDF untuk laporan bulanan dan rekap bagi hasil.

---

## 3. Pendekatan Arsitektur yang Dipilih

Sesuai hasil brainstorming, arsitektur yang disetujui adalah **Opsi 1: Feature-Driven Monolith dengan Pure Domain Engine** menggunakan stack **Fullstack TypeScript (Next.js 15 App Router + React 19 + Drizzle ORM + PostgreSQL 17 + Better Auth)**.

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                    │
│    (React Server Components + Server Actions + shadcn/ui)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Direct Internal Function Calls
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Feature Modules Layer                    │
│      (features/trips, features/expenses, features/shares)   │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        I/O Separation                  Pure Calculation
               │                               │
┌──────────────▼──────────────┐ ┌──────────────▼──────────────┐
│    Database Layer (I/O)     │ │  Pure Domain Engine (Math)  │
│  - Drizzle ORM + Schema     │ │  - calculateOmset()         │
│  - PostgreSQL 17            │ │  - calculateSangu()         │
│  - Migrations (Drizzle Kit) │ │  - calculateTripProfit()    │
│  - Transactions             │ │  - calculateProfitSharing() │
│                             │ │  (100% Unit Test Parity)    │
└─────────────────────────────┘ └─────────────────────────────┘
```

### Keunggulan Arsitektur:
1. **Testability-First (Mandat Technical Constitution):** Logika uang diisolasi murni di `domain/calculators/` tanpa dependensi ke database/jaringan. Unit test Vitest mengeksekusi perhitungan dalam waktu < 100ms.
2. **Zero API Contract Drift:** Tidak ada pemisahan repositori backend/frontend terpisah; tipe data Drizzle dan form Zod terhubung langsung end-to-end.
3. **Mobile-First Responsive Dashboard:** Antarmuka dibangun dengan Tailwind CSS v4 dan shadcn/ui yang adaptif untuk penggunaan di lapangan via handphone.

---

## 4. Keputusan Desain & Aturan Bisnis (Design Decisions)

| No | Topik | Keputusan Disetujui | Dasar / Rationale |
|---|---|---|---|
| 1 | **Skala Armada** | Fixed 2 unit: `W8187UA` dan `H8133OF`. | Sesuai operasional fisik HW Trans saat ini; menghindari kompleksitas CRUD armada yang belum dibutuhkan. |
| 2 | **Formula Sangu Supir** | $\operatorname{ROUND}(\min(\text{Tonase Bongkar}, 31.0) \times \%\text{Sangu Rute} \times \text{Tarif}, -3)$ | Menjaga aturan tonase maksimal sangu 31 ton dan pembulatan uang saku supir ke ribuan terdekat. |
| 3 | **Potongan Khusus** | Pajak 1%, Pot 2% LJU, 5% UJ GRB **hanya berlaku untuk rute Grobogan / PT LJU** dan **mengurangi profit perusahaan**. | Dikonfirmasi oleh Mas Hafidz pada 2026-09-03. Sangu supir tidak boleh dipotong oleh pajak klien ini. |
| 4 | **Periode Bagi Hasil** | Standar tutup buku tiap **Akhir Bulan** kalender (tgl 1 s/d tgl terakhir). | Mempermudah rekonsiliasi bulanan dan sinkronisasi pembayaran investor. |
| 5 | **Pengakuan Transaksi** | Berdasarkan **Tanggal Bongkar** (`unloading_date`). | Dikonfirmasi oleh Mas Hafidz; trip diakui saat semen curah resmi dibongkar di pabrik tujuan. |
| 6 | **Hak Akses (RBAC)** | 2 Level Role: <br>1. **Admin (Mas Hafidz):** Akses penuh.<br>2. **Partner/Investor:** Akses *read-only* hanya untuk lembar bagi hasil. | Privasi nota servis dan dapur biaya operasional terjaga, namun pemodal tetap mendapatkan transparansi laporan. |
| 7 | **Fitur Cetak/Export** | Komponen tampilan cetak siap pakai (CSS `@media print`) + download PDF & Excel. | Kebutuhan mendesak untuk pengiriman laporan via WhatsApp atau arsip fisik nota. |

---

## 5. Skema Data Relasional (Drizzle ORM + PostgreSQL)

### 5.1 `trucks` (Master Unit Armada)
```typescript
export const trucks = pgTable("trucks", {
  id: varchar("id", { length: 20 }).primaryKey(), // 'W8187UA', 'H8133OF'
  plateNumber: varchar("plate_number", { length: 20 }).notNull(),
  brandModel: varchar("brand_model", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 5.2 `rate_references` (Master Tarif & Rute)
```typescript
export const rateReferences = pgTable("rate_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientName: varchar("client_name", { length: 50 }).notNull(), // 'SI', 'SBI', 'Indocement Grobogan'
  city: varchar("city", { length: 100 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  ratePerTon: numeric("rate_per_ton", { precision: 12, scale: 2 }).notNull(),
  standardTonnage: numeric("standard_tonnage", { precision: 6, scale: 2 }).default("31.00").notNull(),
  sanguPercentage: numeric("sangu_percentage", { precision: 5, scale: 4 }).notNull(), // 0.5200 = 52%
  additionalTonnageRate: numeric("additional_tonnage_rate", { precision: 12, scale: 2 }).default("25000.00").notNull(),
  hasSpecialDeductions: boolean("has_special_deductions").default(false).notNull(), // true for Grobogan/LJU
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 5.3 `trips` (Transaksi Ritase / Pemasukan)
```typescript
export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  truckId: varchar("truck_id", { length: 20 }).references(() => trucks.id).notNull(),
  orderNumber: integer("order_number").notNull(),
  orderDate: date("order_date").notNull(),
  unloadingDate: date("unloading_date"), // Kunci pengakuan periode bagi hasil
  rateReferenceId: uuid("rate_reference_id").references(() => rateReferences.id),
  destinationCity: varchar("destination_city", { length: 100 }).notNull(),
  destinationName: varchar("destination_name", { length: 255 }).notNull(),
  ratePerTon: numeric("rate_per_ton", { precision: 12, scale: 2 }).notNull(),
  loadedTonnage: numeric("loaded_tonnage", { precision: 6, scale: 2 }),
  unloadedTonnage: numeric("unloaded_tonnage", { precision: 6, scale: 2 }).notNull(),
  
  // Nilai Terhitung Otomatis
  omset: numeric("omset", { precision: 14, scale: 2 }).notNull(),
  sangu: numeric("sangu", { precision: 14, scale: 2 }).notNull(),
  incentiveRate: numeric("incentive_rate", { precision: 10, scale: 2 }).default("35000.00").notNull(),
  incentivePaid: numeric("incentive_paid", { precision: 10, scale: 2 }).default("0.00").notNull(),
  incentiveStatus: varchar("incentive_status", { length: 100 }),
  
  // Fee DO & Pihak Ketiga
  thirdPartyFee: numeric("third_party_fee", { precision: 12, scale: 2 }).default("0.00").notNull(),
  thirdPartyName: varchar("third_party_name", { length: 100 }), // 'Mas Mawan / CV Satria Perwira', 'SILOG'
  thirdPartyStatus: varchar("third_party_status", { length: 100 }),
  
  // Potongan Khusus (Aktif jika rute Grobogan / LJU)
  tax1Pct: numeric("tax_1pct", { precision: 12, scale: 2 }).default("0.00").notNull(),
  deduction2PctLju: numeric("deduction_2pct_lju", { precision: 12, scale: 2 }).default("0.00").notNull(),
  deduction5PctUjGrb: numeric("deduction_5pct_uj_grb", { precision: 12, scale: 2 }).default("0.00").notNull(),
  
  // Potongan Lain & Klaim Susut
  mealAllowance: numeric("meal_allowance", { precision: 10, scale: 2 }).default("0.00").notNull(),
  savings: numeric("savings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  claim: numeric("claim", { precision: 12, scale: 2 }).default("0.00").notNull(),
  claimDriver: numeric("claim_driver", { precision: 12, scale: 2 }).default("0.00").notNull(),
  
  // Laba Bersih Ritase
  profit: numeric("profit", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 5.4 `expenses` (Buku Pengeluaran per Truk)
```typescript
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  truckId: varchar("truck_id", { length: 20 }).references(() => trucks.id).notNull(),
  expenseDate: date("expense_date").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // Servis, Onderdil, GPS, DP/Cicilan, BBM, Admin Bank
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  adminFee: numeric("admin_fee", { precision: 10, scale: 2 }).default("0.00").notNull(),
  location: varchar("location", { length: 100 }), // Tuban, Kudus, Semarang
  repairNotes: text("repair_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 5.5 `profit_sharing_periods` & `profit_shares`
```typescript
export const profitSharingPeriods = pgTable("profit_sharing_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(), // 'Bagi Hasil September 2025'
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalIncome: numeric("total_income", { precision: 15, scale: 2 }).notNull(),
  totalExpenses: numeric("total_expenses", { precision: 15, scale: 2 }).notNull(),
  grossBalance: numeric("gross_balance", { precision: 15, scale: 2 }).notNull(),
  managerCommissionRate: numeric("manager_commission_rate", { precision: 5, scale: 4 }).default("0.0500").notNull(),
  managerCommissionAmount: numeric("manager_commission_amount", { precision: 14, scale: 2 }).notNull(),
  distributableProfit: numeric("distributable_profit", { precision: 15, scale: 2 }).notNull(),
  fleetValuation: numeric("fleet_valuation", { precision: 15, scale: 2 }).default("580000000.00").notNull(),
  managerProfit: numeric("manager_profit", { precision: 15, scale: 2 }).notNull(),
  managerTakeHome: numeric("manager_take_home", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft', 'finalized'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profitShares = pgTable("profit_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodId: uuid("period_id").references(() => profitSharingPeriods.id, { onDelete: "cascade" }).notNull(),
  partnerName: varchar("partner_name", { length: 100 }).notNull(),
  partnerUserId: text("partner_user_id"), // Optional link to user account
  capitalShare: numeric("capital_share", { precision: 15, scale: 2 }).notNull(), // 50jt, 75jt, 4jt
  sharePercentage: numeric("share_percentage", { precision: 8, scale: 6 }).notNull(),
  payoutAmount: numeric("payout_amount", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
});
```

---

## 6. Struktur Alur Pengguna (UI/UX Flows)

1. **Autentikasi:**
   - `/login` $\to$ Redirect ke Dashboard utama jika Admin (Mas Hafidz), atau langsung ke lembar bagi hasil jika akun Investor.
2. **Dashboard Operasional (Admin):**
   - KPI Cards: Total Omset Bulan Ini, Total Biaya Servis/Operasional, Laba Bersih Berjalan, dan Total Ritase per Truk.
   - Grafik Komparasi: Performa `W 8187 UA` vs `H 8133 OF`.
3. **Pencatatan Ritase (`/trips`):**
   - Tombol *Input Ritase Baru* dengan modal cepat.
   - Pilih Truk $\to$ Pilih Tanggal $\to$ Ketik/Pilih Tujuan (auto-suggest dari `rate_references`).
   - Tarif & persentase sangu otomatis terisi. Input tonase muat & bongkar $\to$ Omset, Sangu, dan Estimasi Profit langsung muncul seketika secara reaktif.
   - Tombol toggle untuk potongan khusus Grobogan/LJU (otomatis aktif jika rute Grobogan dipilih).
4. **Pencatatan Biaya (`/expenses`):**
   - Form cepat catat nota bengkel, onderdil, BBM, dan biaya admin transfer.
5. **Kalkulator & Laporan Bagi Hasil (`/profit-sharing`):**
   - Pilih periode (default: 1 s/d akhir bulan berjalan).
   - Sistem menarik agregat pemasukan (filter tanggal bongkar) dan biaya secara otomatis.
   - Menampilkan tabel simulasi investor (default daftar investor: Alfiah 50jt/580jt, Mas Dhian 75jt/580jt, Hadid 4jt/580jt, Hafidz pengelola).
   - Tombol **Cetak / Simpan PDF** menghasilkan lembar formal siap kirim.

---

## 7. Hal yang Dikecualikan (Out of Scope)

Sesuai dokumen kesepakatan `01-scope-dan-non-goals.md`:
1. **Tidak ada aplikasi supir di smartphone** (supir tidak perlu akun atau login).
2. **Tidak ada pelacakan GPS live peta** (menggunakan aplikasi IDTrack yang sudah ada).
3. **Tidak ada penambahan armada dinamis** (armada dikunci 2 unit di versi 1).
4. **Tidak ada modul akuntansi formal** (buku besar akuntansi, depresiasi aset, neraca).
5. **Tidak ada integrasi otomatis perbankan** (transfer tetap via m-banking manual).

---

## 8. Open Questions & Risiko (Risks & Mitigation)

- **Open Questions:** **Nihil.** Seluruh 4 pertanyaan validasi telah dijawab dan disetujui secara konkret oleh Mas Hafidz pada 2026-09-03.
- **Risiko Potensial:** Data historis Excel memiliki beberapa baris yang format tanggalnya tidak standar (*text serial* vs *date string*).
  - *Mitigasi:* Modul seeding/importer Excel di tahap awal akan dilengkapi parser tanggal defensif yang mengenali format Excel serial number maupun teks tanggal Indonesia.

---

## 9. Langkah Transisi Menuju Eksekusi

Dengan disetujuinya dokumen desain ini:
1. Tahap **`/scaffold-brainstorm`** resmi **SELESAI** (Terminal State tercapai).
2. Langkah selanjutnya adalah menjalankan **`/scaffold-plan`** untuk memecah arsitektur ini menjadi tugas-tugas implementasi teknis (*bite-sized tasks*) yang terstruktur dan siap dieksekusi.
