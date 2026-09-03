# Rencana Aplikasi HI-Blow Fleet (Versi 1)
## Dokumen 3: Pertanyaan Validasi Data & Aturan Bisnis

Dokumen ini berisi hasil konfirmasi 4 pertanyaan penting oleh Mas Hafidz (Pengelola) sebelum pengerjaan aplikasi dimulai. 

Hasil validasi ini menjadi landasan pasti untuk logika perhitungan dan hak akses sistem.

---

### Pertanyaan 1: Potongan Pajak & Potongan Khusus (Pajak 1%, Pot 2% LJU, 5% UJ GRB)

* **Pertanyaan:**  
  Di file Excel saat ini, ada kolom untuk `PAJAK 1%`, `POT 2% LJU`, dan `5% UJ GRB`. Pada data historis, kolom ini kadang terisi (misalnya di truk H 8133 OF ada potongan 1%), namun di banyak baris lain dibiarkan kosong.
  1. Apakah potongan-potongan ini hanya berlaku untuk muatan dari pabrik/klien tertentu saja?
  2. Bagaimana aturan pastinya: Apakah potongan ini mengurangi omset kotor, atau mengurangi uang sangu supir, atau mengurangi profit akhir perusahaan?
* **Kenapa ini penting ditanyakan:**  
  Supaya aplikasi bisa otomatis tahu kapan harus memunculkan potongan ini dan tidak keliru memotong uang sangu supir atau keuntungan akhir.
* **Jawaban & Keputusan Mas Hafidz:**  
  1. **Khusus order Grobogan / LJU (PT Lintas Jaya Utama).** Untuk rute selain Grobogan/LJU, kolom potongan tidak aktif/kosong.
  2. **Mengurangi Profit Perusahaan.** Sangu supir tetap dihitung normal dari tonase dan tarif acuan; potongan pajak/LJU ini murni memotong keuntungan bersih ritase.

---

### Pertanyaan 2: Aturan Periode Perhitungan Bagi Hasil Investor

* **Pertanyaan:**  
  Di sheet *Bagi Hasil*, rentang tanggalnya bervariasi.
  1. Apakah penentuan tanggal tutup buku bagi hasil ini selalu manual, atau ada tanggal patokan rutin?
  2. Jika ada transaksi di batas periode, apakah patokannya **Tanggal Bongkar** atau **Tanggal Pembayaran Cair**?
* **Kenapa ini penting ditanyakan:**  
  Supaya sistem bisa langsung menyarankan tanggal default tutup buku otomatis dan menarik data transaksi yang tepat tanpa ada yang terlewat.
* **Jawaban & Keputusan Mas Hafidz:**  
  1. **Pola Rutin: Akhir Bulan.** Standar periode bagi hasil berjalan dari tanggal 1 sampai akhir bulan kalender (tutup buku tiap akhir bulan).
  2. **Patokan: Tanggal Bongkar.** Transaksi diakui dan ditarik ke dalam periode bagi hasil berdasarkan tanggal selesai bongkar muatan.

---

### Pertanyaan 3: Siapa Saja yang Akan Menggunakan Aplikasi Ini? (Hak Akses)

* **Pertanyaan:**  
  Selain Mas Hafidz (Pengelola) dan pengembang:
  1. Apakah investor (Mbak Alfiah, Mas Dhian) diberi akun login sendiri untuk melihat ringkasan laba di HP?
  2. Apakah ada staf admin kantor lain yang ditugaskan input data?
* **Kenapa ini penting ditanyakan:**  
  Menentukan kompleksitas arsitektur otentikasi dan pembatasan privasi operasional.
* **Jawaban & Keputusan Mas Hafidz:**  
  1. **Investor: Boleh Akses.** Disediakan akun khusus investor dengan hak akses *read-only* (hanya bisa memantau ringkasan bagi hasil porsi modalnya).
  2. **Staf Admin: Tidak Ada.** Input data ritase dan nota pengeluaran dilakukan terpusat oleh Mas Hafidz sendiri.

---

### Pertanyaan 4: Kebutuhan Cetak / Export Laporan (Excel & PDF)

* **Pertanyaan:**  
  Apakah di versi pertama ini dibutuhkan fitur download / cetak laporan resmi ke format Excel atau PDF?
* **Kenapa ini penting ditanyakan:**  
  Menentukan apakah modul generator PDF/Excel perlu masuk ke dalam prioritas pengembangan awal.
* **Jawaban & Keputusan Mas Hafidz:**  
  * **Cetak (Dibutuhkan).** Fitur cetak/export laporan (khususnya rekap bulanan dan lembar bagi hasil periode) wajib disediakan agar mudah dibagikan atau dicetak fisik jika diperlukan.
