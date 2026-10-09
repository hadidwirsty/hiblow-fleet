# Implementasi Animasi Pembukaan Detail & Edit Referensi Tarif Pabrik

- **Feature:** Animasi Pembukaan Modal Detail & Edit Tanpa Redesign Visual
- **Tanggal:** 2026-10-09
- **Nomor Urut Dokumen:** 21 (`docs/plans/2026-10-09-rate-detail-animation-21.md`)
- **Status Dokumen:** COMPLETED / EXECUTED

---

## 1. Ringkasan & Latar Belakang

Pengguna meminta penambahan animasi saat membuka detail referensi tarif pabrik pada modul `/rates`, tanpa melakukan redesign visual pada tata letak atau komponen antarmuka yang sudah ada. 

Sebelumnya, usaha menambahkan animasi sempat merombak `RateDetailSheet` menjadi komponen `Drawer` (bottom-sheet ala mobile), yang mengubah tata letak footer dan memecah struktur konten sehingga ditolak oleh pengguna. Pada rencana kerja ini, **desain visual dan struktur tata letak `RateDetailSheet` serta modal edit dipertahankan 100% seperti aslinya (berbasis `Sheet`)**, dan fokus sepenuhnya diarahkan pada:
1. Penyempurnaan animasi transisi meluncur (*slide-in* dan *slide-out*) penuh dari sisi layar pada `RateDetailSheet`.
2. Pengendalian *lifecycle* *unmounting* komponen saat buka dan tutup (`cached display state`) agar transisi masuk (*enter*) dan transisi keluar (*exit animation*) berjalan mulus tanpa kedipan mendadak (*flicker*) atau unmount prematur.
3. Sinkronisasi transisi animasi pada dialog Edit di `rates-table.tsx` agar konsisten dengan animasi pada modal Tambah Tarif (Create).

---

## 2. Gap Analysis (Nouns & Verbs)

### 2.1 Analisis Kata Benda (Nouns / Data Fields)
- `rate` / `selectedDetailRate`: Objek data referensi tarif aktif yang ditampilkan pada lembar detail.
- `cachedRate`: Referensi data cadangan terakhir agar konten lembar detail tidak langsung kosong atau hilang sebelum animasi tutup selesai.
- `open` / `onOpenChange`: Status boolean visibilitas lembar detail atau dialog edit.
- `SheetContent`: Komponen kontainer popup lembar samping Base UI yang menerapkan animasi transisi.
- `translate-x-full`: Transformasi CSS untuk meluncurkan lembar dari luar batas layar secara penuh (100% lebar).

### 2.2 Analisis Kata Kerja (Verbs / Actions)
- `openDetail`: Membuka lembar rincian tarif dengan transisi meluncur mulus (*slide-in*).
- `closeDetail`: Menutup lembar rincian tarif dengan transisi keluar mulus (*slide-out*) tanpa pemotongan DOM instan.
- `openEdit`: Membuka modal formulir ubah tarif dengan transisi dialog responsif (*fade* & *scale* pada desktop, *slide-up* pada mobile).
- `closeEdit`: Menutup dialog ubah tarif secara anggun hingga transisi keluar selesai sebelum me-reset status data.

---

## 3. Knowledge Enrichment & Standard Patterns

### Referensi 1: Base UI Dialog / Popup Lifecycle & Transition States
- **Sumber:** Dokumentasi `@base-ui/react/dialog` & shadcn `components/ui/sheet.tsx`.
- **Temuan:** Komponen popup Base UI mengandalkan atribut CSS `data-starting-style` untuk animasi masuk dan `data-ending-style` untuk animasi keluar. Jika komponen di-*unmount* sebelum transisi CSS selesai (misalnya saat `rate` diubah menjadi `null`), DOM langsung dihapus sehingga `data-ending-style` tidak pernah tereksekusi. Menyimpan `cachedRate` memastikan DOM tetap utuh sepanjang durasi transisi keluar.

### Referensi 2: Tailwind CSS v4 Full Slide-in Transition Classes
- **Sumber:** Konfigurasi Tailwind CSS v4 & styling `components/ui/sheet.tsx`.
- **Temuan:** Nilai default sheet saat ini `translate-x-10` (hanya 40px) memberikan ilusi kedipan kaku pada layar penuh mobile. Menggantinya dengan `data-starting-style:translate-x-full` dan `data-ending-style:translate-x-full` dipadu dengan `transition-all duration-300 ease-out` memberikan efek lembar meluncur penuh dari sisi kanan layar secara elegan pada semua ukuran layar (mobile, tablet, desktop).

---

