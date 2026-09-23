# Standarisasi Desain Antarmuka Menu Manajemen Ritase — Design Document

**Dokumen Spesifikasi:** `docs/specs/2026-09-23-trips-ui-standardization-design.md`  
**Fitur:** Refaktor dan Penyelarasan Desain Menu Manajemen Ritase (`/trips`) mengacu pada Standar Referensi Tarif (`/rates`)  
**Tanggal:** 23 September 2026  
**Status:** Approved by User  

---

## 1. Ringkasan
Dokumen ini mendefinisikan rancangan perombakan antarmuka pengguna (*UI/UX refactoring*) pada modul Manajemen Ritase (`/trips`). Tujuannya adalah menyelaraskan bahasa visual, hierarki informasi, dan ergonomi interaksi modul ritase agar memenuhi standar desain modern yang telah diterapkan pada modul Referensi Tarif (`/rates`). Refaktor ini mencakup peremajaan Header Halaman, modernisasi KPI Summary Cards, pembongkaran pembungkus tabel kaku menjadi *Search Bar* instan dan Kapsul Filter terpadu, integrasi komponen *Empty State* `@/components/ui/empty` untuk mobile dan desktop, serta paginasi mandiri dengan pilihan jumlah baris per halaman (*page size* 10, 25, 50).

---

## 2. Tujuan & Kriteria Sukses

### 2.1 Tujuan
1. Menghadirkan konsistensi visual 100% antara modul operasional armada (Pencatatan Ritase) dan modul referensi master data (Referensi Tarif).
2. Mempercepat pencarian data surat jalan bagi admin melalui kolom pencarian teks instan tanpa jeda *loading*.
3. Merapikan filter Armada, Periode Bulan, Periode Tahun, dan Status Fee DO ke dalam satu kapsul terpadu yang hemat ruang dan responsif.
4. Memberikan umpan balik visual yang ramah dan profesional saat data tidak ditemukan atau belum tercatat (*Empty State*).

### 2.2 Kriteria Sukses (Acceptance Criteria)
- [ ] **AC-1 (Header Halaman):** Header halaman `app/(dashboard)/trips/page.tsx` memiliki ikon tema truk `RiTruckLine` dalam wadah `bg-primary/10`, badge counter jumlah surat jalan dinamis, subjudul yang jelas, serta tombol Ekspor (`TripsExportButton`) yang berdampingan dengan tombol Tambah Ritase di kanan atas. Teks tanggal statis ("Juni 2026") dihapus.
- [ ] **AC-2 (KPI Summary Cards):** Komponen `TripsSummary` menggunakan kontainer `rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xs hover:shadow-md` dengan ring ikon tematik, badge metrik pill di sudut kanan atas, angka besar tabular, dan garis pemisah footer dengan teks status berwarna.
- [ ] **AC-3 (Pelepasan Card Pembungkus):** Tabel ritase tidak lagi dibungkus oleh komponen `<Card>` kaku, melainkan menggunakan section layout terbuka yang diawali dengan heading section "Daftar Surat Jalan & Ritase".
- [ ] **AC-4 (Search Bar Instan):** Tersedia kolom pencarian teks di sisi kiri toolbar dengan ikon `RiSearchLine` yang mampu menyaring nomor surat jalan, kota tujuan, nama proyek/tujuan bongkar, armada/supir, dan pihak ketiga pemegang DO secara instan di sisi klien.
- [ ] **AC-5 (Kapsul Filter Terpadu):** Filter Armada, Bulan, Tahun, dan Status Fee DO disatukan ke dalam satu wadah kapsul ramping `bg-muted/40 rounded-xl` bersama opsi pilihan jumlah baris (*Page Size*: 10, 25, 50 baris) dan tombol Reset Filter (dengan ikon `RiCloseLine`).
- [ ] **AC-6 (Empty State Standar):** Menggunakan komponen `@/components/ui/empty` pada tampilan kartu mobile maupun tabel desktop (`colSpan={10}`), membedakan kondisi pencarian/filter nihil (tombol "Reset Filter") dengan kondisi database kosong (tombol "Tambah Ritase Baru").
- [ ] **AC-7 (Paginasi Mandiri):** Footer paginasi berada di bawah tabel dalam kontainer mandiri `rounded-xl border bg-card p-3 shadow-xs` menampilkan rentang data dan kontrol navigasi halaman.
- [ ] **AC-8 (Penyelarasan Kartu Mobile):** Komponen `TripMobileCard` menampilkan badge plat armada yang khas, informasi rute dengan pin lokasi, grid 2x2 tarif & muatan berbingkai rapi, highlight laba ritase, serta tombol pengubah status Fee DO yang responsif.
- [ ] **AC-9 (Integritas Pengujian & Standar Kode):** Seluruh 39 file test suite Vitest (176 tests) tetap berstatus PASS, `pnpm typecheck` bersih, dan seluruh teks antarmuka 100% menggunakan Bahasa Indonesia yang baku.

