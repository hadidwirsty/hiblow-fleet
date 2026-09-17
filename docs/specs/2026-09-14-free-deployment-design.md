# Free Tier Production Deployment (Vercel + Neon Postgres) — Design Document

**Tanggal:** 2026-09-14  
**Status:** Approved  
**Topik:** Deployment Produksi 100% Gratis untuk Aplikasi Fleet & Financial Management `hiblow-fleet`

---

## 1. Ringkasan (Executive Summary)

Aplikasi `hiblow-fleet` saat ini telah selesai dibangun secara menyeluruh mencakup modul Dashboard analitik, Pencatatan DO Ritase (`trips`), Pengeluaran Armada (`expenses`), Referensi Tarif (`rates`), Jadwal Pajak/Servis (`maintenance`), Perhitungan Bagi Hasil Pemodal (`profit-sharing`), serta antarmuka responsif (Mobile – Tablet – Desktop) dengan autentikasi berbasis role (Admin, Operator, Partner).

Tahap deployment ini bertujuan untuk mempublikasikan aplikasi ke internet secara **100% Gratis (Zero Monthly Cost)** tanpa mengorbankan performa, ketersediaan layanan, integritas finansial, atau keamanan sesi. Kombinasi yang dipilih adalah **Vercel (Hobby Tier)** untuk serverless Next.js 16 hosting dan **Neon Serverless PostgreSQL (Free Tier 0.5 GB)** untuk penyimpanan database persisten dengan koneksi pooling bawaan.

---

## 2. Tujuan & Kriteria Sukses

### 2.1 Tujuan Utama
1. **Zero Cost Infrastructure:** Biaya hosting aplikasi dan database adalah Rp 0 / bulan tanpa kewajiban memasukkan kartu kredit berbayar.
2. **High Reliability & Persistence:** Database di cloud tidak dihapus otomatis (berbeda dengan platform uji coba 30 hari) dan memiliki cadangan integritas data relasional.
3. **Automated CI/CD Pipeline:** Setiap commit baru yang di-*push* ke branch `main` di GitHub otomatis di-build dan di-deploy ke Vercel dalam < 2 menit.
4. **Secure Production RBAC:** Akses aplikasi terproteksi melalui HTTPS dengan Better Auth session cookies yang aman.

### 2.2 Kriteria Sukses
- [ ] Next.js 16 (App Router) terkompilasi dan berjalan normal di Vercel tanpa kendala edge/serverless runtime.
- [ ] Database client di `db/index.ts` terhubung lancar ke Neon PostgreSQL via SSL (`sslmode=require`) tanpa connection leak.
- [ ] Seluruh skema tabel (12 tabel Drizzle) berhasil dimigrasikan ke Neon PostgreSQL.
- [ ] Data master awal (2 armada truk `W8187UA` dan `H8133OF`, referensi tarif semen, dan akun pengguna Admin/Partner) berhasil di-seed.
- [ ] Aplikasi dapat diakses publik melalui domain resmi Vercel (HTTPS aktif).

---

## 3. Pendekatan yang Dipilih & Alasan

### 3.1 Pilihan: Vercel (Hobby Free) + Neon Postgres (Serverless Free Tier)

| Aspek | Vercel + Neon | Alasan Pemilihan |
|---|---|---|
| **Hosting Biaya** | $0 / bulan (Gratis permanen) | Kuota personal Hobby Vercel dan 0.5 GB Storage Neon sangat mencukupi skala 2 armada. |
| **Next.js Compatibility** | Tingkat 1 (Native) | Vercel adalah pembuat Next.js; optimasi Turbopack, App Router, Server Actions, dan RSC berjalan maksimal. |
| **Database Lifecycle** | Persisten | Data di Neon tidak dihapus otomatis dan tidak mengalami auto-pause permanen (berbeda dengan Supabase yang pause setelah 7 hari tidak aktif). |
| **Connection Pooling** | Bawaan (PgBouncer) | Neon menyediakan endpoint `-pooler` khusus untuk aplikasi serverless, mencegah kuota koneksi habis saat spike request. |
| **Maintenance** | Zero OS Maintenance | Tidak perlu melakukan patching OS Linux, setup Docker swarm, ataupun perpanjangan sertifikat Let's Encrypt manual. |