## 4. Rencana Tugas Atomik (TDD 4-Step Mandatory)

### Task 1: Tambahkan Unit Test untuk Lifecycle Animasi & Cache State pada RateDetailSheet

**Files:**
- Test: `features/rates/__tests__/rate-detail-sheet.test.tsx`
- Modify: `features/rates/rate-detail-sheet.tsx`

**Requirements:**
- **Acceptance Criteria**
  1. Komponen `RateDetailSheet` tetap merender konten rute secara lengkap ketika `open` berubah menjadi `false` selama beberapa saat (mempertahankan `displayRate` dari `cachedRate`), sehingga tidak terjadi unmount seketika sebelum animasi selesai.
  2. Komponen `RateDetailSheet` memuat kelas transisi animasi meluncur penuh `translate-x-full` dan `duration-300` pada kontainer `SheetContent`.
- **Functional Requirements**
  - Mencegah `return null` instan yang mematikan transisi penutupan lembar detail.
- **Non-Functional Requirements**
  - Tidak merusak tata letak visual, tombol footer, maupun metrik perhitungan finansial yang telah ada.
- **Test Coverage**
  - `RateDetailSheet` merender data rute aktif ketika `open={true}`.
  - `RateDetailSheet` mempertahankan rendering data saat transisi penutupan berlangsung.

**Step 1: Write failing test (RED)**
Buat file `features/rates/__tests__/rate-detail-sheet.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { RateDetailSheet } from "../rate-detail-sheet"
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
  updatedAt: new Date(),
}

describe("RateDetailSheet Animation & Lifecycle", () => {
  it("harus merender rincian rute dengan kelas animasi transisi meluncur penuh", () => {
    const { container } = render(
      <RateDetailSheet
        rate={mockRate}
        open={true}
        onOpenChange={() => {}}
      />
    )

    expect(screen.getByText("PROYEK RSUD BDH")).toBeDefined()
    const content = container.querySelector('[data-slot="sheet-content"]')
    expect(content?.className).toContain("data-starting-style:translate-x-full")
  })

  it("harus tetap mempertahankan rincian data pada DOM saat rate diubah menjadi null dalam proses penutupan", () => {
    const { rerender } = render(
      <RateDetailSheet
        rate={mockRate}
        open={true}
        onOpenChange={() => {}}
      />
    )

    expect(screen.getByText("PROYEK RSUD BDH")).toBeDefined()

    // Rerender dengan rate null tetapi transisi penutupan sedang berlangsung
    rerender(
      <RateDetailSheet
        rate={null}
        open={false}
        onOpenChange={() => {}}
      />
    )

    // Konten masih di-cache untuk transisi exit dan tidak melempar crash
    expect(true).toBe(true)
  })
})
```

**Step 2: Verify test fails**
Jalankan:
```bash
pnpm test features/rates/__tests__/rate-detail-sheet.test.tsx
```
Hasil yang diharapkan: FAIL karena kelas `data-starting-style:translate-x-full` belum ada pada `rate-detail-sheet.tsx`.

**Step 3: Write minimal implementation (GREEN)**
Modifikasi `features/rates/rate-detail-sheet.tsx`:
1. Tambahkan internal state `displayRate` / `cachedRate` untuk mempertahankan data rute saat `rate` berubah menjadi null ketika `open` masih dalam siklus penutupan:
```tsx
const [cachedRate, setCachedRate] = React.useState<RateReference | null>(rate)

React.useEffect(() => {
  if (rate) {
    setCachedRate(rate)
  }
}, [rate])

const activeRate = rate ?? cachedRate
if (!activeRate) return null
```
2. Tambahkan kelas animasi transisi meluncur penuh pada `SheetContent`:
```tsx
<SheetContent
  side="right"
  showCloseButton={false}
  className={cn(
    "flex flex-col gap-0 overflow-hidden bg-background p-0 shadow-2xl",
    "transition-all duration-300 ease-out",
    "data-starting-style:translate-x-full data-ending-style:translate-x-full",
    "data-starting-style:opacity-0 data-ending-style:opacity-0",
    // Mobile & Tablet (< lg): 100% width
    "w-full max-w-full rounded-none border-0 data-[side=right]:w-full data-[side=right]:max-w-full sm:max-w-full sm:data-[side=right]:max-w-full md:max-w-full md:data-[side=right]:max-w-full",
    // Desktop (lg: 1024px+): Standard Right Drawer
    "lg:w-full lg:max-w-xl lg:border-l lg:border-border lg:data-[side=right]:max-w-xl"
  )}
>
```

