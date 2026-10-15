# Peningkatan Terpadu Modul Perpajakan & Operasional Armada PT HW Trans — Design Document

**Tanggal:** 2026-10-15  
**Status:** Approved by User  
**Penulis:** Antigravity AI & Muhammad Hadid Wiransetyo  
**Konteks Bisnis:** PT Hadya Wiran Trans (HW Trans)  

---

## 1. Ringkasan Eksekutif

Dokumen spesifikasi ini menetapkan rancangan teknis untuk **Paket Peningkatan Bernilai Tambah Tinggi** pada ekosistem operasional dan perpajakan armada truk tronton Hi-Blow PT HW Trans. Paket ini mencakup 3 pilar fungsional terpadu:

1. **Widget Estimasi Pajak di Dasbor Utama (`/dashboard`):**  
   Menampilkan kartu sorotan finansial (*Financial Highlight Card*) tepat di bawah 4 KPI Cards utama di Dasbor Operasional. Kartu ini menyajikan estimasi beban kas pajak tahun berjalan, peredaran bruto, rekomendasi skema terhemat (UMKM 0.5%, Norma 29%, atau Pembukuan Riil 11%), serta tombol pintas langsung menuju lembar pembukuan detail di `/taxes`.
2. **Pencatatan Nomor & Tanggal Bukti Potong PPh 1% per Ritase (`/trips`):**  
   Menyediakan field opsional pada form pencatatan dan edit ritase surat jalan (`taxWithholdingNumber` dan `taxWithholdingDate`) khusus untuk rute dari pabrik semen yang memotong PPh 1% (Semen Indonesia Tuban, Semen Indonesia Rembang, dan Solusi Bangun Indonesia Tuban). Kolom ini ditampilkan pada tabel ritase, detail sheet surat jalan, dan lembar lampiran ekspor Excel.
3. **Grafik Tren Pembukuan Antar-Tahun (*Year-over-Year Trend*) di `/taxes`:**  
   Menyajikan visualisasi grafik interaktif perbandingan kinerja finansial multi-tahun (2024, 2025, 2026) yang membandingkan Omset Bruto, Omset Neto (setelah koreksi 12.5%), Total Beban Operasional Riil, Laba Usaha Riil, serta Komparasi Beban Kas Setoran Pajak.

---

## 2. Tujuan & Kriteria Sukses

### Tujuan
- Meningkatkan visibilitas manajemen atas posisi kewajiban kas pajak langsung dari halaman utama `/dashboard` tanpa perlu navigasi berulang.
- Mengakomodasi penatausahaan dokumen pajak fisik/elektronik (Bupot PPh 23 dari pabrik semen) agar mempermudah rekonsiliasi dan pelaporan SPT Tahunan oleh konsultan pajak.
- Memberikan wawasan historis multi-tahun (*Year-over-Year*) bagi pengelola armada untuk menentukan strategi fiskal jangka panjang.

### Kriteria Sukses
- [ ] Tersedia migrasi database Drizzle yang menambahkan kolom `tax_withholding_number` dan `tax_withholding_date` pada tabel `trips`.
- [ ] Tersedia komponen `DashboardTaxWidget` di `/dashboard` dengan status efisiensi kas dan link cepat ke `/taxes`.
- [ ] Form tambah/edit ritase (`trip-form-dialog.tsx`) menyediakan input nomor dan tanggal bupot opsional secara kondisional (khusus rute pabrik non-Grobogan).
- [ ] Tabel ritase dan sheet detail ritase menampilkan informasi bukti potong jika telah diisi.
- [ ] Tersedia komponen grafik tren tahunan `TaxYoyChart` di halaman `/taxes` menggunakan Recharts.
- [ ] Ekspor Excel (`taxes.export.ts`) Sheet 3 mencantumkan nomor & tanggal bukti potong per transaksi ritase.
- [ ] Seluruh pengujian otomatis lulus (`pnpm test`), typecheck bersih (`pnpm typecheck`), dan linting bersih (`pnpm lint`).
- [ ] Seluruh copywriting antarmuka pengguna 100% Bahasa Indonesia baku murni.

---

## 3. Perubahan Skema Basis Data (Database Migration)

Tabel `trips` ditambahkan 2 kolom opsional (*nullable*):

```typescript
// db/schema/trips.ts
export const trips = pgTable("trips", {
  // ... kolom yang sudah ada ...

  // Bukti Potong Pajak PPh 1% (Khusus SI Tuban, SI Rembang, SBI Tuban)
  taxWithholdingNumber: varchar("tax_withholding_number", { length: 100 }),
  taxWithholdingDate: date("tax_withholding_date"),
})
```

### Validasi Skema Zod (`features/trips/trips.schema.ts`):
```typescript
taxWithholdingNumber: z
  .string()
  .max(100, "Nomor bukti potong maksimal 100 karakter")
  .optional()
  .nullable(),
taxWithholdingDate: z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .optional()
  .nullable(),
```

---

## 4. Arsitektur Komponen & Alur Data

