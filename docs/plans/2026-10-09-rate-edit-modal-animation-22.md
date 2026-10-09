# Implementasi Animasi Modal Ubah Tarif (Edit/Update) Selaras dengan Modal Tambah Tarif (Create)

- **Feature:** Harmonisasi Animasi Transisi Modal Edit/Update Referensi Tarif Pabrik
- **Tanggal:** 2026-10-09
- **Nomor Urut Dokumen:** 22 (`docs/plans/2026-10-09-rate-edit-modal-animation-22.md`)
- **Status Dokumen:** COMPLETED / EXECUTED

---

## 1. Ringkasan & Latar Belakang

Pengguna mencatat bahwa saat membuka modal **Edit / Ubah Tarif** pada modul `/rates`, animasinya saat ini belum sama dengan animasi saat membuka modal **Create / Tambah Tarif**. 

### Analisis Akar Masalah (Root Cause Analysis):
1. **Modal Create (Tambah Tarif)** dirender secara permanen di dalam DOM dengan status siaga `open={false}` (`RateFormDialog` di header `rates/page.tsx` atau empty state `rates-table.tsx`). Saat tombol diklik, state `open` bertransisi dari `false` ke `true`, memicu:
   - **Tampilan Mobile:** Komponen `Drawer` (`@base-ui/react/drawer`) mengeksekusi transisi meluncur naik dari bawah (*slide-up*) dengan durasi 450ms dan efek geser yang mulus.
   - **Tampilan Desktop & Tablet:** Komponen `Dialog` (`@base-ui/react/dialog`) mengeksekusi animasi transisi *fade-in* dan *zoom-in (scale-95 ke scale-100)*.
2. **Modal Edit (Ubah Tarif)** saat ini dibungkus secara kondisional dengan `{editingRate && <RateFormDialog ... />}` di `features/rates/rates-table.tsx`. Akibatnya:
   - Sebelum tombol "Ubah Tarif" diklik, komponen modal edit **belum terpasang (unmounted)** di dalam DOM.
   - Saat tombol diklik, `setEditingRate(rate)` dan `setIsEditOpen(true)` dijalankan bersamaan. Komponen baru dipasang ke DOM langsung dalam status `open={true}`.
   - Karena baru pertama kali terpasang (*initial mount*), browser dan *engine* transisi CSS Base UI melewatkan siklus *enter animation* (`data-starting-style`). Akibatnya di mobile modal edit muncul mendadak tanpa animasi *slide-up* yang anggun, berbeda dengan modal create.

### Solusi Teknis:
1. Memperbolehkan tipe prop `rate?: RateReference | null` pada `RateFormDialog` dan menambahkan mekanisme *stateful caching* (`cachedRate`) agar komponen aman berada di DOM dalam kondisi *standby* tanpa data awal.
2. Memasang `<RateFormDialog mode="edit">` secara permanen di `RatesTable` (menghapus kondisional `{editingRate && ...}`). Dengan cara ini, modal edit selalu siaga di DOM dalam kondisi `open={false}` sehingga transisi pembukaannya 100% identik dengan modal create.
3. Menyempurnakan siklus penutupan (*graceful exit transition*) agar animasi keluar (*slide-down / fade-out*) berjalan tuntas sebelum data dibersihkan.

---

## 2. Gap Analysis (Nouns & Verbs)

### 2.1 Analisis Kata Benda (Nouns / Data Fields)
- `editingRate`: Objek data tarif yang sedang dipilih untuk diedit, bernilai `null` saat modal tertutup.
- `cachedRate`: Referensi data cadangan terakhir di dalam `RateFormDialog` agar formulir tidak kosong saat animasi keluar berlangsung.
- `isEditOpen`: Status boolean kontrol visibilitas modal edit pada `RatesTable`.
- `RateFormDialog`: Komponen formulir responsif (Drawer di mobile, Dialog di desktop).
- `ResponsiveDialog`: Pembungkus adapter yang mengarahkan ke Drawer atau Dialog sesuai deteksi ukuran layar `useIsMobile()`.

### 2.2 Analisis Kata Kerja (Verbs / Actions)
- `mountStandby`: Memasang komponen modal edit di DOM sejak awal dengan status `open={false}`.
- `openEdit`: Memicu transisi `open: false -> true` sehingga animasi *slide-up* (mobile) dan *zoom-fade* (desktop) terpicu sempurna.
- `closeEdit`: Memicu transisi `open: true -> false` dan memberikan jeda waktu *grace period* 350ms sebelum me-reset data aktif.

