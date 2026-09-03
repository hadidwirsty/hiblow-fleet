# Rencana Aplikasi HI-Blow Fleet (Versi 1)
## Dokumen 2: Daftar Fitur & Prioritas (MoSCoW)

Dokumen ini memetakan seluruh fitur yang direncanakan berdasarkan skala prioritas setelah mendapatkan konfirmasi dari Mas Hafidz:
- **Must Have (Wajib Ada):** Syarat mutlak agar aplikasi bisa dipakai menggantikan Excel.
- **Should Have (Sangat Penting):** Fitur pelengkap utama yang disepakati penting (Bagi Hasil, Akses Investor, Cetak/Export).
- **Could Have (Bagus Kalau Ada):** Fitur pelengkap tambahan jika waktu pengerjaan memungkinkan.
- **Won't Have (Ditunda Dulu):** Fitur yang sudah disepakati untuk TIDAK dikerjakan pada versi pertama ini.

---

### 1. Wajib Ada (Must Have) — Fondasi Utama Pengganti Excel

| No | Nama Fitur | Deskripsi Singkat (Bahasa Awam) | Manfaat Nyata | Status Review |
|---|---|---|---|---|
| 1.1 | **Input Ritase / Order Truk** | Form input transaksi harian per truk (tanggal order, tanggal bongkar, tujuan, tarif, tonase muat & bongkar). | Menggantikan sheet *Masuk W8187UA* & *Masuk H8133OF*. | [x] Disetujui |
| 1.2 | **Tarif & Sangu Otomatis (Auto-Fill)** | Saat pilih kota dan tujuan pabrik, tarif per ton dan nominal sangu supir langsung terisi otomatis. | Tidak perlu bolak-balik buka lembar tarif dan tidak ada salah ketik harga. | [x] Disetujui |
| 1.3 | **Kalkulasi Otomatis per Rit** | Menghitung otomatis: Omset, sangu supir (aturan maks 31 ton), insentif supir (Rp 35.000), fee pihak ketiga (DO), potongan khusus Grobogan/LJU, dan sisa profit. | Bebas dari kesalahan rumus hitung kalkulator manual. | [x] Disetujui |
| 1.4 | **Input Biaya / Pengeluaran Truk** | Form catat nota pengeluaran per truk: tanggal, jenis biaya (servis, sparepart, dll), nominal, biaya admin bank, dan lokasi. | Menggantikan sheet *Keluar W8187UA* & *Keluar H8133OF*. | [x] Disetujui |
| 1.5 | **Dashboard Pendapatan & Laba Bulanan** | Tampilan ringkasan bulanan: Total omset, total sangu, total biaya bengkel, dan sisa laba bersih (bisa lihat per truk atau gabungan). | Tahu kondisi untung-rugi usaha secara instan tanpa rekap manual. | [x] Disetujui |
| 1.6 | **Sistem Login Akun (Multi-User)** | Masuk menggunakan email/username dan password yang aman, bisa dibuka dari laptop maupun HP. | Data keuangan aman, tidak bisa diakses orang luar. | [x] Disetujui |

---

### 2. Sangat Penting (Should Have) — Analisis, Bagi Hasil & Laporan Cetak

| No | Nama Fitur | Deskripsi Singkat (Bahasa Awam) | Manfaat Nyata | Status Review |
|---|---|---|---|---|
| 2.1 | **Perhitungan Bagi Hasil Akhir Bulan** | Fitur pilih rentang tanggal (default akhir bulan), tarik data uang masuk berdasarkan **Tanggal Bongkar**, potong biaya & komisi 5%, lalu bagi ke daftar investor. | Menggantikan sheet *Bagi Hasil* yang selama ini rumit disalin tiap bulan. | [x] Disetujui |
| 2.2 | **Pemisahan Hak Akses Khusus Investor** | Investor punya akun sendiri yang jika dibuka HANYA menampilkan lembar bagi hasil milik mereka saja (tidak bisa lihat nota bengkel detail). | Menjaga privasi operasional internal tapi tetap transparan ke pemodal. | [x] Disetujui |
| 2.3 | **Fitur Cetak & Export Laporan (PDF / Excel)** | Tombol untuk mencetak langsung atau mendownload rekap bulanan dan lembar bagi hasil ke format PDF/Excel resmi. | Memudahkan arsip fisik dan pengiriman laporan via WhatsApp. | [x] Disetujui (Wajib Ada) |
| 2.4 | **Pengelompokan Biaya per Kategori** | Diagram/grafik pengeluaran: Berapa persen biaya untuk servis mesin, ban, sparepart, uang makan, cicilan, dan admin. | Memudahkan evaluasi truk mana yang boros biaya bengkel. | [x] Disetujui |
| 2.5 | **Tren Omset per Rute & Klien** | Laporan rute mana yang paling sering jalan (misal Semen Indonesia vs Semen Bima) dan mana yang menyumbang laba tertinggi. | Membantu keputusan pemilihan muatan/orderan ke depan. | [x] Disetujui |
| 2.6 | **Pencatatan Status Pembayaran DO Pihak Ketiga** | Kolom catatan apakah fee pihak ketiga (misal Mas Mawan / SILOG) dan insentif sudah lunas dibayar atau belum. | Kontrol utang-piutang DO pihak ketiga tetap rapi dan tidak terlewat. | [x] Disetujui |

---

### 3. Bagus Kalau Ada (Could Have) — Tambahan Opsional

| No | Nama Fitur | Deskripsi Singkat (Bahasa Awam) | Manfaat Nyata | Status Review |
|---|---|---|---|---|
| 3.1 | **Pengingat Servis Rutin / Pajak Truk** | Pengingat sederhana di layar dashboard jika sudah mendekati jatuh tempo ganti oli atau pajak STNK/KIR truk. | Mencegah armada mogok atau kena denda uji KIR. | [ ] Opsional |

---

### 4. Ditunda Dulu (Won't Have) — Tidak Masuk Versi 1

| No | Fitur yang DITUNDA | Alasan Mengapa Ditunda di Versi 1 | Status |
|---|---|---|---|
| 4.1 | **Aplikasi Khusus Supir di HP** | Supir cukup fokus menyetir dan membawa fisik surat jalan/nota. Mengurangi risiko salah input di lapangan. | Ditunda |
| 4.2 | **Peta / Pelacakan Truk GPS Langsung di Web** | Aplikasi GPS IDTrack yang sudah ada sudah cukup bagus dan tidak perlu dibuat ulang di sini. | Ditunda |
| 4.3 | **Menu Tambah/Kurang Unit Truk Mandiri** | Armada saat ini tetap 2 unit. Membuat menu armada fleksibel hanya membuang waktu pengerjaan. | Ditunda |
| 4.4 | **Koneksi Otomatis ke Bank / Cek Saldo Otomatis** | Memerlukan izin perbankan resmi yang rumit dan berbayar mahal; transfer manual via m-banking tetap cara paling aman. | Ditunda |
| 4.5 | **Sistem Akuntansi Neraca / Buku Besar Pajak Formal** | Usaha ini butuh ringkasan arus kas riil yang cepat dipahami, bukan laporan akuntansi formal perusahaan terbuka. | Ditunda |
