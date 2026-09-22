# Project Context: hiblow-fleet

> **Authoritative Context Memory Document**  
> Terakhir diperbarui via `/scaffold-onboard`: 2026-09-18  
> Dokumen ini adalah *single source of truth* (sumber kebenaran tunggal) mengenai tech stack, arsitektur sistem, aturan domain bisnis & formula finansial, skema database, konvensi kode, serta workflow operasional proyek `hiblow-fleet`. Seluruh AI agent dan engineer wajib mematuhi standar yang terdokumentasi di sini.

---

## 1. Ringkasan & Identitas Proyek

- **Nama Proyek:** `hiblow-fleet`
- **Domain:** Aplikasi Manajemen Operasional Armada & Rekapitulasi Finansial Truk Tronton Tangki Semen Curah (*HI-Blow Truck*).
- **Latar Belakang Bisnis:** Menggantikan pencatatan manual spreadsheet Excel (`PERHITUNGAN HIBLOW HW Trans.xlsx`) yang dikelola oleh Hadya Wiran Trans (HW Trans) untuk melacak ritase surat jalan, pengeluaran operasional armada, sangu supir, insentif rit, komisi pihak ketiga (*third party DO fee*), jadwal pemeliharaan (servis, KIR, STNK), serta pembagian laba bagi hasil (*profit sharing*) bulanan kepada pemodal/investor.
- **Armada (Static Fleet):**
  - Unit 1: `W8187UA` (Hino 500 Tronton Hi-Blow)
  - Unit 2: `H8133OF` (Hino 500 Tronton Hi-Blow)
  - Skala armada bersifat tetap 2 unit (tidak memerlukan fitur penambahan/penghapusan unit truk dinamis).
- **Multi-Role & Persona Pengguna:**
  - **Admin (Pengelola Armada - Muhammad Hafidz Wirandryo & Muhammad Hadid Wiransetyo):** Akses penuh ke seluruh modul (`/dashboard`, `/trips`, `/expenses`, `/rates`, `/profit-sharing`), formulir tambah/edit/hapus data, manajemen status fee pihak ketiga, pelacakan pengingat servis, dan wizard tutup buku periode bagi hasil.
  - **Partner (Pemodal/Investor - Hj. Alfiah Dwi Ayu Wirandari):** Tampilan personalisasi dividen pada modul `/profit-sharing` (menampilkan ringkasan modal, persentase kepemilikan, riwayat dividen yang didapat per siklus tutup buku berstatus `finalized`, dan bersifat *read-only* tanpa tombol mutasi data).
- **Integritas Formula (Excel Ground Truth):** Logika kalkulasi matematis (omset, sangu, laba trip, dan bagi hasil) mengacu 100% pada formula historis spreadsheet acuan (`docs/references/PERHITUNGAN HIBLOW HW Trans.xlsx` dan ekstraksi CSV di `docs/csv/`) dan tidak boleh diubah secara sepihak.

---

## 2. Tech Stack & Ekosistem Perangkat Lunak

### 2.1 Runtime & Tooling Utama
- **Node.js:** Node.js v20+ / v25+
- **Package Manager:** `pnpm` (menggunakan `pnpm-lock.yaml`, `pnpm-workspace.yaml`)
- **Framework:** **Next.js 16.2.6** (React 19.2.4, TypeScript 5) dengan App Router architecture & Server Components / Server Actions
  - *Catatan Penting:* Next.js 16 memiliki perubahan internal dari versi Next.js lama (Next.js 14/15). Middleware autentikasi diimplementasikan via `proxy.ts`.
- **Database:** PostgreSQL 17
  - **Lokal:** Docker container `hiblow-fleet-postgres` via `docker-compose.yml` (Port host **`5433`** $\to$ Port container `5432`).
  - **Cloud Produksi:** Neon Serverless PostgreSQL (`ap-southeast-1` Singapore) dengan PgBouncer pooling connection string (`?sslmode=require`).
