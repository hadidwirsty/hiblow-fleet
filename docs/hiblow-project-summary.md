# Project Summary: HI-Blow Fleet & Finance Management App

## 1. Identitas & Nama Project

- **Nama Project:** `hiblow-fleet`
- **Tujuan:** Membangun aplikasi web pencatatan operasional armada truk tronton tangki curah semen (*HI-Blow Truck*) dan pengelolaan keuangan bulanan, menggantikan spreadsheet Excel manual (`PERHITUNGAN HIBLOW HW Trans.xlsx`).
- **Skala Armada:** Tetap 2 unit armada — **W 8187 UA** dan **H 8133 OF** (tidak memerlukan fitur tambah/hapus armada secara dinamis di tahap awal).

---

## 2. Dokumen Pre-Development Terkait

Sebagai bagian dari proses validasi awal sebelum tahap penulisan kode (*development*), project ini dilengkapi 3 dokumen acuan untuk ditinjau bersama pengelola (Mas Hafidz):

1. **[01-scope-dan-non-goals.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/01-scope-dan-non-goals.md)** — Batasan versi pertama (fitur yang dibuat vs yang sengaja ditunda) dan asumsi-asumsi awal.
2. **[02-feature-list-prioritas.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/02-feature-list-prioritas.md)** — Daftar prioritas kebutuhan menggunakan matriks MoSCoW (Must Have, Should Have, Could Have, Won't Have) lengkap dengan kolom review.
3. **[03-pertanyaan-validasi-data.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/03-pertanyaan-validasi-data.md)** — Pertanyaan konfirmasi seputar aturan potongan pajak, rentang tanggal bagi hasil, hak akses pengguna, dan kebutuhan export laporan.
4. **Spreadsheet Acuan:** Disimpan rapi di [docs/references/PERHITUNGAN HIBLOW HW Trans.xlsx](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/references/PERHITUNGAN%20HIBLOW%20HW%20Trans.xlsx).

---

## 3. Struktur Data Sumber & Model Entitas

Berdasarkan ekstraksi data dan formula dari file spreadsheet asli:

| Sheet Asli | Fungsi Bisnis | Entitas Sistem | Deskripsi Ringkas |
|---|---|---|---|
| `SI Tarif`, `SBI Tarif`, `Indocement Grobogan Tarif` | Tabel tarif acuan rute & sangu | `RateReference` | Tabel lookup saat input order; auto-fill tarif per ton dan sangu supir. |
| `Masuk W8187UA`, `Masuk H8133OF` | Log pemasukan & ritase per truk | `Trip` | Mencatat DO, tonase muat/bongkar, omset, sangu, insentif, fee DO pihak ketiga, dan laba per rit. |
| `Keluar W8187UA`, `Keluar H8133OF` | Log pengeluaran biaya per truk | `Expense` | Mencatat biaya servis mesin, suku cadang, BBM, GPS, cicilan/DP, biaya admin bank, dan lokasi. |
| `Bagi Hasil` | Pembagian laba berkala pemodal | `ProfitSharingPeriod` & `ProfitShare` | Menghitung laba bersih periode, memotong komisi pengelola 5%, dan membagi hasil ke investor sesuai porsi modal. |

### Formula Kunci
1. **Omset:**
   $$\text{Omset} = \text{Tarif Dasar} \times \text{Tonase Bongkar}$$
2. **Sangu Supir:**
   $$\text{Tonase Dasar Sangu} = \min(\text{Tonase Bongkar}, 31.0)$$
   $$\text{Sangu} = \operatorname{ROUND}(\text{Tonase Dasar Sangu} \times \%\text{Sangu Rute} \times \text{Tarif Dasar}, -3)$$
   *(Dibulatkan ke ribuan terdekat)*
3. **Laba Bersih Ritase:**
   $$\text{Profit} = \text{Omset} - \text{Sangu} - \text{Insentif Supir (Rp 35.000)} - \text{Fee Pihak Ketiga (DO)} - \text{Potongan Pajak/Klaim}$$
4. **Bagi Hasil Pemodal:**
   $$\text{Gross Balance} = \sum \text{Pemasukan} - \sum \text{Pengeluaran}$$
   $$\text{Komisi Pengelola} = 5\% \times \text{Gross Balance}$$
   $$\text{Distributable Profit} = \text{Gross Balance} - \text{Komisi Pengelola}$$
   $$\text{Bagian Investor} = \frac{\text{Modal Investor}}{\text{Valuasi Armada (misal: Rp 580.000.000)}} \times \text{Distributable Profit}$$

---

## 4. Keputusan Tech Stack & Arsitektur (Hasil Brainstorming)

Dari hasil sesi `/scaffold-brainstorm`, disepakati menggunakan arsitektur **Feature-Driven Monolith dengan Pure Domain Engine**:

- **Framework Utama:** **Next.js (App Router)** + **React 19** + **TypeScript**
  - Satu ekosistem bahasa terpadu (Fullstack TypeScript) end-to-end tanpa overhead pemeliharaan 2 repositori terpisah.
  - Pemuatan data cepat dengan React Server Components (RSC) dan mutasi data aman menggunakan Server Actions tervalidasi skema Zod.
- **ORM & Database:** **Drizzle ORM** + **PostgreSQL**
  - Skema transparan bertipe aman (*type-safe SQL*), performa tinggi, dan migrasi SQL yang bersih.
- **Desain UI:** **Tailwind CSS v4** + **shadcn/ui** + **lucide-react**
  - Tampilan dashboard modern, bersih, profesional, dan responsif optimal di laptop maupun smartphone.
- **Autentikasi & Otorisasi:** **Better Auth** / **NextAuth**
  - Role-based access control (RBAC):
    1. **Admin / Pengelola (Mas Hafidz):** Akses penuh (input data, edit tarif, konfigurasi bagi hasil, analitik lengkap).
    2. **Investor / Partner:** Akses *read-only* dibatasi hanya untuk melihat rekapitulasi laba dan lembar pembagian hasil porsinya.
- **Arsitektur Testability-First (Pure Domain Engine):**
  - Seluruh logika kalkulasi finansial (`calculateOmset`, `calculateSangu`, `calculateTripProfit`, `calculateProfitSharing`) dipisah murni di modul `domain/calculators/` tanpa dependensi ke database/jaringan.
  - Memungkinkan 100% *unit testing* yang cepat dan presisi sebelum menyentuh lapisan database, menjamin tidak ada deviasi angka dari Excel asli.

---

## 5. Rencana Tahapan Berikutnya

1. **Review Dokumen Pre-Development:** Konfirmasi dan persetujuan 3 dokumen proposal oleh Mas Hafidz.
2. **Scaffold Project:** Inisialisasi repository, konfigurasi Next.js, Tailwind v4, shadcn/ui, Drizzle ORM, dan koneksi PostgreSQL.
3. **Domain Engine & Unit Tests:** Implementasi unit test untuk formula matematis Excel hingga lulus 100%.
4. **Implementasi Fitur Bertahap:** Sesuai urutan prioritas MoSCoW (Master Data & Ritase $\to$ Pengeluaran $\to$ Bagi Hasil $\to$ Dashboard).