---

## 4. Arsitektur Teknis & Alur CI/CD

```mermaid
flowchart TD
    subgraph Developer["Lingkungan Developer"]
        LocalCode["Kode Sumber Lokal (hiblow-fleet)"]
        DrizzleCLI["Drizzle Kit CLI (db:migrate & db:seed)"]
    end

    subgraph GitHub["Version Control (GitHub)"]
        Repo["GitHub Repo (branch: main)"]
    end

    subgraph VercelCloud["Platform Hosting (Vercel)"]
        VercelHook["Vercel Build Pipeline"]
        NextApp["Next.js 16 Serverless Functions (App Router)"]
        EdgeNetwork["Vercel Global Edge & SSL (HTTPS)"]
    end

    subgraph NeonCloud["Database Cloud (Neon PostgreSQL)"]
        NeonPooler["Neon Connection Pooler (PgBouncer)"]
        NeonDB[(PostgreSQL 17 Database Engine)]
    end

    subgraph EndUsers["Pengguna Produksi"]
        AdminUser["Admin (Mas Hafidz)"]
        PartnerUser["Partner / Pemodal (Hj. Alfiah)"]
        FieldOperator["Operator Input Data"]
    end

    LocalCode -->|git push| Repo
    Repo -->|Webhook Trigger| VercelHook
    VercelHook -->|next build| NextApp
    NextApp --- EdgeNetwork
    
    EdgeNetwork -->|HTTPS Access| AdminUser
    EdgeNetwork -->|HTTPS Access| PartnerUser
    EdgeNetwork -->|HTTPS Access| FieldOperator

    DrizzleCLI -->|Direct Migration & Seeding| NeonPooler
    NextApp -->|Pooled Queries via DATABASE_URL| NeonPooler
    NeonPooler --> NeonDB
```

---

## 5. Perubahan Kode & Konfigurasi yang Diperlukan

### 5.1 Adaptasi Koneksi SSL Database (`db/index.ts`)
Driver `pg` (node-postgres) memerlukan konfigurasi SSL khusus saat terhubung ke database cloud yang mewajibkan TLS (`?sslmode=require`):

```typescript
// db/index.ts
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://hiblow:hiblow_secret@localhost:5433/hiblow_db"

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

// Deteksi apakah koneksi mengarah ke cloud (Neon / production)
const isCloudDatabase =
  process.env.NODE_ENV === "production" ||
  connectionString.includes("neon.tech") ||
  connectionString.includes("sslmode=require")

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl: isCloudDatabase ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })
export type Database = typeof db
```

### 5.2 Skrip Eksekusi Database Remotely (`package.json`)
Menambahkan atau memastikan skrip migrasi dan seeding dapat menerima `DATABASE_URL` dari environment variable tanpa hardcode `.env.local` saat eksekusi manual.

---

## 6. Spesifikasi Environment Variables (Vercel Dashboard)

Variabel berikut harus didaftarkan di halaman **Project Settings > Environment Variables** di dashboard Vercel untuk environment **Production**:

| Key | Tipe Nilai | Contoh Format | Deskripsi |
|---|---|---|---|
| `DATABASE_URL` | Secret | `postgresql://neondb_owner:***@ep-***-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Connection string Neon dengan endpoint **Pooled**. |
| `BETTER_AUTH_SECRET` | Secret | `b64-string-min-32-chars` (hasil `openssl rand -base64 32`) | Kunci simetris enkripsi token sesi & otentikasi Better Auth. |
| `BETTER_AUTH_URL` | Plain / URL | `https://hiblow-fleet.vercel.app` | Alamat domain publik produksi Vercel. |
| `NEXT_PUBLIC_APP_URL` | Plain / URL | `https://hiblow-fleet.vercel.app` | URL acuan frontend untuk routing & absolute URLs. |

