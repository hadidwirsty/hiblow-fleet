# Rencana Implementasi: Perbaikan Responsivitas Menu Manajemen Ritase (Mobile & Tablet)

**Dokumen Rencana:** `docs/plans/2026-09-23-trips-responsive-enhancement-18.md`  
**Fitur / Scope:** Peningkatan Desain Responsif Menu Manajemen Ritase (`/trips`) pada Tampilan Mobile (< 640px) dan Tablet (768px - 1024px): Tombol Header Flex-Col, Search Bar Fleksibel, Kapsul Filter Vertikal/Adaptif, dan Pencegahan Teks Terpotong  
**Tanggal:** 23 September 2026  
**Referensi:** Hasil pengujian manual pengguna & screenshot responsive inspector  
**Status:** Selesai & Terverifikasi (Vitest 41 files passed, Typecheck 0 errors, ESLint 0 errors)  

---

## 1. Konteks & Analisis Masalah (Forensic Visual Gap Analysis)

Berdasarkan hasil uji coba mandiri dan 4 tangkapan layar (*screenshot*) yang diberikan oleh pengguna:
1. **Layar Mobile (360px – 425px - Screenshot 1):**
   - **Tombol Header Terhimpit:** Tombol *Ekspor Data* dan *Tambah Ritase Baru* dipaksa berdampingan secara horizontal (`flex-row`), menyebabkan teks terdesak dan area sentuh (*touch target*) kurang optimal untuk jempol.
   - **Dropdown Filter Terpotong Parah:** Keempat dropdown filter (Armada, Bulan, Tahun, Status DO) dipaksa berada dalam 1 baris kapsul horizontal yang hanya memiliki lebar ~380px. Akibatnya masing-masing dropdown menciut menjadi ~70-80px dan seluruh labelnya terpotong elipsis (`Semua A...`, `Semua B...`, `Semua T...`, `Semua S...`).
2. **Layar Tablet (768px – Screenshot 2):**
   - **Search Bar Terdesak Ekstrem:** Kolom *Search Bar* diletakkan sebaris dengan 5 dropdown filter (`sm:flex-row sm:items-center sm:justify-between`). Karena 5 dropdown filter memakan ruang ~600px, kolom *Search Bar* tertekan menjadi kotak kecil sempit yang hanya menyisakan ikon pencarian tanpa ruang teks yang memadai.
3. **Layar Laptop & Desktop (1024px – 1440px - Screenshot 3 & 4):**
   - Filter dropdown pada lebar 1024px masih sedikit sempit untuk label panjang seperti *"Semua Status DO"*.

---

## 2. Kriteria Penerimaan & Gap Analysis

### Acceptance Criteria (AC):
1. **AC-1 (Header Actions Responsif):** Pada layar mobile (< sm / < 640px), tombol *Tambah Ritase Baru* dan *Ekspor Data* tersusun secara vertikal (`flex-col`) dengan lebar penuh `w-full` sehingga nyaman ditekan jempol. Pada layar tablet & desktop (`sm:flex-row`), tombol kembali berdampingan di kanan atas secara proporsional.
2. **AC-2 (Search Bar Bebas Hambatan):** Pada layar mobile dan tablet, kolom *Search Bar* instan memiliki baris tersendiri dengan lebar penuh (`w-full`), menjamin ruang ketik yang lega dan tidak terhimpit oleh grup filter.
3. **AC-3 (Kapsul Filter Vertikal / Adaptif di Mobile):** Pada layar mobile (< sm / < 640px), filter tersusun secara vertikal (`flex-col`) atau grid 2 kolom yang lega, di mana setiap dropdown memiliki ruang teks yang cukup sehingga label (*"Semua Armada"*, *"Semua Bulan"*, *"Semua Tahun"*, *"Semua Status DO"*) terbaca 100% utuh tanpa elipsis.
4. **AC-4 (Layout Tablet & Desktop Proporsional):** Pada layar tablet (>= 640px / 768px) dan desktop, toolbar filter tersusun rapi dengan *flex-wrap* seimbang, tidak menghimpit search bar, dan memiliki ukuran dropdown yang cukup untuk teks labelnya.
5. **AC-5 (Tombol Reset Jelas):** Tombol Reset Filter mudah diakses baik pada mode vertikal mobile maupun horizontal desktop.
6. **AC-6 (Integritas Pengujian & Build):** Seluruh test suite (Vitest 41 files, 181+ tests) tetap lulus 100%, `pnpm typecheck` bersih, dan `pnpm lint` bersih.

---

## 3. Rincian Tugas Atomik (Berdasar TDD)

### Task 1: Responsivitas Header Actions di `page.tsx` & `trips-export-button.tsx`
**Files:**
- Modify: `app/(dashboard)/trips/page.tsx`
- Modify: `features/trips/trips-export-button.tsx`
- Modify: `features/trips/trip-form-dialog.tsx`