- **ORM & Database Migrations:** **Drizzle ORM 0.45.2** & **Drizzle Kit 0.31.10** (`node-postgres` / `pg: ^8.23.0` pool driver dengan isolasi koneksi hot-reload & auto SSL switch Neon).
- **Autentikasi & RBAC:** **Better Auth 1.7.2** dengan Drizzle adapter, email & password authentication, session management, dan middleware proxy (`proxy.ts`).
- **Styling & Komponen UI:**
  - **Tailwind CSS v4** (`@tailwindcss/postcss: ^4`, `tw-animate-css: ^1.4.0`, `tailwind-merge: ^3.6.0`, `clsx: ^2.1.1`)
  - **Palette Warna:** Emerald Theme (`emerald-600` / `emerald-500` accents) dengan dukungan Dark Mode & Light Mode adaptif.
  - **Base UI & Radix Primitives:** `@base-ui/react: ^1.7.0`
  - **Komponen:** `shadcn/ui` (Button, Input, InputGroup, Card, Badge, Dialog, ResponsiveDialog, Drawer, Sheet, Sidebar, Table, Tabs, Popover, Command, Checkbox, Progress, Skeleton, Tooltip, dll.)
  - **Animasi Khusus:** `TruckSpinner` (`components/ui/truck-spinner.tsx`), `GlobalLoadingOverlay` (`components/global-loading-overlay.tsx`), `DashboardNavigationLoading` (`components/dashboard-navigation-loading.tsx`), `LoginWelcomeDialog` (`features/auth/login-welcome-dialog.tsx`).
  - **Ikon:** `@remixicon/react: ^4.9.0` (Remix Icon modern)
  - **Charts:** `recharts: 3.8.0` (Area interactive chart & horizontal bar/donut breakdown)
  - **Notifikasi Toast:** `sonner: ^2.0.8`
  - **Theme:** `next-themes: ^0.4.6` (Light / Dark mode support)
- **State Management & Form Handling:**
  - **Global/UI State:** `zustand: ^5.0.15`
  - **Form:** `react-hook-form: ^7.87.0` + `@hookform/resolvers: ^5.9.1`
  - **Schema Validation:** `zod: ^4.5.4` (Validasi ketat di batas form dan Server Action)
- **Tabel & Interaksi:**
  - **Data Table:** `@tanstack/react-table: ^9.2.4`
  - **Drag and Drop:** `@dnd-kit/core: ^6.3.1`, `@dnd-kit/sortable: ^10.0.0`, `@dnd-kit/modifiers: ^9.0.0`, `@dnd-kit/utilities: ^3.2.2`
- **Spreadsheet / File Export:** `xlsx: ^0.18.5` + custom CSV builder & Excel builder (`lib/export/`)
- **Testing Engine:** **Vitest 4.1.11** + `@vitest/coverage-v8: ^4.1.11` (Node environment, path alias `@/*` didukung, 100% pure domain & queries test parity — 39 file test suite, 171 passed tests)

---

## 3. Arsitektur Kode & Pola Direktori

Mengikuti standar **Testability-First Architecture** dan **Feature-Driven Slices** dari Technical Constitution (`.agents/skills/technical-constitution/SKILL.md`):