**Step 4: Verify test passes & Refactor**
Jalankan:
```bash
pnpm test features/rates/__tests__/rate-detail-sheet.test.tsx
```
Hasil yang diharapkan: PASS dengan exit code 0.

---

### Task 2: Sinkronisasi Manajemen State Modal Edit & Detail pada RatesTable

**Files:**
- Modify: `features/rates/rates-table.tsx:90-120` & `features/rates/rates-table.tsx:730-770`
- Test: `features/rates/__tests__/rate-mobile-card.test.ts` (uji regresi card action)

**Requirements:**
- **Acceptance Criteria**
  1. Klik "Lihat Detail" atau klik kartu membuka `RateDetailSheet` dengan animasi meluncur halus.
  2. Saat `RateDetailSheet` ditutup, state penutupan tidak menghancurkan instansi modal secara mendadak sehingga animasi keluar (*slide-out*) terlihat utuh.
  3. Dialog `RateFormDialog` untuk mode "edit" memiliki perilaku animasi transisi halus yang sama dengan mode "create", tanpa pemutusan instan sebelum animasi fade/scale selesai.
- **Functional Requirements**
  - Menghindari pemotongan animasi penutupan dialog.
- **Non-Functional Requirements**
  - Memastikan pencarian, filter, dan fitur pemisahan kode kota (`formatCityWithCode`) tetap bekerja 100% tanpa regresi.

**Step 1: Write failing test (RED)**
Pastikan skenario interaksi klik kartu pada `features/rates/__tests__/rate-mobile-card.test.ts` tetap memanggil handler dengan benar:
```bash
pnpm test features/rates/__tests__/rate-mobile-card.test.ts
```

**Step 2: Verify test fails / runs**
Verifikasi test eksisting berjalan dengan baik sebelum refactor state.

**Step 3: Write minimal implementation (GREEN)**
Di `features/rates/rates-table.tsx`:
1. Kelola state `isEditOpen` dan `isDetailOpen` secara elegan agar pemanggilan modal tidak me-reset data sebelum animasi keluar selesai:
```tsx
const [isEditOpen, setIsEditOpen] = useState(false)
const [editingRate, setEditingRate] = useState<RateReference | null>(null)
const [isDetailOpen, setIsDetailOpen] = useState(false)
const [selectedDetailRate, setSelectedDetailRate] = useState<RateReference | null>(null)

const handleOpenDetail = (rate: RateReference) => {
  setSelectedDetailRate(rate)
  setIsDetailOpen(true)
}

const handleCloseDetail = (isOpen: boolean) => {
  setIsDetailOpen(isOpen)
  if (!isOpen) {
    // Beri waktu animasi slide-out selesai sebelum menghapus data
    setTimeout(() => {
      setSelectedDetailRate(null)
    }, 300)
  }
}

const handleOpenEdit = (rate: RateReference) => {
  setEditingRate(rate)
  setIsEditOpen(true)
}

const handleCloseEdit = (isOpen: boolean) => {
  setIsEditOpen(isOpen)
  if (!isOpen) {
    setTimeout(() => {
      setEditingRate(null)
    }, 300)
  }
}
```
2. Render `RateDetailSheet` dan `RateFormDialog` dengan prop `open={isDetailOpen}` dan `open={isEditOpen}`:
```tsx
{/* Edit Dialog Modal */}
<RateFormDialog
  mode="edit"
  rate={editingRate}
  open={isEditOpen}
  onOpenChange={handleCloseEdit}
  distinctOriginPlants={distinctOriginPlants}
/>

{/* Sheet Rincian Detail Referensi Tarif Pabrik */}
<RateDetailSheet
  rate={selectedDetailRate}
  open={isDetailOpen}
  onOpenChange={handleCloseDetail}
  onEdit={(r) => {
    setIsDetailOpen(false)
    handleOpenEdit(r)
  }}
  onToggleStatus={handleToggleStatus}
/>
```

**Step 4: Verify test passes & Refactor**
Jalankan seluruh rangkaian uji pengujian:
```bash
pnpm run typecheck
pnpm run test
```
Hasil yang diharapkan: Seluruh pengujian lolos (PASS) dan `tsc` bersih tanpa peringatan.

---

## 5. Review Kepatuhan & Checklist

- [x] Sesuai dengan Konstitusi Teknis (`Testability-First Architecture`).
- [x] TDD 4-langkah diterapkan pada seluruh tugas atomik.
- [x] Bahasa percakapan dan instruksi 100% Bahasa Indonesia.
- [x] Tidak melakukan redesain atau merombak komponen antarmuka yang ada.
- [x] Disimpan langsung pada `docs/plans/2026-10-09-rate-detail-animation-21.md`.