**Requirements:**
- **Acceptance Criteria:**
  1. Kontainer tombol aksi di header menggunakan `flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5`.
  2. Tombol `TripsExportButton` memiliki lebar `w-full sm:w-auto`.
  3. Tombol `TripFormDialog` memiliki lebar `w-full sm:w-auto`.
  4. Urutan visual di mobile: Tombol utama *"Tambah Ritase Baru"* berada di atas, dan tombol *"Ekspor Data"* berada di bawahnya (atau sebaliknya yang ergonomis).
- **Functional Requirements:**
  - Fungsi klik tombol dan dropdown ekspor tetap berfungsi normal.
- **Non-Functional Requirements:**
  - Zero layout shift saat transisi breakpoint mobile ke desktop.

**Step 1: Write verification test (RED)**
Verifikasi struktur class responsif dan pastikan `pnpm typecheck` memeriksa kesesuaian props.

**Step 2: Minimal implementation (GREEN)**
Perbarui kontainer tombol aksi di `app/(dashboard)/trips/page.tsx` dan pastikan tombol di dalamnya menggunakan `w-full sm:w-auto`.

**Step 3: Verify test passes & Refactor**
Jalankan `pnpm typecheck` dan `pnpm test`.

---

### Task 2: Restrukturisasi Layout Toolbar & Search Bar di `trips-table.tsx`
**Files:**
- Modify: `features/trips/trips-table.tsx`

**Requirements:**
- **Acceptance Criteria:**
  1. Toolbar pencarian dan filter diubah menjadi layout bertingkat cerdas:
     - **Desktop lebar (>= xl):** Search bar di sisi kiri (`max-w-md`), grup filter di sisi kanan (`flex-row items-center`).
     - **Tablet & Mobile (< xl):** Search bar berada di baris pertama selebar penuh (`w-full`), dan grup filter berada di baris kedua.
  2. Input search bar selalu memiliki ruang teks yang cukup (tidak pernah menciut menjadi kotak kecil di tablet 768px).
- **Functional Requirements:**
  - Pencarian teks instan tetap bekerja mulus tanpa latensi.

**Step 1: Write failing/verification check (RED)**
Periksa layout toolbar di breakpoint 768px.

**Step 2: Minimal implementation (GREEN)**
Perbarui struktur pembungkus toolbar di `features/trips/trips-table.tsx` dengan kelas:
`flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between`.

**Step 3: Verify test passes & Refactor**
Jalankan: `pnpm test features/trips/__tests__/trips-filter.test.ts`.

---

### Task 3: Kapsul Filter Vertikal / Adaptif di Layar Mobile (`trips-table.tsx`)
**Files:**
- Modify: `features/trips/trips-table.tsx`

**Requirements:**
- **Acceptance Criteria:**
  1. Pada layar mobile (< sm / < 640px):
     - Kapsul filter membungkus filter dengan layout vertikal `flex flex-col gap-2 w-full p-2.5`.
     - Setiap `SelectTrigger` memiliki lebar penuh `w-full h-8 text-xs`, sehingga teks label tidak lagi terpotong elipsis.
     - Setiap dropdown dilengkapi label kontekstual yang jelas di dalamnya (misal: *"Semua Armada"*, *"Semua Bulan"*, *"Semua Tahun"*, *"Semua Status DO"*).
     - Tombol Reset Filter tampil dengan lebar penuh `w-full h-8` di bagian bawah kapsul saat ada filter aktif.
  2. Pada layar tablet & desktop (>= sm / >= 640px):
     - Kapsul filter beralih kembali menjadi kontainer horizontal ramping `sm:flex-row sm:items-center sm:gap-1.5 sm:w-auto sm:p-1`.
     - Dropdown memiliki lebar spesifik (`sm:w-36`, `sm:w-32`, dll.) dan pilihan baris (*Page Size*) tampil.
- **Functional Requirements:**
  - Seluruh filter (Armada, Bulan, Tahun, Status DO, Page Size, Reset) mempertahankan state dan logika client-side yang reaktif.

**Step 1: Write failing test (RED)**
Tambahkan pengujian di `features/trips/__tests__/trips-filter.test.ts` untuk memastikan tidak ada logika filter yang rusak.

**Step 2: Minimal implementation (GREEN)**
Implementasikan layout adaptif `flex-col sm:flex-row` pada kapsul filter di `features/trips/trips-table.tsx`.

**Step 3: Verify test passes & Refactor**
Jalankan: `pnpm test features/trips/__tests__/trips-filter.test.ts`.

---

### Task 4: Verifikasi Menyeluruh & Inspeksi Multi-Breakpoint
**Files:**
- Run full verification

**Requirements:**
- Jalankan `pnpm test` (seluruh 41 test files, 181+ tests lulus 100%).
- Jalankan `pnpm typecheck` (0 errors).
- Jalankan `pnpm lint` (0 errors, 0 warnings).
- Sediakan panduan verifikasi manual multi-breakpoint (Mobile 375px-425px, Tablet 768px, Desktop 1024px+) pada artefak `walkthrough.md`.

---

## 4. Rangkuman Eksekusi
Rencana perbaikan responsivitas ini dirancang dalam 4 tugas atomik yang menyelesaikan langsung masalah visual yang ditemukan pada pengujian manual pengguna.
