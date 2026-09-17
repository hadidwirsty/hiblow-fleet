# Panduan Deployment Produksi 100% Gratis (Vercel + Neon PostgreSQL)

> **Dokumen Operasional (Runbook)**  
> **Aplikasi:** `hiblow-fleet` (Fleet & Financial Management HW Trans)  
> **Estimasi Waktu Setup:** ~8–10 menit  
> **Biaya Bulanan:** **Rp 0 / bulan (100% Free)**  

---

## Ringkasan Arsitektur Deployment

Aplikasi ini menggunakan kombinasi dua layanan cloud tier gratis permanen tanpa kewajiban kartu kredit berbayar:
1. **Frontend & Serverless Functions:** **Vercel (Hobby Plan)** — Menyediakan hosting Next.js 16 native, SSL HTTPS otomatis, CDN global, dan auto-deploy setiap kali kode di-*push* ke GitHub.
2. **Database:** **Neon Serverless PostgreSQL (Free Tier 0.5 GB)** — Menyediakan database PostgreSQL 17 dengan koneksi pooling PgBouncer bawaan (anti-connection leak) dan persistensi permanen.

```mermaid
flowchart LR
    Dev([Developer]) -->|1. git push| GitHub[GitHub Repo: main]
    GitHub -->|2. Webhook Auto-Deploy| Vercel[Vercel Serverless<br/>Next.js 16 App Router]
    Dev -->|3. Migrasi & Seeding| Neon[(Neon PostgreSQL 17<br/>Region Singapore)]
    Vercel -->|4. Pooled Database Queries| Neon
    Pengguna([Pengguna: Mas Hafidz & Hj. Alfiah]) -->|5. HTTPS Access| Vercel
```

---

## Prasyarat Sebelum Memulai