```text
hiblow-fleet/
├── .agents/
│   ├── rules/
│   │   └── project-context.md          # Dokumen authoritative memory ini
│   └── skills/                         # Workflows & engineering skills
├── app/                                # Next.js 16 App Router
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/page.tsx              # Halaman Login (Better Auth)
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # AppSidebar, SiteHeader, Session check, Navigation loading
│   │   ├── dashboard/page.tsx          # KPI Cards, Chart ritase, Top rute, Pengingat servis
│   │   ├── trips/page.tsx              # Daftar surat jalan & input order ritase
│   │   ├── expenses/page.tsx           # Rekapitulasi pengeluaran & grafik kategori
│   │   ├── rates/page.tsx              # Katalog 289 master tarif rute pabrik
│   │   └── profit-sharing/page.tsx     # Rekap bagi hasil (Admin wizard & Partner view)
│   ├── api/
│   │   └── auth/[...all]/route.ts      # Better Auth handler endpoint
│   ├── globals.css                     # Tailwind v4 theme & token CSS
│   ├── layout.tsx                      # Root layout, ThemeProvider, Toaster, GlobalLoadingOverlay
│   └── page.tsx                        # Root redirect -> /dashboard (atau /login / /profit-sharing)
├── components/                         # Shared & UI Components
│   ├── layout/                         # Shell navigasi & layout aplikasi
│   │   ├── app-sidebar.tsx             # Sidebar navigasi adaptif RBAC & branding logo
│   │   ├── site-header.tsx             # Header atas (breadcrumb, theme toggle, user badge)
│   │   ├── sidebar-nav-main.tsx        # Menu utama navigasi sidebar
│   │   ├── sidebar-nav-documents.tsx   # Navigasi dokumen & referensi
│   │   ├── sidebar-nav-secondary.tsx   # Navigasi sekunder sidebar
│   │   ├── sidebar-nav-user.tsx        # User dropdown profile & logout
│   │   ├── dashboard-navigation-loading.tsx # Indikator loading transisi navigasi dasbor
│   │   ├── global-loading-overlay.tsx  # Overlay loading global dengan truck spinner
│   │   ├── mode-toggle.tsx             # Dark / light switcher
│   │   └── theme-provider.tsx          # Wrapper next-themes provider
│   ├── ui/                             # shadcn component primitives
│   │   ├── __tests__/
│   │   │   └── responsive-dialog.test.ts # Test responsive dialog/drawer
│   │   ├── avatar.tsx, badge.tsx, button.tsx, card.tsx, chart.tsx, checkbox.tsx
│   │   ├── command.tsx, dialog.tsx, drawer.tsx, dropdown-menu.tsx, input-group.tsx
│   │   ├── input.tsx, label.tsx, popover.tsx, progress.tsx, responsive-dialog.tsx
│   │   ├── select.tsx, separator.tsx, sheet.tsx, sidebar.tsx, skeleton.tsx
│   │   ├── sonner.tsx, table.tsx, tabs.tsx, textarea.tsx, toggle-group.tsx
│   │   ├── toggle.tsx, tooltip.tsx, truck-spinner.tsx
│   └── data-table.tsx                  # Reusable TanStack data table
├── db/                                 # Database Layer (Drizzle ORM)
│   ├── schema/                         # Schema definition per modul
│   │   ├── index.ts                    # Re-export seluruh schema
│   │   ├── trucks.ts                   # Master unit truk (W8187UA & H8133OF)
│   │   ├── rate-references.ts          # Master tarif & rute semen (289 rute)
│   │   ├── trips.ts                    # Transaksi surat jalan ritase & kalkulasi
│   │   ├── expenses.ts                 # Transaksi pengeluaran & kategori biaya
│   │   ├── profit-sharing.ts           # Periode tutup buku & distribusi pemodal
│   │   ├── maintenance.ts              # Pengingat jadwal servis, KIR, STNK
│   │   └── auth.ts                     # User, session, account, verification (Better Auth)
│   ├── migrations/                     # File migrasi SQL Drizzle Kit
│   ├── data/
│   │   ├── rates.json                  # Data ekstraksi acuan 289 rute dari Excel
│   │   └── history.json                # Data riwayat transaksi awal
│   ├── __tests__/
│   │   └── pool-config.test.ts         # Test resolver PostgreSQL pool connection
│   ├── index.ts                        # Drizzle connection & pooled connection export
│   └── pool-config.ts                  # Resolver config connection pool (Neon SSL vs Local)
├── domain/                             # Pure Domain Engine (Zero I/O, 100% Pure Functions)
│   ├── calculators/
│   │   ├── __tests__/                  # Co-located calculator unit tests
│   │   │   ├── omset.test.ts           # Test formula omset (rate * tonase)
│   │   │   ├── sangu.test.ts           # Test formula sangu supir (pembulatan Rp 1.000)
│   │   │   ├── trip-profit.test.ts     # Test laba bersih surat jalan & potongan khusus
│   │   │   └── profit-sharing.test.ts  # Test laba tutup buku & dividen pemodal
│   │   ├── omset.ts                    # Kalkulasi omset (rate * tonase)
│   │   ├── sangu.ts                    # Kalkulasi sangu supir (pembulatan kelipatan Rp 1.000)
│   │   ├── trip-profit.ts              # Kalkulasi laba bersih surat jalan & potongan khusus
│   │   ├── profit-sharing.ts           # Kalkulasi laba tutup buku & dividen pemodal
│   │   └── index.ts
│   ├── __tests__/                      # Co-located pure domain logic tests
│   │   ├── expense-category.test.ts    # Test transformasi breakdown pengeluaran
│   │   ├── investor-personalization.test.ts # Test ekstraksi dividen mitra
│   │   ├── maintenance.test.ts         # Test logika status jatuh tempo servis
│   │   └── route-trend.test.ts         # Test transformasi grafik top rute
│   ├── expense-category.ts             # Transformasi breakdown pengeluaran & color tokens
│   ├── investor-personalization.ts     # Ekstraksi dividen investor spesifik (extractMyShares)
│   ├── maintenance.ts                  # Logika status jatuh tempo pemeliharaan (overdue, due_soon, ok)
│   └── route-trend.ts                  # Transformasi data grafik top rute & truncate label
├── features/                           # Vertical Feature Slices (Co-located tests)
│   ├── auth/
│   │   ├── __tests__/                  # auth-login.test.ts
│   │   ├── login-form.tsx
│   │   └── login-welcome-dialog.tsx
│   ├── dashboard/
│   │   ├── __tests__/                  # dashboard-queries.test.ts
│   │   ├── dashboard-kpi-cards.tsx     # 4 KPI cards ringkasan dasbor
│   │   ├── dashboard-trip-chart.tsx    # Grafik area interaktif ritase harian 2 armada
│   │   ├── dashboard-route-chart.tsx   # Grafik horizontal bar top rute
│   │   └── dashboard.queries.ts
│   ├── trips/
│   │   ├── __tests__/                  # trips-queries.test.ts, trips-schema.test.ts,
│   │   │                               # trips-export.test.ts, trips-fee-actions.test.ts,
│   │   │                               # trip-mobile-card.test.ts, trip-form-calculations.test.ts
│   │   ├── trips.actions.ts, trips.queries.ts, trips.schema.ts, trips.export.ts
│   │   ├── trips-export-button.tsx, trips-table.tsx, trips-summary.tsx
│   │   ├── trip-form-dialog.tsx, trip-destination-combobox.tsx, trip-fee-status-dialog.tsx, trip-mobile-card.tsx
│   ├── expenses/
│   │   ├── __tests__/                  # expenses-actions.test.ts, expenses-queries.test.ts,
│   │   │                               # expenses-schema.test.ts, expenses-export.test.ts,
│   │   │                               # expenses-summary.test.ts, expense-mobile-card.test.ts
│   │   ├── expenses.actions.ts, expenses.queries.ts, expenses.schema.ts, expenses.export.ts
│   │   ├── expenses-export-button.tsx, expenses-table.tsx, expenses-summary.tsx
│   │   ├── expense-form-dialog.tsx, expenses-category-chart.tsx, expense-mobile-card.tsx
│   ├── rates/
│   │   ├── __tests__/                  # rates-actions.test.ts, rates-queries.test.ts,
│   │   │                               # rates-schema.test.ts, rate-mobile-card.test.ts
│   │   ├── rates.actions.ts, rates.queries.ts, rates.schema.ts
│   │   ├── rates-table.tsx, rate-form-dialog.tsx, rate-mobile-card.tsx, rates-summary.tsx
│   ├── profit-sharing/
│   │   ├── __tests__/                  # profit-sharing-actions.test.ts, profit-sharing-queries.test.ts,
│   │   │                               # profit-sharing-schema.test.ts, profit-sharing-export.test.ts
│   │   ├── profit-sharing.actions.ts, profit-sharing.queries.ts, profit-sharing.schema.ts, profit-sharing.export.ts
│   │   ├── partner-profit-sharing-view.tsx, period-card.tsx, period-detail-sheet.tsx, period-wizard-dialog.tsx, profit-sharing-empty-state.tsx
│   └── maintenance/
│       ├── __tests__/                  # maintenance-actions.test.ts
│       ├── maintenance.actions.ts, maintenance.queries.ts, maintenance.schema.ts
│       └── maintenance-reminders-widget.tsx
├── hooks/                              # Custom React Hooks (use-mobile.ts)
├── lib/                                # Shared Utilities & Server Helper
│   ├── deployment/
│   │   ├── __tests__/                  # env-validator.test.ts
│   │   └── env-validator.ts            # Validasi environment variable deployment
│   ├── export/                         # Helper export data: excel-builder.ts, csv-builder.ts, download.ts
│   ├── __tests__/                      # csv-builder.test.ts, excel-builder.test.ts, rbac.test.ts, rbac-redirect.test.ts, utils.test.ts
│   ├── auth.ts                         # Instance Better Auth server
│   ├── auth-client.ts                  # Client Better Auth hook (useSession, signIn, signOut)
│   ├── session.ts                      # Helper getCurrentSession() server-side
│   ├── rbac.ts                         # Role checking (isAdmin, isPartner, assertAdmin, determineRedirectPath)
│   └── utils.ts                        # cn(), formatCurrency(), formatDate(), number helpers
├── proxy.ts                            # Next.js request proxy / middleware untuk session check & role guard
├── public/                             # Aset statis (logo_dark.png, logo_light.png, background, icons)
├── scripts/                            # Runnable CLI & Maintenance Scripts
│   ├── db/
│   │   ├── seed.ts                     # Seeding trucks & rate references
│   │   ├── seed-users.ts               # Seeding user admin & partner
│   │   ├── import-history.ts           # Impor data historis transaksi dari Excel
│   │   ├── sync-csv.ts                 # Sinkronisasi CSV data docs/csv ke database
│   │   ├── clear-rates.ts              # Pengosongan master tarif
│   │   └── clear-all.ts                # Pengosongan transaksi operasional
│   └── verify-deployment.ts            # Script verifikasi environment variable sebelum deploy
├── docs/                               # Dokumentasi Blueprint, Specs, Plans, CSV, PDF & References
├── docker-compose.yml                  # PostgreSQL 17 lokal container
├── drizzle.config.ts                   # Drizzle Kit config
├── vitest.config.ts                    # Vitest configuration (include: ["**/*.test.ts", "**/*.test.tsx"])
└── package.json
```

