# Rencana Implementasi: Refaktor Referensi Tarif & Sangu Supir Fleksibel (Uang Jalan)

**Dokumen Rencana:** `docs/plans/2026-09-21-rates-and-trip-sangu-refactor-15.md`  
**Fitur:** Refaktor Master Referensi Tarif (`/rates`) & Fleksibilitas Input Uang Jalan Supir (`/trips`)  
**Tanggal:** 21 September 2026  
**Status:** Draf untuk Tinjauan Pengguna  

---

## 1. Konteks & Ringkasan Perubahan

Berdasarkan hasil validasi operasional dengan Mas Hafidz dan pengguna:
1. **Pabrik Asal Muat:** Menambahkan field `originPlant` pada data tarif dengan 4 pabrik asal utama:
   - `Semen Indonesia (SI) - Tuban`
   - `Semen Indonesia (SI) - Rembang`
   - `Solusi Bangun Indonesia (SBI) - Tuban`
   - `Indocement - Grobogan`
   *(Sistem bersifat terbuka sehingga pengguna dapat mengetikkan pabrik asal baru kapan saja).*
2. **Format Standar Rute:**  
   `[Pabrik Asal (Nama Pabrik - Kota Asal)] -> [Kota Tujuan] - [Tujuan Bongkar (Proyek / Batching Plant)]`
3. **Fleksibilitas Uang Sangu (Uang Jalan / UJ):**
   - Di master tarif disediakan acuan uang jalan standar (`defaultSangu` / `sanguPercentage`).
   - Di formulir pencatatan ritase (`/trips`), nilai sangu supir **tidak lagi dikunci (read-only)**. Sistem memberikan rekomendasi otomatis saat rute dipilih, namun pengguna **dapat mengubah / mengetik manual nominal UJ riil** (misalnya saat tonase > 31 ton atau rute khusus). Nilai tersebut tersimpan resmi ke transaksi.
4. **Biaya Tol: All-in:**
   - Biaya tol sudah termasuk dalam sangu supir. Tidak ada potongan terpisah yang mengurangi laba perusahaan.

---

## 2. Kriteria Penerimaan & Gap Analysis

### Acceptance Criteria (AC):
1. **AC-1:** Tabel `rate_references` memiliki kolom `origin_plant` (varchar 100) dan `default_sangu` (numeric 14, 2 nullable) untuk menyimpan acuan UJ.
2. **AC-2:** Seluruh data master tarif terisi dengan `originPlant` yang valid dari 4 pabrik acuan.
3. **AC-3:** Formulir input/edit tarif (`rate-form-dialog.tsx`) menyediakan opsi dropdown 4 pabrik asal default serta opsi input teks untuk pabrik asal baru.
4. **AC-4:** Tabel master tarif (`rates-table.tsx`) dan tampilan mobile card (`rate-mobile-card.tsx`) menampilkan rute berformat: `[Pabrik Asal] -> [Kota Tujuan] - [Tujuan Bongkar]`.
5. **AC-5:** Combobox pemilihan rute di modal Order Ritase (`trip-destination-combobox.tsx`) menampilkan format hierarki yang sama dan mendukung pencarian cepat berdasarkan nama pabrik, kota, maupun proyek.
6. **AC-6:** Formulir pencatatan ritase (`trip-form-dialog.tsx`) mengizinkan admin mengisi/mengubah nominal Uang Sangu (UJ) secara manual tanpa ter-reset paksa oleh live calculation, dan menghitung laba bersih secara akurat.
7. **AC-7:** Seluruh test suite (Vitest) lulus 100% tanpa regresi.

---

## 3. Rincian Tugas Atomik (Berdasar TDD)

### Task 1: [x] Pembaruan Skema Database `rate_references` (Completed)
**Files:**
- Modify: `db/schema/rate-references.ts`
- Test: `domain/__tests__/rates-schema.test.ts`

**Requirements:**
- Tambahkan kolom `originPlant`: `varchar("origin_plant", { length: 100 }).notNull().default("Semen Indonesia (SI) - Tuban")`.
- Tambahkan kolom `defaultSangu`: `numeric("default_sangu", { precision: 14, scale: 2 })`.
- Pertahankan kompatibilitas field `city` (sebagai Kota Tujuan) dan `destination` (sebagai Tujuan Bongkar).

