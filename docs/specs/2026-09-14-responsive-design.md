# Technical Design Document: Responsivitas Antarmuka (Mobile – Tablet – Desktop)

**Tanggal:** 2026-09-14  
**Topik:** Standardisasi Responsivitas & Pengalaman Mobile-First (`hiblow-fleet`)  
**Status:** Ready for Review  
**Target Pengguna:** Pengelola Lapangan (Mas Hafidz) & Investor Armada (Hadid, Alfiah, Dhian)  
**Dokumen Terkait:**  
- [2026-09-03-hiblow-fleet-design.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/specs/2026-09-03-hiblow-fleet-design.md)
- [02-feature-list-prioritas.md](file:///Users/hadidwirsty/Project/hiblow-fleet/docs/02-feature-list-prioritas.md)
- [project-context.md](file:///Users/hadidwirsty/Project/hiblow-fleet/.agents/rules/project-context.md)

---

## 1. Ringkasan Eksekutif

Aplikasi `hiblow-fleet` saat ini telah memiliki fungsionalitas lengkap untuk manajemen ritase, pengeluaran, master tarif, bagi hasil dividen, dan analitik dashboard. Namun, seiring dengan kebutuhan operasional di mana **Mas Hafidz menginput data langsung dari ponsel di pool/lapangan** dan **para pemodal memantau dividen dari smartphone**, diperlukan penyempurnaan menyeluruh pada aspek responsivitas agar antarmuka terasa senyaman aplikasi mobile native pada layar kecil (360px–480px), tablet (768px–1024px), hingga monitor desktop (≥1024px).

Dokumen ini menetapkan pendekatan arsitektural **Component-Level Adaptive Abstraction** untuk mentransformasikan tabel data padat menjadi kartu mobile (*Card List*), form modal menjadi *Bottom Sheet / Drawer*, dan tata letak grid/chart adaptif yang bebas dari masalah terpotong (*no horizontal scrollbar issues*).

---

## 2. Tujuan & Kriteria Sukses

### 2.1 Tujuan Desain
1. **Pencatatan Cepat di Lapangan (Mobile Input):** Pengelola dapat menginput surat jalan ritase dan nota bengkel dari ponsel tanpa terhalang keyboard virtual atau modal dialog yang sempit.
2. **Kenyamanan Membaca Data di Ponsel (Mobile Data Browsing):** Menghilangkan keharusan menggeser layar ke kanan-kiri pada tabel 11 kolom saat melihat data di ponsel.
3. **Estetika Elegan & Proporsional di Semua Layar:** Kartu KPI, diagram analitik, dan tabel memiliki skala tipografi dan *spacing* yang pas di layar 360px (HP kecil), 768px (iPad/Tablet), maupun layar desktop lebar.

### 2.2 Kriteria Sukses (Definition of Done)
- [ ] Di layar ponsel (`< 768px`), tabel transaksi (`/trips`, `/expenses`, `/rates`) otomatis berganti menjadi tampilan daftar kartu vertikal (*Mobile Card List*) yang informatif dan touch-friendly.
- [ ] Di layar desktop & tablet (`≥ 768px`), tabel tetap ditampilkan dalam format tabular lengkap dengan padding yang proporsional.
- [ ] Seluruh form input (`TripFormDialog`, `ExpenseFormDialog`, `RateFormDialog`, `TripFeeStatusDialog`) bertransformasi menjadi **Bottom Sheet Drawer** di ponsel dengan tombol simpan yang berada di zona jangkauan ibu jari (*thumb zone*).
- [ ] Bilah filter (Truk, Kategori, Bulan, Tahun) di halaman ritase & pengeluaran tertata rapi dalam grid 2 kolom / wrapping fleksibel di ponsel, tanpa memakan terlalu banyak ruang vertikal.
- [ ] Seluruh grafik Recharts (`ChartAreaInteractive`, `DashboardRouteChart`, `ExpensesCategoryChart`) responsif dan tidak menyebabkan *horizontal overflow* pada viewport ponsel (360px).
- [ ] Seluruh 33 file unit tests (156 test cases) tetap 100% lulus, 0 TypeScript error, dan build produksi Next.js sukses.

---

## 3. Sistem Breakpoint & Layout Grid Standar

Mengikuti standar Tailwind CSS v4 yang telah terpasang di proyek:

| Breakpoint | Lebar Layar | Target Perangkat | Pola Tampilan & Navigasi |
|---|---|---|---|
| **Mobile (`< md`)** | `< 768px` (360px – 767px) | iPhone, Android phone | 1 Kolom vertikal, Drawer geser bawah, Mobile Card List, Hamburger menu offcanvas. |
| **Tablet (`md`)** | `768px – 1023px` | iPad, tablet Android | 2 Kolom grid, Modal Dialog, Tabel Tabular dengan padding rapat, Sidebar otomatis collapsed. |
| **Desktop (`lg` – `2xl`)** | `≥ 1024px` | Laptop, monitor desktop | 3–4 Kolom grid, Modal Dialog terpusat, Tabel Tabular penuh, Sidebar expand terbuka. |

### Aturan Padding & Spacing Global
- **Halaman Wrapper:** `px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6`
- **Gap Antar Section:** `gap-3 sm:gap-4 md:gap-6`
- **Tipografi KPI Nominal:** Menggunakan kelas `text-lg sm:text-xl lg:text-2xl font-bold tabular-nums` untuk mencegah angka rupiah terpotong di layar 360px.

---

## 4. Rincian Desain Komponen Adaptif

### 4.1 Reusable Responsive Modal Wrapper (`ResponsiveDialog`)
Untuk menyatukan interaksi dialog antara desktop dan mobile tanpa menduplikasi state form bisnis:

```typescript
// components/ui/responsive-dialog.tsx
interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  trigger?: React.ReactNode
}
```
- **Di Layar Ponsel (`< md`):** Merender `<Drawer>` dari `@/components/ui/drawer` (berbasis `vaul`):
  - Memiliki indikator *handle bar* geser di atas.
  - Konten form dapat di-scroll vertikal dengan batas `max-h-[85vh]`.
  - Tombol aksi simpan/batal berada di footer yang sticky di bawah.
- **Di Layar Tablet/Desktop (`≥ md`):** Merender `<Dialog>` dari `@/components/ui/dialog` terpusat di tengah layar.

---

### 4.2 Transformasi Tabel Transaksi Ritase (`/trips`)

#### A. Tampilan Desktop & Tablet (`hidden md:table`):
Tetap mempertahankan `<Table>` 11 kolom yang ada saat ini dengan pembungkus `overflow-x-auto` dan penyesuaian ukuran teks.

#### B. Tampilan Ponsel (`block md:hidden` — `TripMobileCard`):
Setiap baris ritase dirender sebagai kartu terisolasi dengan struktur visual:

```text
┌─────────────────────────────────────────────────────────────┐
│ [No. Order #1042]               [Badge Truk: W 8187 UA]     │
│ 📅 12 Sep 2026 ➔ 13 Sep 2026 (Bongkar)                      │
│ 📍 REMBANG — ARIES PUTRA BETON                              │
├──────────────────────────────┬──────────────────────────────┤
│ Tonase Muat / Bongkar:       │ Tarif Dasar:                 │
│ 31.50 ton / 31.20 ton        │ Rp 125.000 / ton             │
├──────────────────────────────┼──────────────────────────────┤
│ Omset Bruto:                 │ Uang Sangu Supir:            │
│ Rp 3.900.000                 │ Rp 2.028.000                 │
├──────────────────────────────┴──────────────────────────────┤
│ Estimasi Laba Ritase:        Rp 1.837.000 (Hijau Tebal)     │
├─────────────────────────────────────────────────────────────┤
│ [Badge Fee DO: Lunas] [Badge Insentif]    [Tombol Ubah ✏️]   │
└─────────────────────────────────────────────────────────────┘
```

- **Aksi Cepat:** Mengetuk tombol *Ubah* membuka dialog status pembayaran fee DO dan insentif supir secara langsung.

---

### 4.3 Transformasi Tabel Biaya Truk (`/expenses`)

#### A. Tampilan Ponsel (`ExpenseMobileCard`):
- **Header:** Tanggal transaksi + Badge Truk (`W 8187 UA` / `H 8133 OF`) + Badge Kategori (`Servis`, `Onderdil`, `BBM`, dll.).
- **Body:** Deskripsi pengeluaran + Lokasi nota/bengkel.
- **Footer:** Nominal biaya utama + Biaya admin perbankan (jika ada) dengan tipografi tegas.

---

### 4.4 Transformasi Tabel Master Referensi Tarif (`/rates`)

#### A. Tampilan Ponsel (`RateMobileCard`):
- **Header:** Nama Kota + Badge Klien (`Semen Indonesia`, `Semen Bima`, `Indocement Grobogan`).
- **Body:** Destinasi pabrik/batching plant.
- **Nilai:** Tarif dasar per ton + Persentase sangu supir + Tonase standar acuan (31 ton).
- **Aksi:** Tombol edit tarif langsung di dalam kartu.

---

### 4.5 Optimasi Dashboard & Visualisasi Grafik

1. **SectionCards (KPI Keuangan):**
   - Di mobile: `grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4` (2 kartu per baris, bukan 1 kolom tinggi, sehingga menghemat guliran layar ponsel).
   - Ikon diperkecil proporsional (`size-8` di mobile, `size-10` di desktop).
2. **ChartAreaInteractive (Grafik Ritase Harian):**
   - Ketinggian grafik diatur adaptif: `h-[240px] sm:h-[300px] lg:h-[350px]`.
   - Tooltip dioptimalkan untuk sentuhan jari (*touch-enabled*).
3. **DashboardRouteChart (Tren Rute Teratas):**
   - Di mobile: Menampilkan Top 5 rute teratas dengan tinggi baris yang proporsional dan teks kota yang terpotong bersih (*truncated*) dengan tooltip info lengkap.
4. **ExpensesCategoryChart (Komposisi Pengeluaran):**
   - Di ponsel: Diagram donat berada di atas (`height={220}`) dan daftar rincian persentase kategori di bawahnya dengan format baris ringkas.
5. **MaintenanceRemindersWidget (Jadwal Servis & Pajak):**
   - Di ponsel: Item pengingat diatur fleksibel; status badge (🔴 Overdue / 🟡 Mendekat) dan teks sisa hari tidak terhimpit judul jadwal.

---

### 4.6 Optimasi Halaman Bagi Hasil Pemodal (`/profit-sharing`)

1. **PartnerProfitSharingView (Tampilan Khusus Investor):**
   - Kartu dividen all-time investor: `p-4 sm:p-6` dengan nominal besar yang mudah dibaca di layar HP.
   - Grid kartu periode: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
2. **PeriodCard & PeriodDetailSheet:**
   - Di dalam kartu periode, indikator 4 angka (Laba Bruto, Laba Dibagi, Take Home, Jumlah Investor) diatur menjadi `grid-cols-2` di ponsel.
   - Tombol "Cetak / PDF" tetap mudah diakses di bagian bawah sheet.

---

## 5. Rencana Pengujian Responsivitas

Pengujian responsivitas akan divalidasi menggunakan simulator viewport browser pada 3 dimensi utama:

| Dimensi Viewport | Tipe Layar | Fokus Validasi |
|---|---|---|
| **375 x 667 px / 390 x 844 px** | Mobile (iPhone SE / 14) | - Tidak ada horizontal overflow pada body.<br>- Mobile card list muncul sempurna di `/trips` & `/expenses`.<br>- Form muncul sebagai Bottom Drawer yang lancar.<br>- Keyboard input tidak merusak layout form. |
| **768 x 1024 px / 820 x 1180 px** | Tablet (iPad Mini / Air) | - Sidebar icon-collapsible berfungsi normal.<br>- KPI card terbagi rapi 2 kolom.<br>- Tabel tabular tampil proporsional tanpa kolom bertumpuk. |
| **1440 x 900 px** | Desktop (MacBook / Monitor) | - Tata letak 4 kolom KPI, sidebar penuh, tabel data 11 kolom leluasa. |

---

## 6. Transisi Menuju Eksekusi

Setelah dokumen spesifikasi desain ini disetujui:
1. Tahap **/scaffold-brainstorm** dinyatakan selesai.
2. Langkah berikutnya adalah menjalankan **/scaffold-plan** untuk memecah arsitektur responsivitas ini menjadi tugas-tugas teknis atomik berbasis pengujian (TDD) sebelum mulai mengedit kode.