---

## 4. Aturan Bisnis & Formula Finansial Resmi (Ground Truth)

Sumber acuan absolut: Workbook Excel `docs/references/PERHITUNGAN HIBLOW HW Trans.xlsx` (Sheet `SI Tarif`, `SBI Tarif`, `Indocement Grobogan Tarif`, `Masuk W8187UA`, `Keluar W8187UA`, `Masuk H8133OF`, `Keluar H8133OF`, `Bagi Hasil`).

### 4.1 Modul Referensi Tarif (`rate_references`)
- Menampung master rute pabrik: `SI` (Semen Indonesia Tuban), `SBI` (Semen Bima / Solusi Bangun Indonesia Rembang), dan `Indocement Grobogan`.
- Menyimpan `rate_per_ton` (tarif dasar per ton), `standard_tonnage` (default 31.00 ton), `sangu_percentage` (rasio sangu supir terhadap omset, misal 0.52 = 52%), dan `has_special_deductions` (true untuk rute Grobogan / PT LJU).

### 4.2 Modul Ritase Surat Jalan (`trips`)
- **Omset (Pendapatan Kotor Ritase):**
  $$\text{Omset} = \text{rate\_per\_ton} \times \text{unloaded\_tonnage}$$
  *(Dibulatkan ke 2 desimal)*
