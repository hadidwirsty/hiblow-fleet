# Rencana Aplikasi HI-Blow Fleet (Versi 1)
## Dokumen 4: Validasi & Konfirmasi Rumus Perhitungan Tarif & Sangu Supir

Dokumen ini memuat rangkuman aturan baku perhitungan tarif ritase, uang jalan (sangu supir), dan penamaan rute dari 4 sumber data acuan (SI Tuban, SI Rembang, SBI Tuban, dan Indocement Grobogan) untuk modul Referensi Tarif (`/rates`) dan Pencatatan Ritase (`/trips`) di aplikasi HI-Blow Fleet.

---

### A. Temuan Data Acuan & Pemetaan Pabrik Asal

4 Pabrik Asal operasional saat ini:
1. **Semen Indonesia (SI) - Tuban**
2. **Semen Indonesia (SI) - Rembang**
3. **Solusi Bangun Indonesia (SBI) - Tuban**
4. **Indocement - Grobogan**

*(Sistem dirancang terbuka dan dinamis agar dapat ditambah pabrik asal baru di kemudian hari).*

> **Catatan Pemetaan Lokasi:**  
> Kolom bertuliskan **KOTA** pada data acuan Excel/CSV sebelumnya telah diverifikasi seluruhnya merujuk pada **Kota Tujuan Bongkar**.

---

### B. Hasil Validasi Bisnis & Keputusan Implementasi

Berikut adalah status keputusan per 21 September 2026:

#### 1. Skema Penentuan Uang Sangu Supir (Uang Jalan / UJ)
* **Keputusan:** **Fleksibel & Editable Manual.**
* **Mekanisme Sistem:**  
  * Sistem menyediakan nilai estimasi/rekomendasi Uang Jalan awal berdasarkan data master tarif dan tonase muatan.
  * Pada form pencatatan ritase, field **Uang Sangu / UJ tetap dapat diisi atau diubah secara manual** oleh admin agar fleksibel mengakomodasi kondisi riil di lapangan (misalnya saat tonase melebihi 31 ton atau ada kondisi rute tertentu).
  * Nilai akhir yang diinput akan tersimpan sebagai nilai resmi UJ ritase tersebut.

#### 2. Perhitungan Kelebihan / Tambahan Tonase
* **Status:** **Menunggu konfirmasi lebih lanjut dari Mas Hafidz.**
* **Penanganan Sementara:** Nilai tarif tambahan tonase tetap dicatat di master data sebagai referensi, namun tidak mengunci kalkulasi manual di transaksi harian.

#### 3. Biaya Tol & Tambahan Operasional Melintas
* **Keputusan:** **Sangu Supir Bersifat All-in.**
* **Mekanisme Sistem:**  
  * Biaya tol sudah sepenuhnya termasuk di dalam uang sangu/UJ supir.
  * Tidak ada potongan tambahan ataupun klaim reimburse tol terpisah dari kantor yang mengurangi laba bersih ritase.

#### 4. Potongan Khusus Order Grobogan / LJU (PT Lintas Jaya Utama)
* **Status:** **Menunggu konfirmasi lebih lanjut dari Mas Hafidz.**
* **Penanganan Sementara:** Parameter potongan tetap disimpan di data namun formula final akan diaktifkan setelah ada arahan dasar pengali dari Mas Hafidz.

#### 5. Format Standarisasi Penamaan Master Rute
* **Keputusan:** **Disepakati Format Hierarki Jelas.**
* **Format Baku:**  
  **`[Pabrik Asal] -> [Kota Tujuan] - [Tujuan Bongkar / Proyek]`**  
  *Contoh Riil:*
  * `Semen Indonesia (SI) - Tuban -> Semarang - Aries Putra Beton`
  * `Semen Indonesia (SI) - Rembang -> Semarang - PT Ananda Pratama`
  * `Solusi Bangun Indonesia (SBI) - Tuban -> Blora - Kunduran`
  * `Indocement - Grobogan -> Malang - Wagir`

---

### C. Rencana Tindak Lanjut Pembaruan Sistem

1. **Struktur Data Master Tarif (`rate_references`):**
   * Menambahkan field `originPlant` / `origin` (contoh: *"Semen Indonesia (SI) - Tuban"*).
   * Memastikan field tujuan jelas: `destinationCity` (Kota Tujuan) dan `destinationName` (Tujuan Bongkar).
   * Menyimpan nilai acuan UJ Standar.
2. **Antarmuka `/rates` (Referensi Tarif):**
   * Dropdown pemilihan Pabrik Asal dengan 4 opsi default + opsi tambah pabrik baru.
   * Tabel dan card menampilkan label rute lengkap sesuai format baru.
   * Input nilai tarif OA dan acuan UJ.
3. **Antarmuka `/trips` (Pencatatan Ritase):**
   * Combobox rute menampilkan format rute baru yang jelas dan mudah dicari.
   * Field Uang Sangu/UJ terbuka untuk diedit manual oleh admin (dengan nilai default terisi otomatis).
