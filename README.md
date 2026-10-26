<div align="center">
  <img src="public/images/logo-dark-new.png" alt="HW Trans Logo" width="180">

  <h1 align="center">hiblow-fleet</h1>

  <p align="center">
    <strong>Sistem Manajemen Operasional Armada & Rekapitulasi Finansial Truk Tronton Tangki Semen Curah (HI-Blow Truck)</strong>
    <br />
    Aplikasi web terpadu untuk pencatatan ritase, pengeluaran armada, master acuan tarif pabrik, akuntansi pajak PPh 1,2%, dan transparansi bagi hasil investor Hadya Wiran Trans (HW Trans).
  </p>

  <p align="center">
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js" alt="Next.js"></a>
    <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react" alt="React"></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"></a>
    <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS"></a>
    <a href="https://orm.drizzle.team"><img src="https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle ORM"></a>
    <a href="https://neon.tech"><img src="https://img.shields.io/badge/Neon_PostgreSQL-17-00E599?style=for-the-badge&logo=postgresql" alt="Neon Database"></a>
    <a href="https://vitest.dev"><img src="https://img.shields.io/badge/Vitest-285_Tests_Passed-6E9F18?style=for-the-badge&logo=vitest" alt="Vitest Passed"></a>
  </p>
</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
  - [Latar Belakang Bisnis](#latar-belakang-bisnis)
  - [Profil Armada](#profil-armada)
- [Fitur Utama](#-fitur-utama)
- [Tumpukan Teknologi (Tech Stack)](#-tumpukan-teknologi-tech-stack)
- [Panduan Memulai (Getting Started)](#-panduan-memulai-getting-started)
  - [Prasyarat Sistem](#prasyarat-sistem)
  - [Instalasi](#instalasi)
  - [Konfigurasi Lingkungan (.env)](#konfigurasi-lingkungan-env)
  - [Pengaturan Basis Data & Migrasi](#pengaturan-basis-data--migrasi)
  - [Menjalankan Server Pengembangan](#menjalankan-server-pengembangan)
- [Pengujian & Verifikasi Kualitas](#-pengujian--verifikasi-kualitas)
- [Arsitektur Proyek](#-arsitektur-proyek)
- [Hak Akses Pengguna (RBAC)](#-hak-akses-pengguna-rbac)

---

## 🚛 Tentang Proyek

**hiblow-fleet** adalah platform ERP & *financial operations* internal yang dibangun khusus untuk **Hadya Wiran Trans (HW Trans)** guna memodernisasi pembukuan manual spreadsheet Excel menjadi sistem digital yang otomatis, terverifikasi secara matematis, aman, dan dapat diaudit secara *real-time*.

### Latar Belakang Bisnis
Sebelumnya, operasional truk tangki semen curah dicatat dalam spreadsheet multi-tab yang rentan terhadap inkonsistensi rumus, ketidakteraturan urutan kolom, dan kesulitan pelacakan potongan fee pihak ketiga. **hiblow-fleet** menyelesaikan kendala tersebut dengan:
- Otomasi kalkulasi pendapatan kotor (*omset*), uang saku supir (*sangu*), insentif ritase, potongan tabungan supir, uang makan, dan komisi pihak ketiga (*dispatcher fee*).
- Sinkronisasi acuan tarif resmi langsung dari pabrik semen terkemuka di Jawa Tengah dan Jawa Timur.
- Perhitungan bagi hasil dividen investor yang adil dan transparan berbasis valuasi armada tetap.
- Rekonsiliasi akuntansi fiskal pemotongan pajak PPh Pasal 23 (1,2%) transportasi.

### Profil Armada
Aplikasi ini dirancang khusus untuk mengelola unit armada truk tronton tangki *Hi-Blow*:
* **Unit 1:** `W 8187 UA` (Hino 500 Tronton Hi-Blow) — Wilayah Operasional Rembang, Tuban & Grobogan.
* **Unit 2:** `H 8133 OF` (Hino 500 Tronton Hi-Blow) — Wilayah Operasional Rembang, Tuban & Grobogan.

---

## ✨ Fitur Utama

### 1. 📊 Dasbor Operasional (`/dashboard`)
* Ringkasan KPI *real-time*: Total Omset, Total Sangu Supir, Total Beban Armada, dan Estimasi Laba Bersih.
* Grafik tren interaktif perbandingan pendapatan vs pengeluaran bulanan.
* Analisis rute terpopuler (*Top Routes Breakdown*).
* Widget pengingat servis armada (*Maintenance Reminders*) untuk jatuh tempo KIR, perpanjangan STNK, dan jadwal ganti oli berkala.

### 2. 🚚 Pencatatan Ritase & Surat Jalan (`/trips`)
* Manajemen tiket perjalanan surat jalan (penomoran terstandar `W-xxx` dan `H-xxx`).
* Auto-matching ke master katalog tarif pabrik (relasi otomatis 96%+ ke acuan resmi).
* Perhitungan otomatis: Omset tonase, toleransi muatan, potongan PPh 1,2%, potongan LJU 2%, potongan UJ Grobogan 5%, tabungan wajib supir (Rp 100 rb), uang makan (Rp 100 rb), dan insentif.
* Pelacakan status komisi koordinator pihak ketiga (Mas Mawan & Mbah Man SILOG).
* Ekspor data ke format Excel (`.xlsx`) dan CSV dengan format angka terstandar.

### 3. ⛽ Rekapitulasi Pengeluaran Armada (`/expenses`)
* Pencatatan beban biaya terintegrasi dalam 7 kategori standar: `Servis`, `Onderdil`, `BBM`, `GPS`, `DP/Cicilan`, `Administrasi`, dan `Lainnya`.
* Grafik distribusi beban pengeluaran berbasis Recharts.
* Pelacakan biaya admin transfer bank per transaksi.
* Filter multi-dimensi berdasarkan armada, kategori, bulan, dan tahun.

### 4. 🏭 Master Katalog Acuan Tarif Pabrik (`/rates`)
* **296 Rute Aktif Terdaftar**:
  - Solusi Bangun Indonesia (SBI) Tuban: 162 rute
  - Semen Indonesia (SI) Tuban: 78 rute
  - Semen Indonesia (SI) Rembang: 31 rute
  - Indocement Grobogan: 25 rute
* Formula sangu supir otomatis dengan presisi rasio hingga 7 angka desimal.
* Pengaturan toleransi kelebihan tonase (misal Rp 25.000 / ton di atas 31 Ton).

### 5. 💰 Transparansi Bagi Hasil Investor (`/profit-sharing`)
* Wizard tutup buku periode bagi hasil bulanan berstatus `draft` hingga `finalized`.
* Skema bagi hasil proporsional berbasis Valuasi Armada Tetap (**Rp 580.000.000,00**) dan Komisi Manajemen Pengelola (**5,00%**).
* Tampilan personalisasi khusus pemodal/investor (menampilkan dividen bersih dan porsi kepemilikan modal tanpa akses ke data rahasia armada lain).

### 6. ⚖️ Akuntansi Perpajakan PPh 1,2% (`/taxes`)
* Pencatatan nomor bukti potong (Bupot) PPh Pasal 23 jasa transportasi angkutan semen.
* Komparasi laba kotor sebelum pajak vs setelah pajak.
* Analisis Year-over-Year (YoY) tren pemotongan pajak.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.2.6](https://nextjs.org) | App Router, React Server Components (RSC), Server Actions |
| **Library UI** | [React 19.2.4](https://react.dev) | Modern concurrent React primitives |
| **Bahasa** | [TypeScript 5](https://www.typescriptlang.org) | Strict type-safety end-to-end |
| **CSS & Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Modern styling engine dengan `@tailwindcss/postcss` |
| **Komponen UI** | [shadcn/ui](https://ui.shadcn.com) | Desain komponen adaptif berbasis `@base-ui/react` |
| **Pustaka Ikon** | [Remix Icon](https://remixicon.com) | `@remixicon/react: ^4.9.0` secara konsisten di seluruh aplikasi |
| **Basis Data** | [Neon PostgreSQL 17](https://neon.tech) | Serverless PostgreSQL dengan PgBouncer pooling |
| **ORM** | [Drizzle ORM 0.45.2](https://orm.drizzle.team) | Type-safe SQL query builder & schema migrations |
| **Autentikasi** | [Better Auth 1.7.2](https://better-auth.com) | Autentikasi sesi berbasis cookie & role RBAC (`proxy.ts`) |
| **State Global** | [Zustand 5.0](https://zustand-demo.pmnd.rs) | Manajemen state UI client (sidebar, loading, dialog modal) |
| **Grafik** | [Recharts 3.8](https://recharts.org) | Visualisasi grafik interaktif |
| **Tabel Data** | [TanStack Table v9](https://tanstack.com/table) | Pencarian instan, sorting, dan pagination tabel |
| **Testing** | [Vitest 4.1](https://vitest.dev) | Test runner berkecepatan tinggi dengan 100% test passing |

---

## 🚀 Panduan Memulai (Getting Started)

### Prasyarat Sistem
* **Node.js**: Versi `20.x` atau `22.x` (LTS disarankan)
* **Package Manager**: `pnpm` (versi 9+)
* **Basis Data**: Akses instance PostgreSQL 17 (Lokal melalui Docker atau Cloud melalui Neon DB)

### Instalasi

1. Kloning repositori:
   ```bash
   git clone https://github.com/hadidwirsty/hiblow-fleet.git
   cd hiblow-fleet
   ```

2. Pasang dependensi proyek:
   ```bash
   pnpm install
   ```

### Konfigurasi Lingkungan (.env)
Salin berkas templat lingkungan `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Lengkapi variabel berikut di dalam `.env.local`:
```env
# Database Connection (Neon PostgreSQL / Local Postgres)
DATABASE_URL="postgres://user:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Better Auth Configuration
BETTER_AUTH_SECRET="gunakan_random_secret_string_32_karakter"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Pengaturan Basis Data & Migrasi

1. Jalankan migrasi skema ke database:
   ```bash
   pnpm db:migrate
   ```

2. Jalankan seeding master data acuan tarif pabrik dan akun pengguna awal:
   ```bash
   pnpm db:seed
   pnpm db:seed-users
   ```

### Menjalankan Server Pengembangan
Jalankan server Next.js lokal:
```bash
pnpm dev
```
Buka peramban di [http://localhost:3000](http://localhost:3000). Aplikasi akan otomatis mengarahkan ke halaman `/login`.

---

## 🧪 Pengujian & Verifikasi Kualitas

Seluruh kalkulasi bisnis domain (uang sangu, pemotongan pajak, bagi hasil, dan formula ritase) dilindungi oleh pengujian unit otomatis secara ketat (*Testability-First Architecture*):

```bash
# Menjalankan seluruh test suite (60 test files, 285 tests)
pnpm test

# Menjalankan test dengan mode live-watch
pnpm test:watch

# Menjalankan verifikasi tipe TypeScript
pnpm typecheck

# Menjalankan audit linting kode
pnpm lint
```

---

## 🏛️ Arsitektur Proyek

Struktur direktori mengadopsi pola **Feature-Driven Slices**:

```text
hiblow-fleet/
├── app/                        # Next.js 16 App Router (Rute & Halaman)
│   ├── (auth)/login/           # Halaman Autentikasi Pengguna
│   ├── (dashboard)/            # Rute Terproteksi Sesi & RBAC
│   │   ├── dashboard/          # Dasbor Ringkasan KPI & Analitik
│   │   ├── trips/              # Modul Pencatatan Ritase
│   │   ├── expenses/           # Modul Pengeluaran Armada
│   │   ├── rates/              # Modul Master Tarif Pabrik
│   │   ├── profit-sharing/     # Modul Periode Bagi Hasil
│   │   └── taxes/              # Modul Akuntansi Pajak PPh 1,2%
│   └── api/auth/               # Endpoint Better Auth
├── components/                 # Komponen UI Reusable
│   ├── layout/                 # Shell Aplikasi (Sidebar, Header, Overlay)
│   └── ui/                     # Primitives shadcn/ui
├── db/                         # Konfigurasi Basis Data & Skema ORM
│   ├── migrations/             # Skrip SQL Migrasi Drizzle
│   ├── data/rates.json         # Master Kanonikal 296 Tarif Rute Pabrik
│   └── schema/                 # Definisi Tabel PostgreSQL
├── domain/                     # Pure Business Logic Engine (Bebas UI & Framework)
│   └── calculators/            # Rumus Keuangan: Sangu, Komisi, Pajak, Dividen
├── features/                   # Feature Modules (Components, Actions, Queries)
├── lib/                        # Utilitas Sistem, Auth Client, & RBAC Helper
├── proxy.ts                    # Routing Guard Middleware Next.js 16
└── stores/                     # Global UI State (Zustand)
```

---

## 👥 Hak Akses Pengguna (RBAC)

Aplikasi menerapkan pemisahan wewenang secara tegas melalui middleware `proxy.ts` dan Server Action validation guard:

| Modul & Fitur | Role `admin` (Pengelola HW Trans) | Role `partner` (Pemodal / Investor) |
| :--- | :---: | :---: |
| **Dasbor Operasional** | Akses Penuh (KPI Finansial, Grafik, Pengingat Servis) | Terbatas (Tanpa data sensitif internal) |
| **Pencatatan Ritase** | Lihat, Tambah, Edit, Hapus, Ekspor Excel/CSV | Terbatas (*Read-only*) |
| **Pengeluaran Armada** | Lihat, Catat Nota, Edit, Hapus, Ekspor | Terbatas (*Read-only*) |
| **Katalog Tarif Pabrik** | Lihat, Tambah Rute, Perbarui Tarif, Nonaktifkan | Hanya Lihat (*Read-only*) |
| **Bagi Hasil Investor** | Wizard Tutup Buku, Input Pengeluaran, Finalisasi | **Personalisasi Dividen Pribadi** |
| **Akuntansi Pajak** | Input Bukti Potong, Rekonsiliasi, Analisis YoY | Hanya Lihat (*Read-only*) |

---

## 📄 Lisensi & Hak Cipta

Hak Cipta © 2026 **Hadya Wiran Trans (HW Trans)**. Seluruh hak cipta dilindungi undang-undang. Sistem ini dikembangkan untuk operasional internal eksklusif HW Trans.