---

## 3. Knowledge Enrichment & Standard Patterns

### Referensi 1: Base UI Drawer & Dialog CSS Mount Transition Mechanics
- **Sumber:** `@base-ui/react/drawer` & `components/ui/drawer.tsx`.
- **Temuan:** Drawer Base UI menghitung *closed-transform* berdasarkan geometri kontainer viewport. Jika komponen baru di-mount langsung dengan `open={true}`, perhitungan *snap points* dan *starting-style* tidak memiliki referensi posisi awal di luar layar, sehingga browser langsung merender elemen di posisi akhir. Memasang komponen terlebih dahulu dalam keadaan `open={false}` menjamin *starting-style* dan *swipe direction* terinisialisasi secara sempurna.

### Referensi 2: Safe Reset Pattern pada React Hook Form dengan Standby Dialogs
- **Sumber:** `react-hook-form` v7 best practices & Clean Code Standards.
- **Temuan:** Ketika form dialog dipasang secara standby, `reset(defaultValues)` hanya boleh dipanggil saat `open === true` dan `rate` tersedia. Saat modal tertutup, nilai form dibiarkan stabil agar tidak terjadi lonjakan re-render atau error validasi di latar belakang.

---

## 4. Rencana Tugas Atomik (TDD 4-Step Mandatory)

### Task 1: Dukungan Nullable Rate & Cache Lifecycle pada RateFormDialog

**Files:**
- Test: `features/rates/__tests__/rate-form-dialog-lifecycle.test.ts`
- Modify: `features/rates/rate-form-dialog.tsx:36-43` & `features/rates/rate-form-dialog.tsx:66-80`

**Requirements:**
- **Acceptance Criteria**
  1. `RateFormDialogProps` menerima `rate?: RateReference | null` tanpa galat TypeScript.
  2. Komponen `RateFormDialog` dapat dirender dengan aman dalam kondisi `mode="edit"`, `rate={null}`, dan `open={false}` tanpa crash atau memicu kesalahan validasi.
  3. Saat `open` berubah menjadi `true` dengan objek `rate` baru, formulir memuat nilai rute secara akurat.
  4. Ketika `open` berubah menjadi `false`, data rute di-cache sementara agar judul/deskripsi modal tidak kosong sebelum animasi keluar selesai.
- **Functional Requirements**
  - Mencegah error null pointer saat modal edit dalam keadaan standby di DOM.
- **Non-Functional Requirements**
  - Mempertahankan kalkulasi otomatis tonase, sangu supir, dan parameter khusus SBI yang telah berjalan normal.
- **Test Coverage**
  - Resolusi data rute standby dan cache transisi keluar pada `RateFormDialog`.

**Step 1: Write failing test (RED)**
Buat file `features/rates/__tests__/rate-form-dialog-lifecycle.test.ts`:
```ts
import { describe, expect, it } from "vitest"
import { resolveEditRateForLifecycle } from "../rate-form-dialog"
import type { RateReference } from "@/db/schema"

const mockRate: RateReference = {
  id: "rate-1",
  originPlant: "Semen Indonesia (SI) - Tuban",
  clientName: "PT Semen Indonesia",
  city: "SURABAYA",
  cityCode: "SBY01",
  destination: "PROYEK RSUD BDH",
  distanceKm: "120",
  ratePerTon: "100000.00",
  standardTonnage: "31.00",
  sanguPercentage: "0.5200000",
  defaultSangu: "1620000.00",
  additionalTonnageRate: "30000.00",
  hasSpecialDeductions: false,
  isActive: true,
  createdAt: new Date(),
}

describe("RateFormDialog Lifecycle & Cache Logic", () => {
  it("harus mengembalikan null saat dalam mode standby (rate null dan cache null)", () => {
    const active = resolveEditRateForLifecycle(null, null)
    expect(active).toBeNull()
  })

  it("harus menggunakan rate aktif saat modal dibuka dengan data rute", () => {
    const active = resolveEditRateForLifecycle(mockRate, null)
    expect(active).toEqual(mockRate)
  })

  it("harus mempertahankan data rute dari cache saat rate di-clear saat animasi keluar", () => {
    const active = resolveEditRateForLifecycle(null, mockRate)
    expect(active).toEqual(mockRate)
  })
})
```