- **Sangu Supir (Driver Allowance):**
  $$\text{base\_tonnage} = \min(\text{unloaded\_tonnage}, \text{standard\_tonnage} \ (\text{default } 31.0))$$
  $$\text{raw\_sangu} = \text{base\_tonnage} \times \text{sangu\_percentage} \times \text{rate\_per\_ton}$$
  $$\text{sangu} = \operatorname{ROUND}(\text{raw\_sangu} / 1000) \times 1000$$
  *(Dibulatkan ke kelipatan Rp 1.000 terdekat sesuai aturan pembulatan Excel `ROUND(..., -3)`)*
- **Potongan Khusus Rute Grobogan / PT LJU (`hasSpecialDeductions = true`):**
  - Pajak PPh 1%: $\text{tax1Pct} = \text{omset} \times 0.01$
  - Potongan 2% LJU: $\text{deduction2PctLju} = \text{omset} \times 0.02$
  - Uang Jalan 5% Grobogan: $\text{deduction5PctUjGrb} = \text{sangu} \times 0.05$
  - *Aturan Krusial:* Potongan khusus ini **memotong laba operasional perusahaan/truk, BUKAN memotong sangu supir**.
- **Biaya Pihak Ketiga (*Third Party DO Fee*):**
  - Biaya jasa perolehan DO (contoh: Mas Mawan / CV. Satria Perwira, Mbah Man / SILOG).
  - Status pembayaran dilacak tersendiri (`thirdPartyStatus`, misal: "Sudah dibayar 12 Sep 2025").