---

## 7. Runbook Operasional Langkah Demi Langkah

### Fase 1: Persiapan Database Neon (Waktu estimasi: 3 menit)
1. Buka [neon.tech](https://neon.tech) dan login/daftar gratis dengan akun GitHub.
2. Buat project baru bernama `hiblow-fleet-db`.
3. Pilih region terdekat dengan pengguna Indonesia: **Asia Pacific (Singapore) - `ap-southeast-1`**.
4. Di dashboard Neon, pada bagian **Connection Details**, pastikan memilih opsi **Connection Pooling (PgBouncer)**.
5. Salin connection string yang berakhiran `?sslmode=require`.

### Fase 2: Eksekusi Migrasi & Seeding dari Terminal (Waktu estimasi: 2 menit)
Jalankan perintah berikut di terminal lokal untuk mengisi struktur dan data ke database Neon:
```bash
# 1. Jalankan migrasi seluruh tabel Drizzle ke Neon
DATABASE_URL="<connection-string-neon>" pnpm db:migrate

# 2. Masukkan master armada (W8187UA, H8133OF) dan daftar tarif rute semen
DATABASE_URL="<connection-string-neon>" pnpm db:seed

# 3. Buat akun login awal Admin dan Partner
DATABASE_URL="<connection-string-neon>" pnpm tsx db/seed-users.ts

# 4. (Opsional) Impor seluruh data historis dari file Excel HW Trans
DATABASE_URL="<connection-string-neon>" pnpm db:import-history
```

### Fase 3: Deployment ke Vercel (Waktu estimasi: 3 menit)
1. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub.
2. Klik **Add New Project** > pilih repository `hiblow-fleet`.
3. Framework Preset otomatis mendeteksi **Next.js**.
4. Masukkan ke-4 Environment Variables pada tabel Bagian 6 (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`).
5. Klik tombol **Deploy**.
6. Vercel akan menjalankan `next build` dan mempublikasikan aplikasi ke domain publik (misal `https://hiblow-fleet.vercel.app`).

---

## 8. Out of Scope (Non-Goals untuk Rilis Deployment Ini)

- Pembelian custom domain berbayar (`.com` / `.id`) — menggunakan domain gratis `.vercel.app`.
- Penyewaan VPS Linux berbayar (seperti DigitalOcean / AWS EC2).
- Setup S3 Storage berbayar untuk upload bukti fisik struk — penyimpanan nota struk saat ini cukup berupa referensi teks/catatan audit.

---

## 9. Verification Plan

### 9.1 Otomatisasi
- Menjalankan `pnpm build` secara lokal sebelum push untuk memastikan kompilasi Next.js 16 tanpa peringatan error.
- Menjalankan `pnpm test` (7/7 formula & card tests lulus).
- Menjalankan `pnpm lint` (0 error, 0 warning).

### 9.2 Verifikasi Produksi Pasca-Deploy
1. **Akses Halaman Login:** Buka `https://hiblow-fleet.vercel.app/login`, pastikan form login ter-render sempurna via HTTPS.
2. **Login Admin:** Masuk menggunakan kredensial Admin (`hafidz@hiblow.fleet`), pastikan session tersimpan dan diarahkan ke `/dashboard`.
3. **Pemeriksaan Data:**
   - Navigasi ke `/trips`: Data perjalanan truk muncul dari database Neon.
   - Navigasi ke `/expenses`: Data pengeluaran muncul dan filter berfungsi.
   - Navigasi ke `/profit-sharing`: Kartu pembagian laba pemodal muncul dengan kalkulasi presisi.
4. **Login Partner (Read-Only):** Buka di browser incognito / mobile, masuk sebagai Partner (`alfiah@hiblow.fleet`), pastikan tombol tambah/edit data tersembunyi (read-only mode aktif).
