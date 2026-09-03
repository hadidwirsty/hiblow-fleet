# Rencana Aplikasi HI-Blow Fleet (Versi 1)
## Dokumen 1: Ruang Lingkup & Batasan (Scope & Non-Goals)

Dokumen ini disusun sebagai kesepakatan awal mengenai apa saja yang **akan dibuat** dan apa yang **sengaja ditunda** untuk versi pertama aplikasi pencatatan armada Truk HI-Blow. Tujuannya agar aplikasi cepat selesai, tepat sasaran, dan langsung bisa menggantikan spreadsheet Excel yang dipakai saat ini tanpa membuang waktu pada fitur yang belum mendesak.

---

### 1. Asumsi Awal (Mohon Dikoreksi jika Keliru)

Sebelum mulai, berikut adalah hal-hal yang kami jadikan pegangan:

1. **Armada Tetap 2 Unit:** Aplikasi ini dikunci khusus untuk 2 unit truk yang sedang berjalan, yaitu **W 8187 UA** dan **H 8133 OF**. Belum dibutuhkan menu untuk menambah atau menghapus unit truk baru.
2. **Pencatatan Terpusat:** Yang menginput data adalah pengelola/admin (Mas Hafidz). Supir truk tidak perlu pegang akun atau login ke sistem.
3. **Rumus Mengikuti Excel Lama:** Sistem hitungan omset, sangu supir, potongan pihak ketiga, dan bagi hasil akan meniru persis pola perhitungan di file Excel `PERHITUNGAN_HIBLOW_HW_Trans.xlsx` yang selama ini sudah berjalan.
4. **Bisa Diakses Online:** Aplikasi berbasis website, bisa dibuka dari browser laptop di rumah/kantor maupun lewat handphone kapan saja.

---

### 2. Yang AKAN Dibuat di Versi Pertama (In-Scope)

Fokus utama versi 1 adalah memastikan pekerjaan catat-mencatat dan hitung-menghitung bulanan menjadi jauh lebih cepat, rapi, dan minim salah hitung:

* [x] **Pencatatan Ritase / Surat Jalan (Pemasukan):**
  * Input data muatan per truk: Tanggal order, tanggal bongkar, kota & pabrik tujuan, tarif per ton, serta tonase muat dan bongkar.
  * **Otomatis isi tarif & sangu:** Begitu tujuan dipilih (misal: *Aries Putra Beton Semarang*), tarif dan sangu supir otomatis muncul tanpa perlu ketik manual atau hafal tarif.
  * **Hitung otomatis:** Omset, sangu supir (dengan batas maksimal 31 ton dan pembulatan ke ribuan), insentif supir (Rp 35.000/rit), fee pihak ketiga (DO), dan sisa profit per rit langsung terhitung otomatis.
* [x] **Pencatatan Biaya Operasional (Pengeluaran):**
  * Catat biaya harian per truk: Tanggal, jenis pengeluaran (servis/bengkel, sparepart, selang, GPS, cicilan/DP truk, dll), nominal uang, biaya admin transfer, dan kota/lokasi perbaikan.
* [x] **Tabel Daftar Tarif Acuan:**
  * Halaman daftar harga rute untuk klien Semen Indonesia (SI), Semen Bima (SBI), dan Indocement Grobogan agar mudah diperbarui jika sewaktu-waktu ada penyesuaian tarif dari pabrik.
* [x] **Laporan & Dashboard Bulanan:**
  * Ringkasan performa per bulan: Berapa total omset, berapa sangu yang sudah keluar, total biaya servis/operasional, dan berapa laba bersih yang didapat (bisa dilihat per truk maupun gabungan keduanya).
* [x] **Perhitungan Bagi Hasil Investor:**
  * Menu khusus untuk menghitung bagi hasil: Pilih tanggal awal dan akhir periode, sistem otomatis menarik total pemasukan dan pengeluaran, memotong komisi pengelola 5%, lalu membagi sisa laba ke masing-masing investor sesuai modalnya (misal: bagian 50jt/580jt, 75jt/580jt, dsb).
* [x] **Keamanan & Akun Pengguna:**
  * Login dengan kata sandi.
  * Akun Admin (Mas Hafidz) bisa input, edit, dan hapus data.
  * Akun Investor (jika dibutuhkan) hanya bisa melihat ringkasan pembagian hasil bagian miliknya tanpa bisa mengutak-atik data transaksi harian.

---

### 3. Yang TIDAK Dibuat Dulu di Versi Pertama (Non-Goals)

Fitur-fitur di bawah ini sengaja ditiadakan di tahap awal agar pengerjaan tidak molor dan tidak membingungkan pengguna:

* [ ] **Aplikasi Khusus Supir di HP:** Supir tidak perlu download aplikasi atau absen online. Bukti surat jalan dan nota tetap diserahkan ke admin seperti biasa.
* [ ] **Pelacakan Posisi Truk (GPS Tracking Live):** Aplikasi ini murni untuk pencatatan operasional & keuangan. Untuk melihat posisi truk di peta, tetap menggunakan aplikasi IDTrack yang sudah terpasang di HP.
* [ ] **Menu Tambah/Hapus Truk Dinamis:** Belum ada menu untuk mendaftarkan truk ke-3, ke-4, dst. Jika nanti armada bertambah, penyesuaian akan dilakukan di tahap berikutnya.
* [ ] **Sistem Pembukuan Akuntansi Rumit:** Tidak ada pencatatan neraca keuangan rumit, jurnal debit/kredit ala akuntan, atau depresiasi nilai aset. Konsepnya tetap sesederhana arus kas pemasukan dan pengeluaran seperti di Excel.
* [ ] **Koneksi Otomatis ke Bank (Mutasi Otomatis):** Transfer uang ke supir atau pembayaran nota bengkel tetap dilakukan via m-banking masing-masing seperti biasa, lalu status "Sudah Dibayar" dicatat di aplikasi.
* [ ] **Kirim Pesan WhatsApp Otomatis:** Belum ada fitur bot kirim WA otomatis ke supir atau investor saat data diinput. Laporan bagi hasil sementara dikirim manual (bisa lewat foto layar / export).