- **Insentif Rit Supir:**
  - Standar `incentiveRate`: Rp 35.000 / rit (dapat diubah sesuai rute/perjanjian).
- **Laba Bersih Surat Jalan (`profit`):**
  $$\text{Deductions} = \text{sangu} + \text{incentivePaid} + \text{thirdPartyFee} + \text{tax1Pct} + \text{deduction2PctLju} + \text{deduction5PctUjGrb} + \text{lainnya}$$
  $$\text{profit} = \text{omset} - \text{Deductions}$$

### 4.3 Modul Pengeluaran Truk (`expenses`)
- Pengeluaran operasional dan pemeliharaan per unit truk.
- Kategori resmi: `Servis`, `Onderdil`, `GPS`, `DP/Cicilan`, `BBM`, `Administrasi`, `Lainnya`.
- Total beban per transaksi: $\text{amount} + \text{adminFee}$ (termasuk biaya transfer bank).

### 4.4 Modul Bagi Hasil Pemodal (`profit_sharing_periods` & `profit_shares`)
- **Kunci Pengakuan Periode:** Menggunakan tanggal bongkar (**`trips.unloadingDate`**) dalam rentang `startDate` s.d. `endDate`.
- **Total Omset Periode (`totalIncome`):** Akumulasi `trips.omset` pada rentang tanggal bongkar.
- **Total Pengeluaran Periode (`totalExpenses`):**
  $$\text{totalExpenses} = \sum (\text{expenses.amount} + \text{expenses.adminFee})$$
  - *Pengecualian Wajib:* Kategori `'DP/Cicilan'` **DIKECUALIKAN** dari beban bagi hasil operasional bulanan karena merupakan belanja modal/investasi unit (*capital expenditure*), bukan biaya operasional jalan.
- **Saldo Kotor (`grossBalance`):**
  $$\text{grossBalance} = \text{totalIncome} - \text{totalExpenses}$$
- **Hak Komisi Pengelola (*Komisi Hafidz*):**
  $$\text{managerCommission} = \begin{cases} \operatorname{round}(\text{grossBalance} \times \text{managerCommissionRate}), & \text{jika } \text{grossBalance} > 0 \\ 0, & \text{jika rugi/negatif} \end{cases}$$
  *(Default rate: 5% atau 0.0500)*
- **Laba Bersih Siap Bagi (*Distributable Profit*):**
  $$\text{distributableProfit} = \text{grossBalance} - \text{managerCommission}$$
- **Dividen Pemodal (*Partner Shares*):**
  - Valuasi armada acuan: $\text{fleetValuation} = \text{Rp } 580.000.000,00$ (dapat disesuaikan).
  - Porsi kepemilikan: $\text{sharePercentage} = \frac{\text{capitalShare}}{\text{fleetValuation}}$.
  - Hak bagi hasil mitra:
    $$\text{partnerPayout} = \begin{cases} \operatorname{round}(\text{distributableProfit} \times \text{sharePercentage}), & \text{jika } \text{distributableProfit} > 0 \\ 0, & \text{jika rugi} \end{cases}$$