**Step 2: Verify test fails**
Jalankan:
```bash
pnpm test features/rates/__tests__/rate-form-dialog-lifecycle.test.ts
```
Hasil yang diharapkan: FAIL karena `resolveEditRateForLifecycle` belum diekspor dari `rate-form-dialog.tsx`.

**Step 3: Write minimal implementation (GREEN)**
Modifikasi `features/rates/rate-form-dialog.tsx`:
1. Ekspor fungsi helper:
```tsx
export function resolveEditRateForLifecycle(
  rate: RateReference | null | undefined,
  cachedRate: RateReference | null
): RateReference | null {
  return rate ?? cachedRate ?? null
}
```
2. Perbarui interface `RateFormDialogProps`:
```tsx
interface RateFormDialogProps {
  mode?: "create" | "edit"
  rate?: RateReference | null
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  distinctOriginPlants?: string[]
}
```
3. Di dalam `RateFormDialog`:
```tsx
  const [cachedRate, setCachedRate] = useState<RateReference | null>(rate ?? null)

  useEffect(() => {
    if (rate) {
      setCachedRate(rate)
    }
  }, [rate])

  const activeRate = resolveEditRateForLifecycle(rate, cachedRate)
```
Gunakan `activeRate` pada `useEffect` pre-populate formulir dan judul/deskripsi dialog (`activeRate?.destination`).

**Step 4: Verify test passes & Refactor**
Jalankan:
```bash
pnpm test features/rates/__tests__/rate-form-dialog-lifecycle.test.ts
```
Hasil yang diharapkan: PASS dengan exit code 0.

---

### Task 2: Pemasangan Modal Edit Standby Permanen pada RatesTable

**Files:**
- Modify: `features/rates/rates-table.tsx:767-776`
- Test: `features/rates/__tests__/rate-detail-sheet.test.ts` & `features/rates/__tests__/rate-mobile-card.test.ts`

**Requirements:**
- **Acceptance Criteria**
  1. Modal edit terpasang permanen di dalam DOM tanpa pembungkus `{editingRate && ...}`.
  2. Saat pengguna mengklik "Ubah Tarif" dari kartu mobile, dropdown aksi desktop, atau tombol footer di dalam `RateDetailSheet`, modal edit membuka dengan animasi *slide-up* (mobile) atau *zoom-fade* (desktop) yang persis sama dengan modal create.
  3. Saat modal edit ditutup, animasi penutupan berjalan utuh selama 350ms sebelum objek data dibersihkan.
- **Functional Requirements**
  - Mencegah perusakan instan DOM modal sebelum animasi selesai.
- **Non-Functional Requirements**
  - Memastikan pencarian, filter, pagination, dan tombol hapus rute tetap bekerja tanpa regresi.

**Step 1: Write failing test (RED)**
Verifikasi test suite rute yang ada untuk memastikan baseline lulus sebelum modifikasi:
```bash
pnpm test features/rates/__tests__/
```

**Step 2: Verify test status**
Pastikan seluruh 5 test suite rates berjalan lancar.

**Step 3: Write minimal implementation (GREEN)**
Di `features/rates/rates-table.tsx`:
Ubah baris render modal edit:
```tsx
{/* Edit Dialog Modal: Selalu terpasang di DOM agar transisi buka (slide-up di mobile / zoom-fade di desktop) terpicu mulus sama persis dengan modal create */}
<RateFormDialog
  mode="edit"
  rate={editingRate}
  open={isEditOpen}
  onOpenChange={handleCloseEdit}
  distinctOriginPlants={distinctOriginPlants}
/>
```

**Step 4: Verify test passes & Refactor**
Jalankan verifikasi lengkap:
```bash
pnpm run typecheck
pnpm run test
```
Hasil yang diharapkan: Seluruh pengujian lulus (PASS) dan `tsc` bersih tanpa galat.

---

## 5. Review Kepatuhan & Checklist

- [x] Sesuai dengan Konstitusi Teknis (`Testability-First Architecture`).
- [x] TDD 4-langkah diterapkan pada seluruh tugas atomik.
- [x] Bahasa percakapan dan UI 100% Bahasa Indonesia.
- [x] Menjawab langsung permintaan pengguna untuk menyamakan animasi modal edit dengan modal create.
- [x] Disimpan langsung pada `docs/plans/2026-10-09-rate-edit-modal-animation-22.md`.