```text
hiblow-fleet/
├── db/schema/trips.ts                     # Tambah taxWithholdingNumber & taxWithholdingDate
├── features/
│   ├── dashboard/
│   │   ├── dashboard-tax-widget.tsx       # Widget kartu sorotan pajak tahun berjalan
│   │   └── dashboard.queries.ts           # Integrasi ringkasan pajak dasbor
│   ├── trips/
│   │   ├── trip-form-dialog.tsx           # Input kondisional nomor & tanggal bupot
│   │   ├── trip-detail-sheet.tsx          # Tampilan detail bukti potong
│   │   ├── trips-table.tsx                # Kolom / tooltip bukti potong
│   │   └── trips.schema.ts                # Validasi zod form ritase
│   └── taxes/
│       ├── tax-yoy-chart.tsx              # Grafik komparatif tahunan Recharts
│       ├── taxes.queries.ts               # Query agregasi multi-tahun (getTaxYoyData)
│       ├── taxes.export.ts                # Update Sheet 3 ekspor excel dengan nomor bupot
│       └── taxes-view.tsx                 # Integrasi TaxYoyChart di halaman /taxes
├── app/(dashboard)/
│   ├── dashboard/page.tsx                 # Penempatan DashboardTaxWidget di bawah KPI cards
│   └── taxes/page.tsx                     # Server data fetching multi-tahun
```

---

## 5. Rincian Fitur & Antarmuka Pengguna (UI/UX)

### 5.1 Widget Estimasi Pajak di Dasbor Utama (`/dashboard`)
- **Posisi:** Terletak tepat di bawah 4 KPI Cards (Total Ritase, Total Tonase, Omset Kotor, Sangu Supir), sebelum grafik aktivitas armada harian.
- **Tampilan Visual:**
  - Header: Ikon persentase, judul *"Estimasi Posisi Pajak Tahun Berjalan"*, dan badge tahun (misal: *"Tahun 2026"*).
  - Metrik Utama: Total Peredaran Bruto tahun berjalan dan Estimasi Sisa Setoran Kas Terendah.
  - Rekomendasi Pintar: Badge hijau emerald *"Paling Hemat Kas: Skema UMKM 0.5%"* (atau skema pemenang lainnya) beserta nilai potensi penghematan.
  - Aksi: Tombol *"Buka Laporan Pembukuan Fiskal"* dengan tautan langsung ke `/taxes?year=2026`.

### 5.2 Pencatatan Bukti Potong PPh 1% pada Ritase (`/trips`)
- **Perilaku Kondisional:**
  - Jika rute berasal dari pabrik non-Grobogan (SI Tuban, SI Rembang, SBI Tuban), muncul collapsible section atau card *"Informasi Bukti Potong Pajak (Opsional)"*.
  - Jika rute berasal dari Indocement Grobogan (bebas PPh 1%), seksi ini disembunyikan secara otomatis.
- **Field Formulir:**
  - *Nomor Bukti Potong PPh 1%*: Teks input (contoh placeholder: `BP-SI-2026-00123`).
  - *Tanggal Bukti Potong*: Input date picker / teks tanggal `YYYY-MM-DD`.
- **Tampilan di Detail Sheet & Tabel:**
  - Di sheet detail ritase: Menampilkan kartu kecil bernuansa emerald dengan nomor dan tanggal bupot jika sudah diisi, atau status *"Belum diinput"* jika kosong.

### 5.3 Grafik Tren Pembukuan Antar-Tahun (*Year-over-Year*) di `/taxes`
- **Posisi:** Ditampilkan di bagian bawah halaman `/taxes`, tepat setelah tabel laporan pembukuan fiskal.
- **Komponen Visual:**
  - Judul: *"Tren Pembukuan & Efisiensi Pajak Antar-Tahun"*
  - Deskripsi: *"Komparasi peredaran bruto, laba operasional, dan beban kas pajak tahun 2024 s.d. 2026."*
  - Recharts Bar/Area Chart yang menyandingkan:
    - Batang 1: Peredaran Bruto (Omset)
    - Batang 2: Total Beban Operasional Riil
    - Batang 3: Laba Usaha Riil
    - Garis/Titik Aksen: Sisa Setoran Kas Pajak Efisien
  - Tabel ringkas perbandingan 3 tahun di bawah grafik.

### 5.4 Pembaruan Ekspor Excel (`taxes.export.ts`)
- Pada Sheet 3 (*Rekap Bukti Potong PPh 1%*):
  - Menambahkan tabel rincian transaksi per ritase yang memuat kolom:
    1. Nomor Surat Jalan
    2. Tanggal Bongkar
    3. Pabrik Asal Muat
    4. Omset Ritase (Rp)
    5. Potongan PPh 1% (Rp)
    6. Nomor Bukti Potong (Bupot)
    7. Tanggal Bukti Potong

---

## 6. Strategi Pengujian (Testing Strategy)

1. **Database Schema & Actions:**
   - [Unit] Validasi schema Zod `trips.schema.ts` menerima kolom `taxWithholdingNumber` dan `taxWithholdingDate` (string valid maupun null/undefined).
   - [Integration] Server action `createTrip` dan `updateTrip` berhasil menyimpan dan memperbarui kedua field bukti potong.
2. **Dashboard Tax Widget:**
   - [Unit] Helper widget mengembalikan status rekomendasi skema, omset tahunan, dan sisa setoran kas yang akurat.
3. **Multi-Year Queries & YoY Chart:**
   - [Integration] Query `getTaxYoyData([2024, 2025, 2026])` mengembalikan metrik finansial teragregasi per tahun secara konsisten.
   - [Unit] Transformasi data chart memetakan angka finansial dengan format Rupiah yang tepat.
4. **Excel Export:**
   - [Unit] `formatTaxAccountingForExcel` menyertakan rincian nomor dan tanggal bukti potong pada baris Sheet 3.

---

## 7. Batasan (Out of Scope)
- Sistem tidak melakukan integrasi API langsung ke server e-Bupot DJP Online (penginputan nomor bupot bersifat manual berdasarkan dokumen yang diterima dari pabrik semen).
- Tidak memodifikasi formula dasar tarif pajak yang sudah disetujui pada dokumen spesifikasi sebelumnya.
