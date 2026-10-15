# Modul Perpajakan & Pembukuan Usaha Transportasi PT HW Trans — Design Document

**Tanggal:** 2026-10-14  
**Status:** Approved by User  
**Penulis:** Antigravity AI & Muhammad Hadid Wiransetyo  
**Konteks Bisnis:** PT Hadya Wiran Trans (HW Trans)  

---

## 1. Ringkasan Eksekutif

Modul **Perpajakan & Pembukuan Usaha Transportasi** adalah fitur pelaporan fiskal dan simulasi pajak komparatif yang dirancang khusus untuk operasional armada truk tangki tronton Hi-Blow PT HW Trans. Modul ini menyajikan laporan laba rugi usaha transportasi berstandar akuntansi operasional riil serta menyandingkan **3 skema komparasi perhitungan perpajakan resmi Indonesia** secara berdampingan:

1. **Skema 1: PPh Final UMKM 0.5% (PP 55/2022)** berbasis Total Omset Bruto (bulanan dan tahunan).
2. **Skema 2: Norma Penghitungan Penghasilan Neto (NPPN 29% + PPh Fasilitas 11%)** berbasis peredaran bruto jasa angkutan darat barang.
3. **Skema 3: Pembukuan Riil Usaha Transportasi (Laba Bersih Riil + PPh Fasilitas 11%)** setelah dikurangi seluruh beban operasional riil (sangu, solar, tol, insentif, servis bengkel, potongan pabrik) serta koreksi penurunan omset 12.5%.

Modul ini secara otomatis menganalisis dan merekomendasikan skema mana yang paling hemat kas (*cash saving*) bagi PT HW Trans, memperhitungkan kredit pajak PPh 1% yang telah dipotong langsung oleh pabrik semen, serta menyediakan fitur **Cetak Laporan PDF Resmi** dan **Ekspor Excel (.xlsx)** untuk keperluan arsip manajemen maupun pelaporan SPT oleh akuntan/konsultan pajak.

---

## 2. Tujuan & Kriteria Sukses