- **Laba Sisa Hak Pengelola (*Manager Profit*):**
  $$\text{managerProfit} = \text{distributableProfit} - \sum \text{partnerPayouts}$$
- **Total Pendapatan Bersih Pengelola (*Manager Take Home*):**
  $$\text{managerTakeHome} = \text{managerProfit} + \text{managerCommission}$$
- **Status Periode:**
  - `draft`: Dalam peninjauan kalkulasi admin, belum dipublikasikan sebagai dividen resmi.
  - `finalized`: Tutup buku resmi. Akumulasi dividen investor otomatis tercatat dan terlihat di dashboard investor.

### 4.5 Modul Pengingat Pemeliharaan (`maintenance_reminders`)
- Melacak tanggal jatuh tempo servis armada: `oil_change` (ganti oli), `kir` (uji KIR Dishub), `stnk` (pajak tahunan STNK), dan `other`.
- Ambang batas status:
  - `overdue`: Tanggal jatuh tempo sudah terlewat (< 0 hari).
  - `due_soon`: Jatuh tempo dalam $\le 30$ hari ke depan.
  - `ok`: Masih lebih dari 30 hari ke depan.

---

## 5. Skema Database (Drizzle ORM)

| Nama Tabel | Deskripsi & Relasi |
|---|---|
| `trucks` | Master armada: `id` (PK: `'W8187UA'`, `'H8133OF'`), `plate_number`, `brand_model`, `is_active`, `created_at`. |
| `rate_references` | Master tarif rute: `id` (UUID), `client_name`, `city`, `destination`, `rate_per_ton`, `standard_tonnage`, `sangu_percentage`, `additional_tonnage_rate`, `has_special_deductions`, `is_active`. |
| `trips` | Transaksi surat jalan ritase: `id` (UUID), `truck_id` (FK `trucks`), `order_number`, `order_date`, `unloading_date`, `destination_city`, `destination_name`, `rate_per_ton`, `unloaded_tonnage`, `omset`, `sangu`, `profit`, dll. |
| `expenses` | Pengeluaran truk: `id` (UUID), `truck_id` (FK `trucks`), `expense_date`, `category`, `description`, `amount`, `admin_fee`, `location`, `repair_notes`. |
| `profit_sharing_periods` | Periode tutup buku: `id` (UUID), `title`, `start_date`, `end_date`, `total_income`, `total_expenses`, `gross_balance`, `manager_commission_rate`, `manager_commission_amount`, `distributable_profit`, `fleet_valuation`, `manager_profit`, `manager_take_home`, `status` (`'draft'` \| `'finalized'`). |
| `profit_shares` | Rincian dividen pemodal per periode: `id` (UUID), `period_id` (FK `profit_sharing_periods`, on delete cascade), `partner_name`, `partner_user_id` (opsional relasi ke akun auth), `capital_share`, `share_percentage`, `payout_amount`, `notes`. |
| `maintenance_reminders` | Jadwal servis & pajak: `id` (UUID), `truck_id` (FK `trucks`), `reminder_type` (`'oil_change'` \| `'kir'` \| `'stnk'` \| `'other'`), `label`, `due_date`, `interval_days`, `notes`, `is_active`. |
| `user` | Akun pengguna Better Auth: `id`, `name`, `email` (unique), `role` (`'admin'` \| `'partner'`), `email_verified`, `image`. |
| `session` | Sesi login Better Auth: `id`, `user_id` (FK `user`), `token`, `expires_at`, `ip_address`, `user_agent`. |
| `account` | Kredensial akun (password hash) Better Auth. |
| `verification` | Token verifikasi Better Auth. |

---

## 6. Development Workflow & Commands

