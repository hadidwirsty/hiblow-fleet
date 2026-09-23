# Plan: Penyempurnaan Tampilan Modal Tambah & Edit Ritase Sesuai Standar Referensi Tarif

Dokumen rencana kerja ini menguraikan langkah-langkah standardisasi antarmuka modal **Tambah Ritase / Edit Ritase (`TripFormDialog`)** dengan mengacu langsung pada desain modal **Tambah Referensi Tarif (`RateFormDialog`)**.

---

## Ringkasan Masalah & Kebutuhan

1. **Lebar Dialog Terlalu Sempit di Tablet & Desktop:**
   - Di `trip-form-dialog.tsx`, deklarasi `className="max-w-2xl sm:p-6"` tertimpa oleh kelas bawaan `sm:max-w-sm` (384px) dari `DialogContent`. Akibatnya, pada tablet (768px) dan desktop (1440px), modal tampil memanjang ke bawah dan sangat sempit.
   - Modal acuan (`RateFormDialog`) menggunakan `className="sm:max-w-lg"` (512px) yang proporsional, lapang, dan pas.
2. **Layout Field Berdesakan:**
   - Input Tarif/Ton, Tonase Bongkar, dan Tonase Muat dijejalkan dalam 3 kolom (`sm:grid-cols-3`) di dalam modal sempit sehingga label dan teks saling bertabrakan. Layout perlu distrukturkan ulang menjadi 2 kolom (`sm:grid-cols-2`) yang seimbang.
3. **Header Icon Badge Belum Seragam:**
   - Modal acuan membungkus ikon di dalam badge kontainer hijau rounded `size-7 bg-primary/10 text-primary rounded-lg`.
4. **Ukuran dan Lebar Tombol Aksi (Button Footer) Belum Standar:**
   - Modal ritase saat ini menggunakan tombol kecil `size="sm"` yang terpojok di kanan bawah.
   - Modal acuan menggunakan standar `size="lg"` dengan lebar `w-1/2 sm:w-36` (responsif di mobile dan presisi di desktop).
5. **Dukungan Mode Create & Edit:**
   - Menjadikan `TripFormDialog` serbaguna dengan prop `mode?: "create" | "edit"` dan `trip?: TripRecord` agar teks judul, deskripsi, dan tombol submit dapat menyesuaikan secara kontekstual (*"Tambah Ritase Baru"* / *"Simpan Ritase"* vs *"Edit Ritase"* / *"Simpan Perubahan"*).

---

## Acceptance Criteria

1. [x] Dialog modal `TripFormDialog` memiliki lebar proporsional `sm:max-w-lg` di tablet dan desktop, menimpa batasan `sm:max-w-sm`.
2. [x] Header dialog menampilkan ikon truk dalam kontainer badge `size-7 bg-primary/10 text-primary rounded-lg` dengan judul dan deskripsi yang rapi.
3. [x] Seluruh input formulir berpasangan tersusun dalam 2 kolom seimbang (`grid grid-cols-1 gap-3 sm:grid-cols-2`) tanpa elemen yang terhimpit.
4. [x] Tombol aksi di footer menggunakan standar tombol modal: `size="lg"`, kelas responsif `w-1/2 sm:w-36`, dengan tombol Batal (`variant="outline"`) dan Simpan (`variant="default"`).
5. [x] Komponen mendukung prop `mode?: "create" | "edit"` dan `trip?: TripRecord` untuk kemudahan penggunaan di seluruh bagian aplikasi.
6. [x] Seluruh tes otomatis (Vitest, TypeScript, ESLint, Prettier) lulus 100% tanpa error atau peringatan.

---

## Rincian Tugas Eksekusi (Atomic Tasks)

### Task 1: Standarisasi Header, Lebar Dialog (`sm:max-w-lg`), dan Props Mode
**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Test: `features/trips/__tests__/trip-form-dialog.test.tsx`

**Requirements:**
- Tambahkan prop `mode?: "create" | "edit"` dan `trip?: TripRecord` pada `TripFormDialogProps`.
- Atur `className="sm:max-w-lg"` pada komponen `ResponsiveDialog`.
- Bungkus ikon `<RiTruckLine>` di dalam kontainer badge `size-7 bg-primary/10 text-primary rounded-lg`.
- Sediakan default values yang terisi otomatis (pre-filled) saat `mode === "edit"` dan `trip` tersedia.