### Tujuan
- Memberikan transparansi fiskal dan pembukuan komprehensif bagi pengelola armada (Muhammad Hafidz Wirandryo & Muhammad Hadid Wiransetyo).
- Membantu manajemen memilih strategi perpajakan legal yang paling efisien dan meminimalkan beban kas perusahaan.
- Mengintegrasikan data ritase operasional ([`trips`](file:///Users/hadidwirsty/Project/hiblow-fleet/db/schema/trips.ts)) dan pengeluaran armada ([`expenses`](file:///Users/hadidwirsty/Project/hiblow-fleet/db/schema/expenses.ts)) menjadi satu laporan fiskal terpadu tanpa entri data ulang.

### Kriteria Sukses
- [ ] Tersedia pure domain calculator di `domain/calculators/tax-accounting.ts` dengan 100% test coverage.
- [ ] Tersedia halaman `/taxes` dengan filter Tahun dan Bulan (termasuk opsi Rekapitulasi Seluruh Tahun).
- [ ] Menampilkan 3 kartu komparasi visual dengan indikator *"Paling Hemat Kas"*.
- [ ] Menampilkan tabel Laporan Pembukuan Fiskal Usaha Transportasi berstruktur rapi (Pendapatan, Koreksi Penurunan Omset 12.5%, Beban Langsung, Beban Bengkel/OPEX, Laba Usaha, dan Pajak Terutang).
- [ ] Menampilkan rekapitulasi Kredit Pajak PPh 1% dari bukti potong pabrik semen non-Grobogan.
- [ ] Fitur Ekspor Excel (.xlsx) dan Cetak PDF laporan pembukuan perpajakan.
- [ ] Seluruh copywriting UI 100% Bahasa Indonesia baku.

---

## 3. Formula Matematika & Aturan Bisnis

### 3.1 Data Dasar (Aggregated Metrics)
Dari rentang tanggal bongkar ritase (`unloadingDate`) atau tanggal pengeluaran (`expenseDate`) pada periode terpilih:
- **Omset Bruto ($\text{OB}$)**: $\sum \text{trips.omset}$
- **Penurunan Omset 12.5% ($\text{PO}$)**: $\operatorname{ROUND}(\text{OB} \times 0.125, 2)$
- **Omset Neto ($\text{ON}$)**: $\text{OB} - \text{PO}$
- **Sangu Supir ($\text{SS}$)**: $\sum \text{trips.sangu}$ *(all-in solar, tol, makan)*
- **Insentif Supir ($\text{IS}$)**: $\sum \text{trips.incentivePaid}$
- **Fee DO Pihak Ketiga ($\text{FD}$)**: $\sum \text{trips.thirdPartyFee}$
- **Potongan Operasional Pabrik ($\text{PP}$)**: $\sum (\text{trips.deduction2PctLju} + \text{trips.tax1Pct})$
- **Beban Bengkel & Operasional Kantor ($\text{BO}$)**: $\sum (\text{expenses.amount} + \text{expenses.adminFee})$ *(mengecualikan kategori `'DP/Cicilan'` yang merupakan belanja modal)*
- **Kredit Pajak PPh 1% Pabrik ($\text{KP}$)**: $\sum \text{trips.tax1Pct}$

---

### 3.2 Tiga Skema Perhitungan Pajak

#### Skema 1: PPh Final UMKM 0.5% (PP 55/2022)
- **Dasar Pengenaan Pajak (DPP)**: $\text{Omset Bruto}$
- **Tarif**: $0.5\%$ ($0.005$)
- **Pajak Terutang**:
  $$\text{Pajak}_{\text{Skema 1}} = \operatorname{ROUND}(\text{Omset Bruto} \times 0.005)$$
- **Kredit Pajak**: Tidak berlaku (karena PPh Final).
- **Sisa Setoran Pajak**: $\text{Pajak}_{\text{Skema 1}}$
- **Laba Usaha Bersih Setelah Pajak**: $\text{Laba Usaha Riil} - \text{Pajak}_{\text{Skema 1}}$

#### Skema 2: Norma Penghitungan Penghasilan Neto (NPPN 29% + PPh Fasilitas 11%)
- **Dasar Pengenaan Pajak (DPP)**: Omset Bruto $\times$ Tarif Norma 29%
  $$\text{Penghasilan Neto Norma} = \operatorname{ROUND}(\text{Omset Bruto} \times 0.29)$$
- **Tarif PPh Badan Fasilitas Pasal 31E**: $11\%$ (50% $\times$ tarif normal 22%)
- **Pajak Terutang Bruto**:
  $$\text{Pajak}_{\text{Skema 2 (Bruto)}} = \operatorname{ROUND}(\text{Penghasilan Neto Norma} \times 0.11)$$
- **Kredit Pajak**: Memperhitungkan bukti potong PPh 1% pabrik non-Grobogan ($\text{KP}$).
- **Pajak Kurang / (Lebih) Bayar**:
  $$\text{Sisa Setoran}_{\text{Skema 2}} = \text{Pajak}_{\text{Skema 2 (Bruto)}} - \text{KP}$$
- **Laba Usaha Bersih Setelah Pajak**: $\text{Laba Usaha Riil} - \text{Pajak}_{\text{Skema 2 (Bruto)}}$

#### Skema 3: Pembukuan Riil Usaha Transportasi (Laba Bersih Riil + PPh Fasilitas 11%)
- **Total Beban Operasional Riil**:
  $$\text{Total Beban} = \text{SS} + \text{IS} + \text{FD} + \text{PP} + \text{BO}$$
- **Laba Usaha Riil Sebelum Pajak (EBT)**:
  $$\text{Laba Usaha Riil} = \text{ON} - \text{Total Beban} = (\text{OB} - \text{PO}) - \text{Total Beban}$$
- **Dasar Pengenaan Pajak (DPP Fiskal)**:
  $$\text{DPP}_{\text{Riil}} = \max(0, \text{Laba Usaha Riil})$$
- **Tarif PPh Badan Fasilitas Pasal 31E**: $11\%$ (50% $\times$ 22%)
- **Pajak Terutang Bruto**:
  $$\text{Pajak}_{\text{Skema 3 (Bruto)}} = \operatorname{ROUND}(\text{DPP}_{\text{Riil}} \times 0.11)$$
- **Kredit Pajak**: Memperhitungkan bukti potong PPh 1% pabrik non-Grobogan ($\text{KP}$).
- **Pajak Kurang / (Lebih) Bayar**:
  $$\text{Sisa Setoran}_{\text{Skema 3}} = \text{Pajak}_{\text{Skema 3 (Bruto)}} - \text{KP}$$
- **Laba Usaha Bersih Setelah Pajak**: $\text{Laba Usaha Riil} - \text{Pajak}_{\text{Skema 3 (Bruto)}}$

---

### 3.3 Analisis Efisiensi & Rekomendasi Pintar (*Smart Recommendation*)
Sistem membandingkan nilai kewajiban kas riil dari ketiga skema:
$$\text{Beban Kas}_{\text{Skema 1}} = \text{Pajak}_{\text{Skema 1}}$$
$$\text{Beban Kas}_{\text{Skema 2}} = \max(0, \text{Sisa Setoran}_{\text{Skema 2}})$$
$$\text{Beban Kas}_{\text{Skema 3}} = \max(0, \text{Sisa Setoran}_{\text{Skema 3}})$$

Skema dengan beban kas terendah ditetapkan sebagai **Skema Paling Efisien**, dan sistem menghitung selisih penghematan nominal terhadap skema lainnya:
$$\text{Penghematan Kas} = \max(\text{Beban Kas}) - \min(\text{Beban Kas})$$

---

## 4. Arsitektur Komponen & Struktur File

```text
hiblow-fleet/
├── domain/calculators/
│   ├── tax-accounting.ts              # Pure calculator logika pembukuan & 3 skema pajak
│   └── __tests__/
│       └── tax-accounting.test.ts      # Unit tests pure calculation
├── features/taxes/
│   ├── taxes.queries.ts               # Query agregasi data ritase & beban dari DB
│   ├── taxes.export.ts                # Generator Excel & CSV Laporan Pembukuan Fiskal
│   ├── tax-comparison-cards.tsx       # 3 kartu komparasi visual (UMKM 0.5%, Norma 29%, Riil 11%)
│   ├── tax-accounting-table.tsx       # Tabel Laporan Pembukuan Usaha Transportasi
│   ├── tax-withholding-card.tsx       # Kartu rekapitulasi kredit pajak PPh 1% pabrik
│   ├── taxes-filter-bar.tsx           # Filter Tahun & Bulan interaktif
│   └── __tests__/
│       ├── taxes-queries.test.ts      # Test agregasi data DB
│       └── taxes-export.test.ts       # Test format ekspor Excel
├── app/(dashboard)/
│   └── taxes/
│       └── page.tsx                   # Server Component halaman Perpajakan & Pembukuan
└── components/layout/
    └── sidebar-nav-main.tsx           # Navigasi sidebar menu Perpajakan (/taxes)
```

---

## 5. Antarmuka Pengguna (UI/UX)

1. **Header Dasbor Perpajakan**:
   - Judul: *"Perpajakan & Pembukuan Usaha Transportasi"*
   - Deskripsi: *"Laporan pembukuan laba rugi usaha dan analisis simulasi perpajakan PT Hadya Wiran Trans."*
   - Tombol Aksi: *"Cetak Laporan"* (Window Print / PDF) & *"Ekspor Excel"* (`.xlsx`).
2. **Filter Periode**:
   - Pilihan Tahun (2025, 2026, dst.) dan Pilihan Bulan (Januari s.d. Desember atau *Rekap Seluruh Tahun*).
3. **Hero Section — 3 Kartu Komparasi Pajak**:
   - **Kartu 1 (Skema UMKM 0.5%)**: Menampilkan DPP Omset, Tarif 0.5%, Pajak Terutang, Badge status efisiensi.
   - **Kartu 2 (Skema Norma 29% x 11%)**: Menampilkan Laba Norma 29%, Tarif 11%, Pajak Bruto, Kredit PPh 1%, Sisa Setoran.
   - **Kartu 3 (Skema Pembukuan Riil 11%)**: Menampilkan Laba Riil, Penurunan Omset 12.5%, Pajak Bruto, Kredit PPh 1%, Sisa Setoran.
4. **Banner Rekomendasi Pintar (Smart Recommendation)**:
   - Alert bernuansa hijau emerald yang merangkum rekomendasi skema terbaik beserta nominal penghematan kas riil.
5. **Tabel Pembukuan Fiskal Usaha Transportasi**:
   - **Bagian I: Pendapatan Usaha** (Omset Bruto, Koreksi Penurunan Omset 12.5%, Omset Neto).
   - **Bagian II: Beban Langsung Ritase** (Sangu Supir, Insentif Ritase, Biaya DO Mas Wawan, Potongan Pabrik).
   - **Bagian III: Beban Operasional Truk** (Servis, Onderdil, Administrasi, KIR, STNK, dll.).
   - **Bagian IV: Laba Usaha Sebelum Pajak**.
   - **Bagian V: Perbandingan Beban Pajak & Laba Bersih Setelah Pajak (EAT)** untuk masing-masing skema.

---

## 6. Out of Scope (Batasan)
- Modul ini **tidak mengunggah SPT secara otomatis ke DJP Online** (e-Filing). Fungsi modul adalah menyediakan lembar pembukuan dan kalkulasi yang akurat dan siap saji bagi konsultan pajak / akuntan perusahaan.
- Tidak mengubah skema database transaksional yang sudah ada (`trips` dan `expenses`), melainkan murni memanfaatkan agregasi data yang telah tersimpan.

---

## 7. Open Questions & Resolusi
- *Pertanyaan:* Apakah penurunan omset 12.5% juga berlaku pada Skema Norma 29%?  
  *Resolusi:* Pada Skema Norma, persentase norma 29% sudah merupakan tarif tunggal penghasilan neto yang ditetapkan pemerintah langsung terhadap omset bruto setahun ($29\% \times \text{Omset Bruto}$). Penurunan omset 12.5% diterapkan pada Skema Pembukuan Riil sebagai faktor depresiasi / koreksi penurunan peredaran usaha angkutan riil.