---

## 3. Pendekatan yang Dipilih

Dipilih **Pendekatan 1: Client-Side Instant Filtering**:
- **Arsitektur Data:** Komponen Server Component `app/(dashboard)/trips/page.tsx` memuat data ritase, data referensi tarif, dan ringkasan metrik. Dataset diteruskan ke Client Component `TripsTable`.
- **Eksekusi Filter:** Seluruh filter teks (kata kunci pencarian), filter Armada (`truckId`), filter Bulan (`month`), filter Tahun (`year`), dan filter Status Fee DO (`ALL | PENDING | PAID`) dievaluasi secara instan di memori browser via hook `useMemo`.
- **Rasional:** Skala armada HW Trans bersifat tetap 2 unit (*static fleet*), dengan total ratusan transaksi per tahun. Pengolahan di sisi klien memberikan latensi 0ms (*instant feel*), bebas kedipan *re-render* server, serta identik dengan arsitektur `RatesTable`.

---

## 4. Design Decisions

1. **Relokasi Tombol Ekspor ke Header Halaman:**
   - *Alasan:* Menjaga toolbar filter di atas tabel tetap bersih, fokus pada pencarian dan penyaringan data, serta menempatkan aksi tingkat halaman (*page-level actions*) di posisi yang seragam di sudut kanan atas.
2. **Kapsul Filter Bersatu (*Unified Filter Capsule*):**
   - *Alasan:* Menggantikan grid filter yang terpecah-pecah dengan kontainer terpadu ber-background `bg-muted/40` dan tombol reset yang hanya muncul saat ada filter aktif, menghemat ruang vertikal dan lebih rapi di layar mobile hingga desktop.
3. **Komponen `@/components/ui/empty` untuk Empty State:**
   - *Alasan:* Menghilangkan divergensi desain empty state. Komponen `Empty` dari `@/components/ui/empty.tsx` memiliki tipografi, ikon media, dan tombol aksi terpusat yang sudah teruji estetis pada Referensi Tarif.
4. **Paginasi dengan Pilihan Page Size (10, 25, 50 baris):**
   - *Alasan:* Memberikan fleksibilitas bagi admin yang ingin meninjau data dalam jumlah banyak sekaligus tanpa harus berpindah-pindah halaman secara berulang.

---

## 5. Out of Scope (Batasan Iterasi)
- Perubahan skema database PostgreSQL atau penambahan kolom baru pada tabel `trips` (tidak ada perubahan skema DB).
- Perubahan logika matematika finansial (omset, sangu supir, dan laba kotor ritase tetap mematuhi formula resmi di `domain/calculators/`).
- Modifikasi dialog formulir input/edit ritase (`TripFormDialog`) di luar penyesuaian pemicu pembukaan dari empty state.

---

## 6. Open Questions
*Tidak ada pertanyaan terbuka.* Seluruh pertanyaan klarifikasi mengenai Search Bar, kapsul filter, penempatan tombol ekspor, dan opsi page size telah disepakati bersama pengguna.