**Step 1: Write failing test (RED)**
Menambahkan pengujian validasi Zod schema untuk field `originPlant` dan `defaultSangu` di `domain/__tests__/rates-schema.test.ts`.

**Step 2: Verify test fails**
Jalankan: `pnpm test domain/__tests__/rates-schema.test.ts`  
Ekspektasi: FAIL (property `originPlant` belum dikenal).

**Step 3: Minimal implementation (GREEN)**
Perbarui `db/schema/rate-references.ts` dan `features/rates/rates.schema.ts`.

**Step 4: Verify test passes & Refactor**
Jalankan: `pnpm test domain/__tests__/rates-schema.test.ts`  
Ekspektasi: PASS.

---

### Task 2: [x] Sinkronisasi & Migrasi Data Seeder Master Tarif (Completed)
**Files:**
- Modify: `scripts/sync-csv-to-database.ts`
- Modify: `db/data/rates.json`
- Modify: `db/seed.ts`

**Requirements:**
- Petakan 4 file CSV historis ke `originPlant` yang tepat:
  - `SI Tarif.csv` -> `Semen Indonesia (SI) - Tuban`
  - `SI Rembang.csv` -> `Semen Indonesia (SI) - Rembang`
  - `SBI Tarif.csv` -> `Solusi Bangun Indonesia (SBI) - Tuban`
  - `Indocement Grobogan Tarif.csv` -> `Indocement - Grobogan`
- Perbarui `db/data/rates.json` dengan field `originPlant` dan estimasi `defaultSangu`.
- Jalankan script re-seed untuk mengisi database lokal.

**Step 1: Write verification test (RED)**
Test integrasi di `domain/__tests__/rates-queries.test.ts` memeriksa bahwa daftar tarif memiliki `originPlant` dan tidak kosong.

**Step 2: Verify test fails**
Jalankan: `pnpm test domain/__tests__/rates-queries.test.ts`  
Ekspektasi: FAIL (daftar tarif kosong / belum ada `originPlant`).

**Step 3: Minimal implementation (GREEN)**
Perbarui seeder dan generate ulang `rates.json`, lalu jalankan `pnpm db:seed`.

**Step 4: Verify test passes**
Jalankan: `pnpm test domain/__tests__/rates-queries.test.ts`  
Ekspektasi: PASS (semua query integrasi rates lulus).

---

### Task 3: [x] Pembaruan Server Queries & Filter Pencarian Rates (Completed)
**Files:**
- Modify: `features/rates/rates.queries.ts`
- Test: `domain/__tests__/rates-queries.test.ts`

**Requirements:**
- Update `listRateReferences` agar pencarian (`search`) mencakup `originPlant`.
- Update `getDistinctClients` atau tambahkan `getDistinctOriginPlants` untuk mengembalikan daftar unik pabrik asal.
- Summary agregasi memperhitungkan rute aktif per pabrik asal.

**Step 1: Write failing test (RED)**
Tambahkan skenario pencarian berdasarkan `originPlant` di `rates-queries.test.ts`.

**Step 2: Verify test fails**
Jalankan: `pnpm test domain/__tests__/rates-queries.test.ts`

**Step 3: Minimal implementation (GREEN)**
Perbarui filter `ilike(rateReferences.originPlant, term)` di `rates.queries.ts`.

**Step 4: Verify test passes**
Jalankan: `pnpm test domain/__tests__/rates-queries.test.ts` -> PASS.

---

### Task 4: Pembaruan Formulir Referensi Tarif (`rate-form-dialog.tsx`)
**Files:**
- Modify: `features/rates/rate-form-dialog.tsx`
- Modify: `features/rates/rates.actions.ts`
- Test: `domain/__tests__/rates-actions.test.ts`