Pastikan Anda memiliki:
- [x] Akun [GitHub](https://github.com) (tempat kode repository `hiblow-fleet` berada).
- [x] Node.js dan `pnpm` terpasang di komputer lokal Anda.
- [x] Akun gratis di [Neon.tech](https://neon.tech) (dapat login langsung menggunakan akun GitHub).
- [x] Akun gratis di [Vercel.com](https://vercel.com) (dapat login langsung menggunakan akun GitHub).

---

## Fase 1: Setup Database Cloud di Neon (3 Menit)

1. Buka [console.neon.tech](https://console.neon.tech) dan login menggunakan akun GitHub Anda.
2. Klik tombol **Create a project**.
3. Beri nama project: `hiblow-fleet-db`.
4. Pilih Postgres version: **Postgres 17** (direkomendasikan).
5. Pilih Region terdekat dengan Indonesia: **Asia Pacific (Singapore) - `ap-southeast-1`**.
6. Klik **Create Project**.
7. Setelah project selesai dibuat, Anda akan melihat jendela **Connection Details**:
   - Di bagian atas connection string, pastikan memilih opsi **Pooled connection** (bukan Direct).
   - Salin connection string yang berakhiran `?sslmode=require`.
   - Contoh format connection string:
     ```text
     postgresql://hiblow_owner:npg_xYz12345@ep-sweet-mountain-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - Simpan connection string ini untuk langkah migrasi dan konfigurasi di Vercel.

---

## Fase 2: Migrasi Skema & Seeding Data Awal (2 Menit)

Jalankan perintah berikut di terminal komputer lokal Anda. Ganti isi `<PASTE_NEON_CONNECTION_STRING>` dengan connection string yang baru saja Anda salin dari Neon pada Fase 1:

### 1. Migrasi Seluruh Skema Tabel Drizzle
Perintah ini akan membuat seluruh 12 tabel, index, dan enum ke database Neon:
```bash
DATABASE_URL="<PASTE_NEON_CONNECTION_STRING>" pnpm db:migrate
```
*Output yang diharapkan: `Applying migrations... Done!`*

### 2. Seeding Master Truk & Referensi Tarif Semen
Perintah ini mendaftarkan 2 armada resmi (`W8187UA` dan `H8133OF`) serta daftar master tarif rute semen:
```bash
DATABASE_URL="<PASTE_NEON_CONNECTION_STRING>" pnpm db:seed
```
*Output yang diharapkan: `Seeded 2 trucks and rate references successfully.`*

### 3. Pembuatan Akun Login Awal Admin & Pemodal
Perintah ini membuat akun Admin (`hafidz@hiblow.fleet`) dan Partner (`alfiah@hiblow.fleet`):
```bash
DATABASE_URL="<PASTE_NEON_CONNECTION_STRING>" pnpm run db:seed-users
```
*Output yang diharapkan: `✅ Admin user created: hafidz@hiblow.fleet` dan `✅ Partner user created: alfiah@hiblow.fleet`.*

### 4. (Opsional) Impor Seluruh Data Riwayat Transaksi Excel
Jika Anda ingin seluruh riwayat DO dan pengeluaran dari spreadsheet `PERHITUNGAN HIBLOW HW Trans.xlsx` langsung masuk ke cloud:
```bash
DATABASE_URL="<PASTE_NEON_CONNECTION_STRING>" pnpm run db:import-history
```

---

## Fase 3: Deployment ke Vercel (3 Menit)

### 1. Pastikan Kode Lokal Ter-push ke GitHub
```bash
git add .
git commit -m "feat(deployment): configure production deployment for vercel and neon"
git push origin main
```

### 2. Hubungkan Repository ke Vercel
1. Buka dashboard [vercel.com](https://vercel.com).
2. Klik tombol **Add New...** > pilih **Project**.
3. Pada daftar repository GitHub Anda, pilih repository **`hiblow-fleet`** dan klik **Import**.
4. Di bagian **Configure Project**:
   - **Framework Preset:** Next.js (terdeteksi otomatis).
   - **Root Directory:** `./` (default).

### 3. Daftarkan 4 Environment Variables Wajib
Buka bagian accordion **Environment Variables** di halaman setup Vercel, lalu tambahkan 4 variabel berikut satu per satu:

| Name | Value | Keterangan |
|---|---|---|
| `DATABASE_URL` | `<PASTE_NEON_CONNECTION_STRING>` | Pooled connection string dari Neon yang berakhiran `?sslmode=require` |
| `BETTER_AUTH_SECRET` | Buat string acak (minimal 32 karakter) | Anda dapat menghasilkan secret aman di terminal dengan perintah `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://hiblow-fleet.vercel.app` | Ganti dengan nama domain project Anda di Vercel |
| `NEXT_PUBLIC_APP_URL` | `https://hiblow-fleet.vercel.app` | Sama dengan URL domain publik Vercel Anda |

> [!NOTE]
> Jika Anda belum tahu persis nama domain Vercel Anda, gunakan `https://[nama-project].vercel.app`. Setelah deploy pertama berhasil, Anda bisa menyesuaikan nilainya di menu **Project Settings > Environment Variables** bila nama domain berbeda.

### 4. Jalankan Deployment
1. Klik tombol **Deploy**.
2. Vercel akan otomatis menjalankan:
   - `pnpm install`
   - `next build`
   - Optimasi static pages dan serverless route bundle.
3. Dalam ~1 hingga 2 menit, Anda akan diarahkan ke layar perayaan **Congratulations!** dan mendapatkan URL live publik (contoh: `https://hiblow-fleet.vercel.app`).

---

## Fase 4: Verifikasi Pasca-Deploy & Pengujian Akun

Setelah aplikasi online, lakukan pengujian berikut di browser Anda:

1. **Uji Halaman Login:**
   - Kunjungi `https://[nama-project].vercel.app/login`.
   - Pastikan form login muncul dengan gembok SSL (HTTPS).
2. **Uji Login Akun Admin (Mas Hafidz):**
   - **Email:** `hafidz@hiblow.fleet`
   - **Password:** `password123` (segera ganti password setelah masuk pertama kali).
   - Pastikan Anda diarahkan ke `/dashboard` dan seluruh metrik omset, ritase, dan grafik muncul.
   - Buka menu `/trips`, `/expenses`, dan `/rates` untuk memastikan Anda dapat melihat dan menambah data.
3. **Uji Login Akun Partner / Pemodal (Hj. Alfiah):**
   - Buka jendela *Incognito / Private Window* di browser Anda.
   - Login dengan **Email:** `alfiah@hiblow.fleet` / **Password:** `password123`.
   - Pastikan masuk ke tampilan Bagi Hasil Pemodal dengan rincian dividen dan tombol tambah/edit terkunci (*read-only*).
4. **Uji Responsivitas Mobile:**
   - Buka URL dari smartphone Anda.
   - Pastikan tampilan kartu mobile, hamburger drawer, dan bottom sheet berfungsi dengan mulus.

---

## Tips Pemeliharaan & Keamanan

1. **Pembaruan Kode Otomatis (CI/CD):**
   - Setiap kali Anda melakukan `git push origin main` dari komputer lokal, Vercel akan otomatis melakukan rebuild dan deploy pembaruan kode terbaru ke production tanpa downtime.
2. **Backup Data Mandiri:**
   - Gunakan tombol **Export Excel / CSV** yang sudah tersedia di halaman `/trips`, `/expenses`, dan `/profit-sharing` untuk mengunduh salinan data operasional ke komputer lokal secara berkala.
3. **Monitoring Kapasitas Neon:**
   - Dashboard Neon menyediakan grafik pemakaian storage (Free Tier 0.5 GB). Data teks puluhan ribu transaksi armada umumnya hanya memakan < 50 MB, sehingga kuota gratis ini sangat aman untuk tahun-tahun operasional ke depan.