### 6.1 Environment Configuration (`.env.local`)
Template konfigurasi lokal:
```env
# Database Configuration (PostgreSQL 17 - Host port 5433 untuk docker lokal)
DATABASE_URL=postgres://hiblow:hiblow_secret@localhost:5433/hiblow_db

# Better Auth Configuration (Secret min 32 chars)
BETTER_AUTH_SECRET=super_secret_better_auth_key_min_32_bytes_hiblow_fleet
BETTER_AUTH_URL=http://localhost:3000

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.2 Perintah Dev Terstandar (pnpm)
- **Menjalankan Database Docker Lokal:**
  ```bash
  docker compose up -d
  ```
- **Menjalankan Dev Server:**
  ```bash
  pnpm dev
  ```
- **Type Checking TypeScript (No Emit):**
  ```bash
  pnpm typecheck
  ```
- **Menjalankan Test Suite (Vitest - 39 Files, 176 Tests):**
  ```bash
  pnpm test
  pnpm test:watch
  pnpm test:coverage
  ```
- **Linting & Code Formatting:**
  ```bash
  pnpm lint
  pnpm format
  ```
- **Drizzle ORM Migrasi & Studio:**
  ```bash
  pnpm db:generate    # Generate migration file dari schema
  pnpm db:migrate     # Menjalankan migrasi SQL ke database
  pnpm db:studio      # Buka GUI Drizzle Studio inspector
  ```
- **Seeding & Sinkronisasi Data:**
  ```bash
  pnpm db:seed           # Seed unit truk W8187UA/H8133OF & 289 referensi tarif
  pnpm run db:seed-users # Seed user awal: hafidz@hiblow.fleet, hadid@hiblow.fleet, alfiah@hiblow.fleet
  pnpm run db:import-history # Impor riwayat transaksi Excel ke database
  pnpm run db:sync-csv   # Sinkronisasi CSV data docs/csv ke database
  ```
- **Verifikasi Kesiapan Deployment & Build:**
  ```bash
  pnpm verify:deployment # Validasi kecukupan env vars
  pnpm build
  ```

---

## 7. Kebijakan Keamanan, Akses & Tata Kelola Kode

### 7.1 Bahasa Komunikasi & Copywriting UI
- **Output Percakapan & Status:** Seluruh interaksi dengan user — laporan, status, pertanyaan, dan checkpoint — **WAJIB menggunakan Bahasa Indonesia**.
- **Wording & Antarmuka Pengguna (UI Copywriting):** Seluruh elemen antarmuka (label input, tombol, kartu ringkasan, dialog, toast, badge status, dan deskripsi grafik) **WAJIB 100% menggunakan Bahasa Indonesia** yang baku, lugas, dan profesional. DILARANG mencampur istilah Bahasa Inggris pada tampilan visual pengguna kecuali nama merek yang tidak dapat diterjemahkan (*PT Hadya Wiran Trans*).
- **Artefak Teknis:** Kode sumber, nama variabel, commit message, schema database, tipe TypeScript, dan file path tetap dalam **Bahasa Inggris**.

### 7.2 Otorisasi & Role-Based Access Control (RBAC)
- Terapkan prinsip **Deny-By-Default**:
  - Halaman `/dashboard`, `/trips`, `/expenses`, `/rates`, dan Server Actions mutasi data hanya dapat diakses oleh user dengan `role === "admin"`.
  - User dengan `role === "partner"` otomatis diarahkan ke `/profit-sharing` (tampilan personalisasi dividen investor).
  - Pengguna tanpa sesi diarahkan ke `/login`.
  - Jangan pernah mengekspos rahasia (*secrets*) atau kredensial database di kode klien.

### 7.3 Kualitas & Pengujian (Testability-First)
- Seluruh kalkulasi matematika finansial (omset, sangu, profit, bagi hasil) **wajib berupa pure functions** di dalam `domain/calculators/` yang dapat diuji secara mandiri tanpa membutuhkan koneksi database atau runtime Next.js.
- Database access wajib berada di layer `*.queries.ts` atau `*.actions.ts`.
- Sebelum menyelesaikan tugas besar atau mengajukan branch, seluruh 39 test suite dan `pnpm typecheck` harus berstatus **PASSED / CLEAN**.