**Requirements:**
- Tambahkan field pemilihan **Pabrik Asal** dengan 4 opsi preset (`Semen Indonesia (SI) - Tuban`, `Semen Indonesia (SI) - Rembang`, `Solusi Bangun Indonesia (SBI) - Tuban`, `Indocement - Grobogan`) plus input kustom pabrik baru.
- Label teks bahasa Indonesia yang jelas: *Pabrik Asal*, *Kota Tujuan Bongkar*, *Tujuan Bongkar (Proyek / Batching Plant)*, *Tarif OA per Ton*, *Acuan Uang Jalan (UJ)*.
- Simpan perubahan melalui server actions `createRateReference` dan `updateRateReference`.

**Step 1: Write failing test (RED)**
Test action di `domain/__tests__/rates-actions.test.ts` memverifikasi create/update dengan `originPlant`.

**Step 2: Verify test fails & implement GREEN**
Implementasikan pembaruan di `rates.actions.ts` dan `rate-form-dialog.tsx`.

**Step 3: Verify test passes**
Jalankan: `pnpm test domain/__tests__/rates-actions.test.ts` -> PASS.

---

### Task 5: Pembaruan Tabel Master Tarif & Kartu Mobile (`/rates`)
**Files:**
- Modify: `features/rates/rates-table.tsx`
- Modify: `features/rates/rate-mobile-card.tsx`
- Modify: `features/rates/rates-summary.tsx`

**Requirements:**
- Format kolom Rute:
  - Header badge Pabrik Asal dengan warna pembeda (SI Tuban: Biru, SI Rembang: Hijau, SBI: Indigo, Grobogan: Amber).
  - Teks rute: `[Kota Tujuan] - [Tujuan Bongkar]`.
- Kolom tarif OA dan UJ Standar / Persentase Sangu.
- Tampilan responsif mobile card yang rapi dan mudah dibaca oleh admin operasional di ponsel.

**Step 1: Write test (RED)**
Test render kartu mobile di `domain/__tests__/rate-mobile-card.test.ts`.

**Step 2: Minimal implementation (GREEN)**
Sesuaikan props dan format tampilan pada `rates-table.tsx` dan `rate-mobile-card.tsx`.

**Step 3: Verify test passes**
Jalankan: `pnpm test domain/__tests__/rate-mobile-card.test.ts` -> PASS.

---

### Task 6: Pembaruan Combobox Rute pada Transaksi Ritase (`trip-destination-combobox.tsx`) [SELESAI]
**Files:**
- Modify: `features/trips/trip-destination-combobox.tsx`

**Status:** ✅ Selesai.
- Tampilan combobox telah dimutakhirkan dengan format `[Pabrik Asal] -> [Kota Tujuan] - [Tujuan Bongkar]`.
- Dilengkapi info badge tarif per ton dan nominal acuan UJ (atau persentase sangu).
- Fuzzy search cmdk mencakup nama pabrik asal, kota tujuan, dan proyek bongkar.

---

### Task 7: Fleksibilitas Input Manual Uang Sangu (UJ) pada Formulir Ritase (`trip-form-dialog.tsx`) [SELESAI]
**Files:**
- Modify: `features/trips/trip-form-dialog.tsx`
- Modify: `features/trips/trips.schema.ts`
- Test: `domain/__tests__/trip-form-calculations.test.ts`

**Status:** ✅ Selesai.
- Field Uang Sangu Supir telah diubah menjadi input yang dapat diedit manual dengan proteksi overwrite.
- Otomatis terisi nilai acuan default saat memilih rute (flat nominal default_sangu atau formula persentase).
- Menampilkan status badge `Acuan Sistem` vs `Disesuaikan Manual` dan tombol reset acuan.
- Kalkulasi live laba ritase langsung reaktif memperhitungkan nilai sangu yang sedang aktif diinput.
- Unit test di `trip-form-calculations.test.ts` lulus.

---

### Task 8: Verifikasi Menyeluruh & Uji Coba End-to-End [SELESAI]
**Files:**
- Run: `pnpm test` (39 files, 176 tests PASS)
- Run: `pnpm typecheck` (0 error)
- Run: `pnpm lint` (0 error)

**Status:** ✅ Selesai.
- Seluruh unit & integration test suite 100% lulus.
- Validasi tipe TypeScript dan ESLint bersih.