**Step 1: Write failing test (RED)**
Buat tes di `features/trips/__tests__/trip-form-dialog.test.tsx` yang memverifikasi bahwa dialog me-render judul, deskripsi, dan tombol yang sesuai dengan mode `create` dan `edit`.

**Step 2: Verify test fails**
Jalankan: `pnpm vitest run features/trips/__tests__/trip-form-dialog.test.tsx`
Harapan: FAIL (karena prop `mode` dan `trip` belum diimplementasikan).

**Step 3: Write minimal implementation (GREEN)**
Perbarui interface `TripFormDialogProps`, pasang `mode` & `trip`, update `ResponsiveDialog` header dan `className="sm:max-w-lg"`.

**Step 4: Verify test passes & Refactor**
Jalankan: `pnpm vitest run features/trips/__tests__/trip-form-dialog.test.tsx`
Harapan: PASS.

---

### Task 2: Restrukturisasi Tata Letak Form Grid 2 Kolom Seimbang
**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Test: `features/trips/__tests__/trip-form-dialog.test.tsx`

**Requirements:**
- Ubah baris Tarif / Ton, Tonase Bongkar, dan Tonase Muat dari 3 kolom sempit menjadi 2 kolom (`sm:grid-cols-2`) yang proporsional.
- Tata letak:
  - Row 1: Unit Truk (kiri) & Nomor Order (kanan) `sm:grid-cols-2`
  - Row 2: Tanggal Order (kiri) & Tanggal Bongkar (kanan) `sm:grid-cols-2`
  - Row 3: Rute / Tujuan Pabrik (Combobox, 1 kolom full width)
  - Row 4: Tarif / Ton (Rp) (kiri) & Tonase Bongkar (Ton) (kanan) `sm:grid-cols-2`
  - Row 5: Tonase Muat (Opsional) `sm:grid-cols-2`
  - Row 6: Card Sangu Supir / Uang Jalan (desain serasi, badge status, helper acuan sistem)
  - Row 7: Card Kalkulasi Otomatis (Live) (Omset, Sangu, Laba)
  - Row 8: Fee Pihak Ketiga / DO (kiri) & Nama Pihak Ketiga (kanan) `sm:grid-cols-2`
  - Row 9: Status Pembayaran Fee DO (kiri) & Status Insentif Supir (kanan) `sm:grid-cols-2`
  - Row 10: Catatan Tambahan (Textarea)

**Step 1: Write failing test (RED)**
Tambahkan skenario pengujian input pada form grid dan kalkulasi nilai otomatis.

**Step 2: Verify test fails**
Jalankan test terkait.

**Step 3: Write minimal implementation (GREEN)**
Terapkan struktur grid baru yang rapi di `trip-form-dialog.tsx`.

**Step 4: Verify test passes & Refactor**
Jalankan test dan pastikan semua lulus.

---

### Task 3: Penyetaraan Standar Tombol Footer (Standard Button Dialog)
**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`

**Requirements:**
- Sesuaikan footer tombol dengan standar `RateFormDialog`:
  - Kontainer: `flex items-center justify-end gap-2 border-t px-2 pt-3 sm:px-0`
  - Tombol Batal: `type="button"`, `variant="outline"`, `size="lg"`, `className="w-1/2 sm:w-36"`
  - Tombol Simpan: `type="submit"`, `size="lg"`, `className="w-1/2 sm:w-36"`
  - Label dinamis: *"Simpan Ritase"* (create) atau *"Simpan Perubahan"* (edit), dan *"Menyimpan..."* saat loading.

**Step 1: Write test (RED/GREEN)**
Verifikasi atribut ukuran tombol (`size="lg"`) dan teks tombol simpan.

**Step 2: Implementasi perubahan di `trip-form-dialog.tsx`**
Perbarui footer button.

**Step 3: Verifikasi test passes**
Jalankan test.

---

### Task 4: Verifikasi Regresi Menyeluruh & QA
**Requirements:**
- Jalankan test suite lengkap `pnpm test`.
- Jalankan pemeriksaan tipe `pnpm typecheck`.
- Jalankan linting `pnpm lint`.
- Format kode dengan `pnpm run format`.
- Perbarui dokumentasi walkthrough.
